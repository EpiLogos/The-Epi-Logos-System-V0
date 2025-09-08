import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import * as path from 'path';

/**
 * Direct Pydantic AI Streaming Endpoint
 * 
 * Bypasses CLI complexity and connects directly to Pydantic AI dynamic orchestrator.
 */

interface StreamMessage {
  content: string;
  persona: string;
  model: string;
  timestamp: string;
  diagnostics?: {
    trace_id: string;
    first_token_ms?: number;
    total_ms?: number;
    sse_events: number;
    sse_bytes: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, persona = 'system', model = 'openai:gpt-4o-mini' } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const encoder = new TextEncoder();
    const projectRoot = path.resolve(process.cwd());
    
    const stream = new ReadableStream({
      async start(controller) {
        const startTime = Date.now();
        let firstTokenTime: number | null = null;
        let totalBytes = 0;
        let eventCount = 0;
        const traceId = `pydantic-${startTime}`;
        
        console.log(`🤖 Direct Pydantic AI: ${model} with persona ${persona}`);
        
        try {
          // Create Python script to call Pydantic AI directly
          const pythonScript = `
import asyncio
import sys
import os
import json
sys.path.append("${projectRoot}")

async def main():
    try:
        from agentic.orchestrator.dynamic_agent import dynamic_orchestrator
        
        # Check model availability
        available_models = dynamic_orchestrator.get_available_models()
        if "${model}" not in available_models:
            error_msg = f"Model ${model} not available. Available: {list(available_models.keys())}"
            print(json.dumps({"error": error_msg}), file=sys.stderr)
            return
            
        print("🚀 Streaming with Pydantic AI...", file=sys.stderr, flush=True)
        
        # Stream the response
        async for chunk in dynamic_orchestrator.run_streaming_with_model(
            model_spec="${model}",
            message="""${message.replace(/"/g, '\\"')}""",
            session_id="web-${Date.now()}",
            user_id="web-user",
            persona="${persona}",
            context=None
        ):
            if chunk and chunk.strip():
                print(chunk, end="", flush=True)
                
    except Exception as e:
        error_data = {"error": f"Pydantic AI error: {str(e)}"}
        print(json.dumps(error_data), file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)

if __name__ == "__main__":
    asyncio.run(main())
`;

          // Write temporary script
          const fs = await import('fs');
          const scriptPath = path.join(projectRoot, `pydantic_stream_${Date.now()}.py`);
          fs.writeFileSync(scriptPath, pythonScript);
          
          // Execute Python script
          const child = spawn('python', [scriptPath], {
            cwd: projectRoot,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: {
              ...process.env,
              PYTHONPATH: projectRoot,
            }
          });
          
          let fullResponse = '';
          
          // Handle streaming response
          child.stdout?.on('data', (data: Buffer) => {
            const chunk = data.toString();
            fullResponse += chunk;
            
            if (firstTokenTime === null && chunk.trim()) {
              firstTokenTime = Date.now() - startTime;
            }
            
            if (chunk.trim()) {
              eventCount++;
              totalBytes += chunk.length;
              
              const streamMessage: StreamMessage = {
                content: chunk,
                persona,
                model,
                timestamp: new Date().toISOString(),
                diagnostics: {
                  trace_id: traceId,
                  first_token_ms: firstTokenTime,
                  total_ms: Date.now() - startTime,
                  sse_events: eventCount,
                  sse_bytes: totalBytes
                }
              };
              
              const sseData = `data: ${JSON.stringify(streamMessage)}\n\n`;
              controller.enqueue(encoder.encode(sseData));
            }
          });
          
          // Handle errors and info
          child.stderr?.on('data', (data: Buffer) => {
            const output = data.toString();
            console.log('Pydantic AI:', output);
            
            // Check for error JSON
            try {
              const errorData = JSON.parse(output);
              if (errorData.error) {
                const errorMessage = {
                  content: '',
                  persona,
                  model,
                  timestamp: new Date().toISOString(),
                  error: errorData.error,
                  final: true,
                  success: false
                };
                
                const errorSse = `data: ${JSON.stringify(errorMessage)}\n\n`;
                controller.enqueue(encoder.encode(errorSse));
                controller.close();
              }
            } catch (e) {
              // Not JSON, just log
            }
          });
          
          // Handle completion
          child.on('close', (code: number | null) => {
            // Clean up script
            try {
              fs.unlinkSync(scriptPath);
            } catch (e) {
              console.warn('Could not cleanup script:', e);
            }
            
            console.log(`Pydantic AI completed with code: ${code}`);
            
            // Send final message
            const finalMessage = {
              content: '',
              persona,
              model,
              timestamp: new Date().toISOString(),
              diagnostics: {
                trace_id: traceId,
                first_token_ms: firstTokenTime,
                total_ms: Date.now() - startTime,
                sse_events: eventCount,
                sse_bytes: totalBytes
              },
              final: true,
              success: code === 0,
              response_length: fullResponse.length
            };
            
            const finalSse = `data: ${JSON.stringify(finalMessage)}\n\n`;
            controller.enqueue(encoder.encode(finalSse));
            controller.close();
          });
          
          child.on('error', (error: Error) => {
            console.error('Process error:', error);
            
            // Clean up script
            try {
              fs.unlinkSync(scriptPath);
            } catch (e) {}
            
            const errorMessage = {
              content: '',
              persona,
              model,
              timestamp: new Date().toISOString(),
              error: `Process error: ${error.message}`,
              final: true,
              success: false
            };
            
            const errorSse = `data: ${JSON.stringify(errorMessage)}\n\n`;
            controller.enqueue(encoder.encode(errorSse));
            controller.close();
          });
          
        } catch (error) {
          console.error('Setup error:', error);
          
          const errorMessage = {
            content: '',
            persona,
            model,
            timestamp: new Date().toISOString(),
            error: `Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            final: true,
            success: false
          };
          
          const errorSse = `data: ${JSON.stringify(errorMessage)}\n\n`;
          controller.enqueue(encoder.encode(errorSse));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('Stream Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to start Pydantic AI stream',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function GET(_request: NextRequest) {
  // Health check for direct Pydantic AI endpoint
  return new Response(
    JSON.stringify({ 
      status: 'ready',
      streaming_supported: true,
      pydantic_ai_direct: true,
      description: 'Direct Pydantic AI streaming without CLI dependency'
    }),
    { 
      headers: { 'Content-Type': 'application/json' }
    }
  );
}