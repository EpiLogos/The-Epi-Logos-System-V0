# Orchestrator Testing Guide

This directory contains comprehensive testing scripts for the UnifiedOrchestrator system. These scripts help you verify that all components are working correctly, including Redis sessions, LLM integration, and chat functionality.

## 🚀 Quick Start

1. **Setup Environment**
   ```bash
   cd agentic
   python setup_test_environment.py
   ```

2. **Test Redis Sessions**
   ```bash
   python test_redis_session.py
   ```

3. **Test LLM Integration**
   ```bash
   python test_llm_integration.py
   ```

4. **Full Orchestrator Test**
   ```bash
   python test_orchestrator_live.py
   ```

## 📋 Testing Scripts

### `setup_test_environment.py`
**Purpose**: Verifies that your environment is properly configured for testing.

**What it checks**:
- Python version compatibility
- Virtual environment activation
- Required packages installation
- Environment variables (.env file)
- Orchestrator module imports

**Usage**:
```bash
python setup_test_environment.py
```

### `test_redis_session.py`
**Purpose**: Tests Redis Cloud connection and session management functionality.

**What it tests**:
- Raw Redis connection and basic operations
- SessionManager class functionality
- Session creation, retrieval, and updates
- Session cleanup and expiration
- Concurrent session handling

**Usage**:
```bash
python test_redis_session.py
```

**Expected Output**:
- ✅ Redis connection successful
- ✅ Session CRUD operations working
- ✅ Concurrent sessions handled properly

### `test_llm_integration.py`
**Purpose**: Tests LLM provider connections and chat functionality.

**What it tests**:
- LLM service availability (OpenAI, Gemini, Anthropic)
- Basic chat completion
- Persona-specific prompts
- Conversation continuity
- Error handling
- Interactive chat mode

**Usage**:
```bash
python test_llm_integration.py
```

**Features**:
- Automated testing of all available LLM providers
- Interactive mode for manual testing
- Persona prompt validation

### `test_orchestrator_live.py`
**Purpose**: Comprehensive end-to-end testing of the UnifiedOrchestrator.

**What it tests**:
- Full orchestrator initialization
- Chat functionality with different personas
- Redis session verification
- MongoDB conversation history
- Context package assembly
- Interactive chat mode

**Usage**:
```bash
python test_orchestrator_live.py
```

**Features**:
- Automated test suite
- Interactive chat mode with persona switching
- Session status monitoring
- Real-time testing with actual LLM providers

## 🎯 Interactive Testing

### Chat Commands (in interactive modes)

**Persona Switching**:
- `/nara` - Switch to Nara persona (reflection/journaling)
- `/epii` - Switch to Epii persona (knowledge synthesis)
- `/system` - Switch to System persona (general assistance)

**Session Management**:
- `/status` - Show current session status
- `/quit` - Exit interactive mode
- `/help` - Show available commands

**LLM Testing**:
- `/providers` - List available LLM providers
- `/switch <provider>` - Switch to specific provider

## 🔧 Environment Requirements

### Required Environment Variables (.env file)
```bash
# Redis Cloud
REDIS_URL=rediss://default:password@host:port/0

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/database
MONGODB_DB_NAME=your_database

# LLM API Keys
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
ANTHROPIC_API_KEY=sk-ant-...

# GraphQL Endpoint
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:8000/graphql
```

### Required Python Packages
All packages are listed in `requirements.txt`. Install with:
```bash
pip install -r requirements.txt
```

## 🧪 Running Unit Tests

For comprehensive unit testing:
```bash
# Run all orchestrator tests
pytest orchestrator/tests/ -v

# Run specific test files
pytest orchestrator/tests/test_core.py -v
pytest orchestrator/tests/test_session.py -v
pytest orchestrator/tests/test_integration.py -v

# Run with coverage
pytest orchestrator/tests/ --cov=orchestrator --cov-report=html
```

## 🐛 Troubleshooting

### Common Issues

**Redis Connection Failed**:
- Check REDIS_URL in .env file
- Verify Redis Cloud credentials
- Ensure SSL/TLS connection (rediss://)

**MongoDB Connection Failed**:
- Check MONGODB_URI format
- Verify MongoDB Atlas credentials
- Ensure IP whitelist includes your IP

**LLM Provider Not Available**:
- Check API keys in .env file
- Verify API key permissions
- Check rate limits

**Import Errors**:
- Ensure you're in the agentic directory
- Activate virtual environment
- Install missing packages

### Debug Mode

Add debug logging to any test script:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📊 Test Results Interpretation

### ✅ Success Indicators
- All connections established
- Sessions created and retrieved
- LLM responses received
- Persona switching works
- Context maintained

### ⚠️ Warning Indicators
- Some providers unavailable (but others work)
- Session cleanup warnings
- Response validation partial

### ❌ Failure Indicators
- Connection failures
- Import errors
- API authentication failures
- Session corruption

## 🎯 Next Steps

After successful testing:

1. **Development**: Use the orchestrator in your application
2. **Integration**: Connect to frontend components
3. **Monitoring**: Set up logging and metrics
4. **Production**: Deploy with proper error handling

## 📝 Test Logs

Test scripts create logs in:
- `test_logs/` directory (created automatically)
- Console output with colored status indicators
- Session data in `test_data/` directory

## 🔄 Continuous Testing

For ongoing development, consider:
- Running tests before commits
- Automated testing in CI/CD
- Regular connection health checks
- Performance monitoring

---

**Need Help?** 
- Check the main README.md for system overview
- Review orchestrator source code in `orchestrator/`
- Run `python setup_test_environment.py` for environment validation
