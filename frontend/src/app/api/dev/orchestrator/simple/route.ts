import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import * as path from 'path';

/**
 * Ultra-Simple Pydantic AI Endpoint
 * 
 * No streaming, no complex schemas, no tools - just works.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, persona = 'system', sessionId, model = 'gemini-2.5-flash' } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const projectRoot = path.resolve(process.cwd());
    console.log(`🤖 Simple Pydantic AI: ${persona} processing message`);

    try {
      // Create ultra-simple Python script
      const pythonScript = `
import asyncio
import sys
import os
import json
sys.path.append("${projectRoot}")

async def main():
    try:
        from agentic.agents.agent_runner import AgentRunner
        from agentic.orchestrator.session import OrchestratorSessionManager, OrchestratorSession
        from agentic.orchestrator.conversation import ConversationManager
        # Debug environment for Redis
        import sys
        from urllib.parse import urlparse
        ru = os.getenv('REDIS_URL') or ''
        print(f"PYTHON_EXEC={sys.executable}", file=sys.stderr)
        try:
            import redis as _r
            print(f"redis_py_version={_r.__version__}", file=sys.stderr)
        except Exception:
            print("redis_py_version=unknown", file=sys.stderr)
        print(f"REDIS_URL={ru}", file=sys.stderr)
        
        # Minimal bimba client stub to satisfy tool deps
        class _BimbaClient:
            async def resolve_coordinate(self, coordinate: str):
                return {"content": None, "context": {"coordinate": coordinate}}

        # Init infra managers
        session_manager = OrchestratorSessionManager()
        conversation_manager = ConversationManager()

        # Resolve or create session
        incoming_session_id = ${sessionId ? `"${String(sessionId).replace(/"/g, '\\"')}"` : 'None'}
        session = None
        if incoming_session_id:
            session = session_manager.get_session(incoming_session_id)
        if session is None:
            session = session_manager.create_session(user_id="web-user", persona="${persona}")
        else:
            # Ensure persona is set per request
            session_manager.update_session(session.session_id, persona="${persona}")
            session = session_manager.get_session(session.session_id)

        # Run agent with structured output (auto-hydrates history)
        runner = AgentRunner()
        result = await runner.run_with_structured_output(
            message="""${message.replace(/"/g, '\\"')}""",
            session=session,
            session_manager=session_manager,
            conversation_manager=conversation_manager,
            bimba_client=_BimbaClient(),
            model_name="${model}"
        )

        # Attach session id for continuity
        result["session_id"] = session.session_id
        print(json.dumps(result, default=str))
        
    except Exception as e:
        result = {"error": f"Simple agent error: {str(e)}"}
        print(json.dumps(result, default=str))

if __name__ == "__main__":
    asyncio.run(main())
`;

      const fs = await import('fs');
      // Load env fallbacks from repo root if Next runtime didn't load them
      const parseEnvFile = (p: string): Record<string, string> => {
        try {
          if (!fs.existsSync(p)) return {};
          const raw = fs.readFileSync(p, 'utf8');
          const out: Record<string, string> = {};
          for (const line of raw.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const idx = trimmed.indexOf('=');
            if (idx === -1) continue;
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim();
            if (key) out[key] = val.replace(/^"|"$/g, '');
          }
          return out;
        } catch (e) {
          return {};
        }
      };
      const rootEnv = parseEnvFile(path.join(projectRoot, '.env'));
      const getEnv = (k: string) => process.env[k] || rootEnv[k];

      // Use only root .env values - no more multiple env files
      const redisUrl = rootEnv['REDIS_URL'] || undefined;
      const mongoUri = getEnv('MONGODB_URI') || getEnv('MONGODB_URL');
      const mongoDb = getEnv('MONGODB_DATABASE') || 'epilogos_db';
      const geminiKey = rootEnv['GEMINI_API_KEY'];
      const openaiKey = rootEnv['OPENAI_API_KEY'];
      const anthropicKey = rootEnv['ANTHROPIC_API_KEY'];
      const scriptPath = path.join(projectRoot, `simple_${Date.now()}.py`);
      fs.writeFileSync(scriptPath, pythonScript);
      
      // Decide Python interpreter (prefer repo root venv)
      const pyFromVenvUnix = path.join(projectRoot, '.venv', 'bin', 'python');
      const pyFromVenvUnix3 = path.join(projectRoot, '.venv', 'bin', 'python3');
      const pyFromVenvWin = path.join(projectRoot, '.venv', 'Scripts', 'python.exe');
      const pyCmd = (fs.existsSync(pyFromVenvUnix) && pyFromVenvUnix)
        || (fs.existsSync(pyFromVenvUnix3) && pyFromVenvUnix3)
        || (fs.existsSync(pyFromVenvWin) && pyFromVenvWin)
        || 'python3';

      // Execute and wait for result
      const result = await new Promise<string>((resolve, reject) => {
        const child = spawn(pyCmd, [scriptPath], {
          cwd: projectRoot,
          stdio: ['pipe', 'pipe', 'pipe'],
          env: {
            ...process.env,
            PYTHONPATH: projectRoot,
            ...(redisUrl ? { REDIS_URL: redisUrl } : {}),
            ...(mongoUri ? { MONGODB_URI: mongoUri } : {}),
            ...(mongoDb ? { MONGODB_DATABASE: mongoDb } : {}),
            ...(geminiKey ? { GEMINI_API_KEY: geminiKey } : {}),
            ...(openaiKey ? { OPENAI_API_KEY: openaiKey } : {}),
            ...(anthropicKey ? { ANTHROPIC_API_KEY: anthropicKey } : {}),
          }
        });
        
        let output = '';
        let error = '';
        
        child.stdout?.on('data', (data) => {
          output += data.toString();
        });
        
        child.stderr?.on('data', (data) => {
          error += data.toString();
          console.log('Simple agent info:', data.toString());
        });
        
        child.on('close', (code) => {
          // Clean up
          try {
            fs.unlinkSync(scriptPath);
          } catch (e) {}
          
          if (code === 0) {
            resolve(output.trim());
          } else {
            reject(new Error(`Process failed with code ${code}: ${error}`));
          }
        });
        
        child.on('error', (err) => {
          try {
            fs.unlinkSync(scriptPath);
          } catch (e) {}
          reject(err);
        });
      });
      
      // Parse the JSON result
      const parsedResult = JSON.parse(result);
      
      return new Response(
        JSON.stringify(parsedResult),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );

    } catch (error) {
      console.error('Simple endpoint error:', error);
      
      return new Response(
        JSON.stringify({ 
          error: 'Simple Pydantic AI failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Request parsing error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Invalid request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function GET(_request: NextRequest) {
  return new Response(
    JSON.stringify({ 
      status: 'ready',
      description: 'Ultra-simple Pydantic AI endpoint - no streaming, just works'
    }),
    { 
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
