import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import * as path from 'path';

/**
 * Get Available Pydantic AI Models
 * 
 * Returns list of supported models with their availability status based on API keys
 */

export async function GET(request: NextRequest) {
  try {
    const projectRoot = path.resolve(process.cwd());

    const pythonScript = `
import asyncio
import os
import json
import sys
sys.path.append("${projectRoot}")

async def main():
    try:
        from pydantic_ai import Agent
        from pydantic import BaseModel
        
        class SimpleOutput(BaseModel):
            response: str
        
        # Get configured models from environment
        models_to_test = []
        
        # Gemini model from env
        gemini_model = os.getenv('GEMINI_MODEL')
        if gemini_model and os.getenv('GEMINI_API_KEY'):
            models_to_test.append({
                "id": gemini_model,
                "name": f"Gemini {gemini_model.replace('gemini-', '').replace('-', ' ').title()}",
                "provider": "Google",
                "description": f"Configured Gemini model: {gemini_model}"
            })
        
        # OpenAI model from env
        openai_model = os.getenv('OPENAI_MODEL')
        if openai_model and os.getenv('OPENAI_API_KEY'):
            models_to_test.append({
                "id": f"openai:{openai_model}",
                "name": f"OpenAI {openai_model.upper()}",
                "provider": "OpenAI",
                "description": f"Configured OpenAI model: {openai_model}"
            })
        
        # Anthropic model from env
        anthropic_model = os.getenv('ANTHROPIC_MODEL')
        if anthropic_model and os.getenv('ANTHROPIC_API_KEY'):
            models_to_test.append({
                "id": f"anthropic:{anthropic_model}",
                "name": f"Claude {anthropic_model.replace('claude-', '').replace('-', ' ').title()}",
                "provider": "Anthropic",
                "description": f"Configured Claude model: {anthropic_model}"
            })
        
        # Deepseek model from env
        deepseek_model = os.getenv('DATABASE_MODEL')  # Using DATABASE_MODEL for deepseek
        if deepseek_model and os.getenv('DEEPSEEK_API_KEY'):
            models_to_test.append({
                "id": f"deepseek:{deepseek_model}",
                "name": f"DeepSeek {deepseek_model.replace('deepseek-', '').replace('-', ' ').title()}",
                "provider": "DeepSeek",
                "description": f"Configured DeepSeek model: {deepseek_model}"
            })
        
        available_models = []
        
        for model_info in models_to_test:
            try:
                # Try to create agent with this model
                agent = Agent(model_info["id"], output_type=SimpleOutput)
                model_info["available"] = True
                model_info["error"] = None
            except Exception as e:
                model_info["available"] = False
                model_info["error"] = str(e)
            
            available_models.append(model_info)
        
        # Count available by provider
        providers = {}
        for model in available_models:
            provider = model["provider"]
            if provider not in providers:
                providers[provider] = {"total": 0, "available": 0}
            providers[provider]["total"] += 1
            if model["available"]:
                providers[provider]["available"] += 1
        
        result = {
            "success": True,
            "models": available_models,
            "providers": providers,
            "total_models": len(available_models),
            "available_models": len([m for m in available_models if m["available"]])
        }
        
        print(json.dumps(result, default=str))
        
    except Exception as e:
        result = {"success": False, "error": str(e)}
        print(json.dumps(result, default=str))

if __name__ == "__main__":
    asyncio.run(main())
`;

    const fs = await import('fs');
    
    // Parse .env file
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
    const geminiKey = rootEnv['GEMINI_API_KEY'];
    const openaiKey = rootEnv['OPENAI_API_KEY']; 
    const anthropicKey = rootEnv['ANTHROPIC_API_KEY'];

    const scriptPath = path.join(projectRoot, `models_${Date.now()}.py`);
    fs.writeFileSync(scriptPath, pythonScript);
    
    // Python interpreter
    const pyFromVenvUnix = path.join(projectRoot, '.venv', 'bin', 'python');
    const pyFromVenvUnix3 = path.join(projectRoot, '.venv', 'bin', 'python3');
    const pyFromVenvWin = path.join(projectRoot, '.venv', 'Scripts', 'python.exe');
    const pyCmd = (fs.existsSync(pyFromVenvUnix) && pyFromVenvUnix)
      || (fs.existsSync(pyFromVenvUnix3) && pyFromVenvUnix3)
      || (fs.existsSync(pyFromVenvWin) && pyFromVenvWin)
      || 'python3';

    // Execute and get models list
    const result = await new Promise<string>((resolve, reject) => {
      const child = spawn(pyCmd, [scriptPath], {
        cwd: projectRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PYTHONPATH: projectRoot,
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
    
    const parsedResult = JSON.parse(result);
    
    return new Response(
      JSON.stringify(parsedResult),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );

  } catch (error) {
    console.error('Models endpoint error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to get available models',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}