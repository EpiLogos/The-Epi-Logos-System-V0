import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

/**
 * API Bridge to Agentic CLI for Developer Portal
 * 
 * This endpoint provides a bridge between the web interface and the 
 * comprehensive CLI functionality already built in agentic/cli/
 */

interface CLICommand {
  command: string;
  args?: string[];
  options?: Record<string, unknown>;
}

interface CLIResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  diagnostics?: {
    trace_id: string;
    first_token_ms?: number;
    total_ms?: number;
    sse_events: number;
    sse_bytes: number;
  };
}

// Real CLI implementation using subprocess integration
async function executeCLICommand(command: CLICommand): Promise<CLIResponse> {
  return new Promise((resolve) => {
    // Use absolute path to project root 
    const projectRoot = '/Users/admin/Documents/The Epi-Logos System V0';
    const pythonPath = `${projectRoot}/.venv/bin/python`;
    const startTime = Date.now();
    
    // Build the CLI command arguments
    const cliArgs: string[] = [];
    
    switch (command.command) {
      case 'models':
        cliArgs.push('--models');
        break;
      case 'doctor':
        cliArgs.push('doctor');
        break;
      case 'persona_models':
        cliArgs.push('persona-models');
        break;
      case 'capabilities':
        // Use models command to get capabilities info
        cliArgs.push('--models');
        break;
      case 'diagnostics':
        // Use chat command with status to get diagnostics
        cliArgs.push('chat', '--no-stream');
        break;
      default:
        // Handle chat commands with /command syntax
        cliArgs.push('chat', '--no-stream');
        break;
    }
    
    console.log(`Executing CLI command: ${pythonPath} -m agentic.cli ${cliArgs.join(' ')}`);
    
    // Spawn the Python CLI process with full venv path
    const child = spawn(pythonPath, ['-m', 'agentic.cli', ...cliArgs], {
      cwd: projectRoot,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PYTHONPATH: projectRoot,
        // Agentic CLI specific variables
        AGENTIC_USER_ID: 'web-cli-user',
        AGENTIC_DEFAULT_MODEL: 'gemini:gemini-2.5-flash',
        // Ensure all API keys are passed through
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
        // Database connections for orchestrator
        REDIS_URL: process.env.REDIS_URL,
        MONGODB_URI: process.env.MONGODB_URI,
        NEO4J_URI: process.env.NEO4J_URI,
        NEO4J_USERNAME: process.env.NEO4J_USERNAME,
        NEO4J_PASSWORD: process.env.NEO4J_PASSWORD,
      }
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });
    
    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });
    
    child.on('close', (code: number | null) => {
      const endTime = Date.now();
      const totalMs = endTime - startTime;
      
      if (code === 0) {
        // Parse CLI output based on command type
        try {
          const parsedData = parseCLIOutput(command.command, stdout);
          resolve({
            success: true,
            data: parsedData,
            diagnostics: {
              trace_id: `cli-${startTime}`,
              total_ms: totalMs,
              sse_events: 0,
              sse_bytes: stdout.length
            }
          });
        } catch (parseError) {
          resolve({
            success: false,
            error: `Failed to parse CLI output: ${parseError}`,
          });
        }
      } else {
        resolve({
          success: false,
          error: `CLI command failed with code ${code}: ${stderr || stdout}`,
        });
      }
    });
    
    child.on('error', (error: Error) => {
      resolve({
        success: false,
        error: `Failed to spawn CLI process: ${error.message}`,
      });
    });
    
    // Handle chat commands by sending the command through stdin
    if (!['models', 'doctor', 'persona_models', 'capabilities'].includes(command.command)) {
      let chatCommand = '';
      if (command.command === 'diagnostics') {
        // For diagnostics, we want to get status and recent activity
        chatCommand = `/status\n/exit\n`;
      } else {
        chatCommand = `/${command.command}${command.args ? ' ' + command.args.join(' ') : ''}\n/exit\n`;
      }
      child.stdin?.write(chatCommand);
      child.stdin?.end();
    }
  });
}

// Parse CLI output based on command type
function parseCLIOutput(commandType: string, output: string): unknown {
  switch (commandType) {
    case 'models':
    case 'capabilities':
      return parseModelsOutput(output);
    
    case 'personas':
      return parsePersonasOutput(output);
    
    case 'status':
      return parseStatusOutput(output);
    
    case 'doctor':
      return parseDoctorOutput(output);
    
    case 'persona_models':
      return parsePersonaModelsOutput(output);
    
    default:
      // For chat commands, return the output as-is
      return { output: output.trim() };
  }
}

