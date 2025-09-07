import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import * as path from 'path';

/**
 * WebSocket/SSE Bridge for CLI Streaming
 * 
 * This endpoint provides real-time streaming capabilities that bridge
 * the CLI's AG-UI Protocol streaming functionality to web SSE.
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
    const { message, persona = 'system', model = 'gemini:gemini-2.5-flash', stream_timeout = 10 } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const encoder = new TextEncoder();
    const projectRoot = path.resolve(process.cwd());
    
    const stream = new ReadableStream({
      start(controller) {
        const startTime = Date.now();
        let firstTokenTime: number | null = null;
        let totalBytes = 0;
        let eventCount = 0;
        const traceId = `stream-${startTime}`;
        
        // Build CLI command for streaming chat
        const cliArgs = [
          'chat',
          '--stream',
          '--stream-timeout', stream_timeout.toString(),
          '--persona', persona,
          '--model', model,
          '--debug', // Enable debug output for diagnostics
          '--trace', // Enable trace output for diagnostics  
          '--stats'  // Enable per-turn stats
        ];
        
        console.log(`Starting CLI stream: python -m agentic.cli ${cliArgs.join(' ')}`);
        
        // Spawn the Python CLI process
        const child = spawn('python', ['-m', 'agentic.cli', ...cliArgs], {
          cwd: projectRoot,
          stdio: ['pipe', 'pipe', 'pipe'],
          env: {
            ...process.env,
            PYTHONPATH: projectRoot,
            AGENTIC_USER_ID: 'web-stream-user',
            AGENTIC_DEFAULT_MODEL: model,
          }
        });
        
        let accumulatedOutput = '';
        let isResponseStarted = false;
        
        // Handle stdout - this contains the actual response
        child.stdout?.on('data', (data: Buffer) => {
          const chunk = data.toString();
          accumulatedOutput += chunk;
          
          // Look for assistant response marker
          if (chunk.includes('assistant:') && !isResponseStarted) {
            isResponseStarted = true;
            if (firstTokenTime === null) {
              firstTokenTime = Date.now() - startTime;
            }
          }
          
          // Stream response content if we're in response mode
          if (isResponseStarted) {
            // Extract just the response content (after "assistant: ")
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.trim() && !line.includes('assistant:')) {
                const content = line.trim();
                if (content) {
                  eventCount++;
                  totalBytes += content.length;
                  
                  const streamMessage: StreamMessage = {
                    content,
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
              }
            }
          }
        });
        
        // Handle stderr - this contains diagnostics and debug info
        child.stderr?.on('data', (data: Buffer) => {
          const errorOutput = data.toString();
          console.warn('CLI stderr:', errorOutput);
          
          // Look for diagnostic information in stderr
          if (errorOutput.includes('latency:')) {
            const match = errorOutput.match(/latency: (\d+) ms/);
            if (match) {
              const latencyMs = parseInt(match[1]);
              // Could send diagnostic update here if needed
            }
          }
        });
        
        // Handle process completion
        child.on('close', (code: number | null) => {
          console.log(`CLI process closed with code: ${code}`);
          
          // Send final message with complete diagnostics
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
            success: code === 0
          };
          
          const finalData = `data: ${JSON.stringify(finalMessage)}\n\n`;
          controller.enqueue(encoder.encode(finalData));
          controller.close();
        });
        
        // Handle process errors
        child.on('error', (error: Error) => {
          console.error('CLI process error:', error);
          
          const errorMessage = {
            content: '',
            persona,
            model,
            timestamp: new Date().toISOString(),
            error: `CLI process error: ${error.message}`,
            final: true,
            success: false
          };
          
          const errorData = `data: ${JSON.stringify(errorMessage)}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        });
        
        // Send the user message to the CLI
        const userInput = `${message}\n/exit\n`;
        child.stdin?.write(userInput);
        child.stdin?.end();
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
    console.error('Streaming Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to start stream',
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
  // Health check for streaming endpoint
  return new Response(
    JSON.stringify({ 
      status: 'ready',
      streaming_supported: true,
      ag_ui_protocol: true
    }),
    { 
      headers: { 'Content-Type': 'application/json' }
    }
  );
}