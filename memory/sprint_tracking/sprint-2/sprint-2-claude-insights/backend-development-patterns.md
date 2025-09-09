# Backend Development Patterns from Story 02.10

*Extracted from Sprint 2 Authentication System Development*

## Dependency Injection Excellence

### Centralized Container Pattern
**Achievement**: Complete DI container with singleton management in `backend/core/container.py`

**Key Pattern**:
```python
# GOOD: Constructor injection 
class UserService:
    def __init__(self, repository: UserRepository, config: Settings):
        self.repository = repository
        self.config = config

# AVOID: Direct environment access
class UserService:
    def __init__(self):
        self.db_uri = os.getenv("DB_URI")
```

### Service Architecture Standards

**Repository Pattern Implementation**:
- Abstract interfaces in `backend/repositories/`
- Concrete implementations with pure async patterns
- Services depend on repository interfaces, not database clients directly

**Configuration Management**:
- Centralized `Settings` class with Pydantic validation
- Avoid scattered `os.getenv()` calls throughout services
- Inject configuration through constructors, not direct access

## Import Standards for Backend Services

### MANDATORY: Relative Import Pattern
```python
# CORRECT: Within backend service - use relative imports
from .models.user import User, UserRegistrationRequest
from .services.user_service import UserService
from .database.neo4j_client import Neo4jClient
from .auth.jwt_handler import JWTHandler

# FORBIDDEN: Absolute imports for internal modules  
from models.user import User  # ❌ WRONG
from services.user_service import UserService  # ❌ WRONG

# NEVER: sys.path manipulation
import sys; sys.path.append(...)  # ❌ FORBIDDEN
```

### Service Isolation Requirements
- Each service runs independently with `cd service_name`
- Use relative imports for clean deployment
- Docker containers maintain same import patterns as development

## Database Integration Patterns

### MongoDB Async Patterns
```python
# GOOD: Pure async patterns with proper lifecycle
class MongoUserRepository:
    def __init__(self, client: AsyncIOMotorClient):
        self.client = client
        
    async def create_user(self, user_data: dict) -> dict:
        result = await self.collection.insert_one(user_data)
        return await self.collection.find_one({"_id": result.inserted_id})
```

### Redis Session Management
- TTL-based session storage with metadata tracking
- Connection pooling for performance optimization
- Proper error handling and connection lifecycle management

## Testing Architecture for DI

### TDD with Dependency Injection
**Pattern**: Mock DI container for isolated unit tests
```python
@pytest.fixture
def mock_container():
    container = Container()
    container.user_repository.override(MockUserRepository())
    container.jwt_service.override(MockJWTService())
    return container
```

**Test Structure**:
```
tests/
├── unit/auth/
│   ├── test_user_service.py
│   └── test_jwt_service.py
└── integration/auth/
    ├── test_user_endpoints.py
    └── test_auth_flow.py
```

## Error Handling Standards

### Custom Exception Hierarchy
```python
# backend/core/exceptions.py
class ServiceError(Exception):
    """Base service error with HTTP status mapping"""
    status_code: int = 500
    
class UserServiceError(ServiceError):
    """User-specific service errors"""
    status_code: int = 400
```

### Structured Error Responses
```python
return APIResponse(
    success=False,
    message="User registration failed",
    error_code="USER_EXISTS",
    data={"field_errors": {"email": "Email already registered"}}
)
```

## Performance and Monitoring

### Built-in Observability
```python
# backend/middleware/performance.py
@app.middleware("http")
async def performance_middleware(request: Request, call_next):
    start_time = time.time()
    correlation_id = str(uuid.uuid4())
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(f"Request {correlation_id} took {process_time:.4f}s")
    
    return response
```

**Key Metrics Achieved**: 54.5ms average response time

## Development Command Standards

### CRITICAL: Service Execution Pattern
```bash
# CORRECT: Run as module from project root
npm run dev:backend
# Actual execution: python -m uvicorn backend.main:app --reload

# FORBIDDEN: Direct execution breaks imports
cd backend && python main.py  # ❌ Breaks relative imports
cd backend && uvicorn main:app  # ❌ Breaks relative imports
```

## Architecture Elegance Phases

### Systematic Refactoring Process
1. **Foundation Phase**: Core architecture and DI container
2. **Service Layer Phase**: Clean service interfaces and dependencies  
3. **Performance Phase**: Optimization and monitoring
4. **Integration Phase**: API coordination and error handling

### Quality Gates
- 90%+ test coverage for all service layers
- All services use dependency injection consistently
- Zero `sys.path` manipulations in codebase
- Comprehensive integration test coverage

## Recommendations for CLAUDE.md Updates

```markdown
### Backend Development Command Standards
**CRITICAL**: Use these exact commands for backend development:
- `npm run dev:backend` - Correct module execution from project root
- NEVER: `cd backend && python main.py` - Breaks relative imports
- NEVER: Direct uvicorn execution from backend directory

### Service Architecture Requirements  
- All services MUST use dependency injection from centralized container
- Repository pattern REQUIRED for all database operations
- Custom exception hierarchy for structured error handling
- Pure async patterns for all I/O operations
```