function parseModelsOutput(output: string): unknown {
  // Parse the Rich table output from the CLI models command
  const lines = output.split('\n');
  const models: Array<{ name: string; provider: string; ready: boolean }> = [];
  let defaultModel = '';
  const currentModel = '';
  
  let inTable = false;
  for (const line of lines) {
    // Parse model table rows - look for lines with model info
    if (inTable && line.trim() && !line.includes('━') && !line.includes('Model')) {
      // Handle the Rich table format with proper spacing
      const trimmed = line.trim();
      
      // Split by multiple spaces to handle table columns
      const parts = trimmed.split(/\s{2,}/).filter(part => part.trim());
      
      if (parts.length >= 3) {
        const modelPart = parts[0].trim();
        const provider = parts[1].trim(); 
        const ready = parts[2].trim() === 'yes';
        
        // Remove marker indicators (• or *) and extract model name
        const name = modelPart.replace(/^[*•]\s*/, '').trim();
        
        if (modelPart.includes('•')) {
          defaultModel = name;
        }
        
        if (name) {
          models.push({ 
            name, 
            provider: provider || 'unknown', 
            ready 
          });
        }
      }
    } else if (line.includes('Model') && line.includes('Provider') && line.includes('Ready')) {
      inTable = true;
    }
  }
  
  return {
    models,
    default_model: defaultModel,
    current_model: currentModel || defaultModel
  };
}

function parsePersonasOutput(output: string): unknown {
  const lines = output.split('\n');
  const personas: string[] = [];
  let currentPersona = '';
  
  let inTable = false;
  for (const line of lines) {
    if (inTable && line.trim() && !line.includes('─') && !line.includes('Key')) {
      const nameCell = line.trim();
      if (nameCell) {
        const name = nameCell.replace(/^[*•]\s*/, '');
        if (nameCell.startsWith('*')) {
          currentPersona = name;
        }
        personas.push(name);
      }
    } else if (line.includes('Key')) {
      inTable = true;
    }
  }
  
  return {
    personas,
    current_persona: currentPersona
  };
}

function parseStatusOutput(output: string): unknown {
  const lines = output.split('\n');
  const status: Record<string, string | number> = {};
  
  let inTable = false;
  for (const line of lines) {
    if (inTable && line.includes('│')) {
      const parts = line.split('│').map(p => p.trim()).filter(p => p);
      if (parts.length >= 2) {
        const key = parts[0];
        const value = parts[1];
        
        // Convert numeric values
        if (key.includes('_ms') && !isNaN(Number(value))) {
          status[key] = Number(value);
        } else {
          status[key] = value;
        }
      }
    } else if (line.includes('Session Status')) {
      inTable = true;
    }
  }
  
  return status;
}

function parseDoctorOutput(output: string): unknown {
  const lines = output.split('\n');
  const diagnostics: Record<string, unknown> = {};
  
  for (const line of lines) {
    if (line.includes('Capabilities:')) {
      const match = line.match(/default=(\S+) models=(\d+)/);
      if (match) {
        diagnostics.default_model = match[1];
        diagnostics.models_count = Number(match[2]);
      }
    } else if (line.includes('Personas:')) {
      const match = line.match(/Personas: (.+)/);
      if (match) {
        diagnostics.personas_available = match[1].replace(/[\[\]']/g, '').split(', ');
      }
    } else if (line.includes('Streaming:')) {
      diagnostics.streaming_supported = line.includes('PASS');
      const msMatch = line.match(/first_token_ms=(\d+)/);
      if (msMatch) {
        diagnostics.first_token_ms = Number(msMatch[1]);
      }
    }
  }
  
  return diagnostics;
}

function parsePersonaModelsOutput(output: string): unknown {
  const lines = output.split('\n');
  const assignments: Record<string, string> = {};
  const validation: Record<string, boolean> = {};
  
  let inTable = false;
  for (const line of lines) {
    if (inTable && line.includes('│')) {
      const parts = line.split('│').map(p => p.trim()).filter(p => p);
      if (parts.length >= 4) {
        const persona = parts[0].toLowerCase();
        const model = parts[1];
        const status = parts[2];
        
        assignments[persona] = model;
        validation[persona] = status.includes('✅');
      }
    } else if (line.includes('Persona') && line.includes('Model')) {
      inTable = true;
    }
  }
  
  return {
    assignments,
    validation
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CLICommand;
    
    if (!body.command) {
      return NextResponse.json(
        { success: false, error: 'Command is required' },
        { status: 400 }
      );
    }

    const result = await executeCLICommand(body);
    
    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    });
    
  } catch (error) {
    console.error('CLI Bridge Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to execute CLI command',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const command = searchParams.get('command');
  
  if (!command) {
    return NextResponse.json(
      { success: false, error: 'Command parameter is required' },
      { status: 400 }
    );
  }

  try {
    const result = await executeCLICommand({ command });
    return NextResponse.json(result);
  } catch (error) {
    console.error('CLI Bridge GET Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to execute CLI command'
      },
      { status: 500 }
    );
  }
}