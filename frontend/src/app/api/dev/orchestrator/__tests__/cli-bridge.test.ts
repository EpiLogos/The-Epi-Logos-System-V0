/**
 * @jest-environment jsdom
 */
import { NextRequest } from 'next/server';
import { POST, GET } from '../cli-bridge/route';

// Mock NextResponse for testing
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: (body: any, init?: ResponseInit) => {
        return new Response(JSON.stringify(body), {
          status: init?.status || 200,
          headers: { 'Content-Type': 'application/json', ...init?.headers }
        });
      }
    }
  };
});

// Mock NextRequest
const createMockRequest = (body?: any, searchParams?: URLSearchParams): NextRequest => {
  const url = searchParams 
    ? `http://localhost:3000/api/dev/orchestrator/cli-bridge?${searchParams.toString()}`
    : 'http://localhost:3000/api/dev/orchestrator/cli-bridge';
    
  const request = new Request(url, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  
  return request as NextRequest;
};

describe('/api/dev/orchestrator/cli-bridge', () => {
  describe('POST endpoint', () => {
    test('handles models command successfully', async () => {
      const request = createMockRequest({ command: 'models' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('models');
      expect(data.data).toHaveProperty('default_model');
      expect(data.data).toHaveProperty('current_model');
      expect(Array.isArray(data.data.models)).toBe(true);
    });

    test('handles personas command successfully', async () => {
      const request = createMockRequest({ command: 'personas' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('personas');
      expect(data.data).toHaveProperty('current_persona');
      expect(Array.isArray(data.data.personas)).toBe(true);
      expect(data.data.personas).toContain('nara');
      expect(data.data.personas).toContain('epii');
      expect(data.data.personas).toContain('system');
    });

    test('handles status command successfully', async () => {
      const request = createMockRequest({ command: 'status' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('session_id');
      expect(data.data).toHaveProperty('model_name');
      expect(data.data).toHaveProperty('active_persona');
      expect(data.data).toHaveProperty('system_hash');
      expect(data.data).toHaveProperty('streaming_enabled');
      expect(data.data).toHaveProperty('stream_timeout');
    });

    test('handles capabilities command successfully', async () => {
      const request = createMockRequest({ command: 'capabilities' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('models_count');
      expect(data.data).toHaveProperty('personas_available');
      expect(data.data).toHaveProperty('streaming_supported');
      expect(data.data).toHaveProperty('ag_ui_protocol');
      expect(typeof data.data.models_count).toBe('number');
      expect(Array.isArray(data.data.personas_available)).toBe(true);
    });

    test('returns error for unknown command', async () => {
      const request = createMockRequest({ command: 'unknown_command' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unknown command');
    });

    test('returns error when command is missing', async () => {
      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Command is required');
    });

    test('handles malformed JSON gracefully', async () => {
      const request = new Request('http://localhost:3000/api/dev/orchestrator/cli-bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ invalid json'
      }) as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to execute CLI command');
    });

    test('includes command arguments in request', async () => {
      const request = createMockRequest({ 
        command: 'use', 
        args: ['gemini:gemini-2.5-pro'] 
      });
      
      // This should still work with our mock implementation
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400); // Expected since 'use' is not implemented in mock
      expect(data.success).toBe(false);
    });

    test('includes options in request', async () => {
      const request = createMockRequest({ 
        command: 'stream',
        options: { enabled: true, timeout: 15 }
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400); // Expected since 'stream' is not implemented in mock
      expect(data.success).toBe(false);
    });
  });

  describe('GET endpoint', () => {
    test('handles models command via GET', async () => {
      const searchParams = new URLSearchParams({ command: 'models' });
      const request = createMockRequest(null, searchParams);
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('models');
    });

    test('handles personas command via GET', async () => {
      const searchParams = new URLSearchParams({ command: 'personas' });
      const request = createMockRequest(null, searchParams);
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('personas');
    });

    test('returns error when command parameter is missing', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Command parameter is required');
    });

    test('handles unknown command via GET', async () => {
      const searchParams = new URLSearchParams({ command: 'invalid' });
      const request = createMockRequest(null, searchParams);
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unknown command');
    });
  });

  describe('Response format validation', () => {
    test('models response has correct structure', async () => {
      const request = createMockRequest({ command: 'models' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.data.models).toBeInstanceOf(Array);
      data.data.models.forEach((model: any) => {
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('provider');
        expect(model).toHaveProperty('ready');
        expect(typeof model.name).toBe('string');
        expect(typeof model.provider).toBe('string');
        expect(typeof model.ready).toBe('boolean');
      });
    });

    test('status response has correct structure', async () => {
      const request = createMockRequest({ command: 'status' });
      const response = await POST(request);
      const data = await response.json();

      expect(typeof data.data.session_id).toBe('string');
      expect(typeof data.data.model_name).toBe('string');
      expect(typeof data.data.active_persona).toBe('string');
      expect(typeof data.data.system_hash).toBe('string');
      expect(typeof data.data.streaming_enabled).toBe('boolean');
      expect(typeof data.data.stream_timeout).toBe('number');
    });

    test('capabilities response has correct structure', async () => {
      const request = createMockRequest({ command: 'capabilities' });
      const response = await POST(request);
      const data = await response.json();

      expect(typeof data.data.models_count).toBe('number');
      expect(Array.isArray(data.data.personas_available)).toBe(true);
      expect(typeof data.data.streaming_supported).toBe('boolean');
      expect(typeof data.data.ag_ui_protocol).toBe('boolean');
    });
  });
});