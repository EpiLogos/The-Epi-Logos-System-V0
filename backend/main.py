"""
FastAPI Backend Application for Epi-Logos System

This is the main entry point for the backend layer (Deep Engine Room)
of the tri-laminar architecture.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, ValidationError
import uvicorn
import os
import logging
from datetime import datetime, timezone
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env files
load_dotenv()  # loads .env
# load_dotenv('.env.local')  # DISABLED: Using main .env file with all credentials

# Import services - using shared database clients
from shared.database import Neo4jClient
from .config.environment import get_config
from .auth.oauth_routes import oauth_router
from .auth.oauth_exchange_routes import exchange_router
from .app.services import NodeService, NodeRepository


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Dependency injection for Neo4j client with explicit lifecycle
def get_neo4j_client(request: Request) -> Neo4jClient:
    """
    Dependency injection for Neo4j client using app.state for explicit resource lifecycle.
    Client is created on startup and reused across all requests.
    """
    return request.app.state.neo4j_client

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown events with explicit resource management"""
    # Startup - initialize shared resources
    config = get_config()
    logger.info("Initializing Neo4j client with centralized configuration")
    app.state.neo4j_client = Neo4jClient(
        uri=config.neo4j_uri,
        username=config.neo4j_username,
        password=config.neo4j_password,
        database=config.neo4j_database
    )
    
    # Initialize real AG-UI Protocol service
    try:
        from .epi_logos_system.services.ag_ui_service import ag_ui_service
        app.state.ag_ui_service = ag_ui_service
        logger.info("Real AG-UI Protocol service initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize AG-UI service: {e}")
    
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown - cleanup resources explicitly
    try:
        if hasattr(app.state, 'neo4j_client'):
            app.state.neo4j_client.close()
            logger.info("Neo4j client connection closed successfully")
        if hasattr(app.state, 'ag_ui_server'):
            if hasattr(app.state.ag_ui_server, 'close'):
                app.state.ag_ui_server.close()
                logger.info("AG-UI Server closed successfully")
    except Exception as e:
        logger.error(f"Error during shutdown cleanup: {e}")

# Initialize FastAPI app
app = FastAPI(
    title="Epi-Logos Backend",
    description="Backend API for the Epi-Logos System V0.1",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add performance monitoring middleware
from .middleware.performance import PerformanceMiddleware
app.add_middleware(PerformanceMiddleware, min_response_time_log=0.1)

# Add custom exception handlers for better error reporting
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle FastAPI validation errors with detailed error information."""
    logger.warning(f"Validation error on {request.method} {request.url}: {exc.errors()}")

    # Format errors for better readability with field-specific details
    error_details = []
    field_errors = {}

    for error in exc.errors():
        field = ".".join(str(loc) for loc in error.get("loc", []))
        message = error.get("msg", "Validation error")
        error_type = error.get("type", "")

        # Add to general error list
        error_details.append({
            "field": field,
            "message": message,
            "type": error_type,
            "input": error.get("input")
        })

        # Group by field for easier frontend handling
        if field not in field_errors:
            field_errors[field] = []
        field_errors[field].append(message)

    # Add password requirements for password validation errors
    password_requirements = None
    if any("password" in error.get("loc", []) for error in exc.errors()):
        password_requirements = {
            "minLength": 8,
            "requireUppercase": True,
            "requireLowercase": True,
            "requireDigit": True,
            "requireSpecialChar": True,
            "specialChars": "!@#$%^&*(),.?\":{}|<>",
            "description": "Password must be at least 8 characters with uppercase, lowercase, digit, and special character"
        }

    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Validation failed",
            "errors": error_details,
            "field_errors": field_errors,
            "password_requirements": password_requirements,
            "error_type": "validation_error"
        }
    )

# Include routers
app.include_router(oauth_router)
app.include_router(exchange_router)

# Import and include users router - using relative import
from .api.users import router as users_router
app.include_router(users_router, prefix="/api")

# Import and include auth router - new for Story 02.10.1
from .api.auth import router as auth_router
app.include_router(auth_router, prefix="/api")

# Import and include billing router - new for Story 02.10.2
from .api.billing import router as billing_router
app.include_router(billing_router, prefix="/api")

# Import and include webhooks router - new for Story 02.10.2
from .api.webhooks import router as webhooks_router
app.include_router(webhooks_router, prefix="/api")

# Import and include health router
from .api.health import router as health_router
app.include_router(health_router, prefix="/api/health")

# Import and include security router - new for Story 02.10.4
from .api.security import router as security_router
app.include_router(security_router, prefix="/api")

# Include real AG-UI protocol router
from .api.ag_ui import router as ag_ui_router
app.include_router(ag_ui_router)

# Real AG-UI WebSocket endpoint is handled by the ag_ui router at /api/v1/ag-ui/ws

# Add GraphQL support
import ariadne
from ariadne.explorer import ExplorerGraphiQL
from .subsystems.coordinate_resolution.resolvers import query

# Load GraphQL schema
import pathlib
BACKEND_DIR = pathlib.Path(__file__).parent
type_defs = ariadne.load_schema_from_path(str(BACKEND_DIR / "subsystems/coordinate_resolution/schema.graphql"))
schema = ariadne.make_executable_schema(type_defs, query)

# GraphiQL explorer
explorer_html = ExplorerGraphiQL().html(None)

@app.get("/graphql")
async def graphql_explorer():
    """GraphiQL interface for testing GraphQL queries"""
    return HTMLResponse(content=explorer_html)

@app.post("/graphql")
async def graphql_endpoint(
    request: Request,
    neo4j_client: Neo4jClient = Depends(get_neo4j_client)
):
    """GraphQL endpoint for coordinate resolution"""
    data = await request.json()

    # Use the proper service layer instead of inline implementation
    repo = NodeRepository(neo4j_client)
    node_service = NodeService(repo)

    # Create context with the service
    context_value = {
        "request": request,
        "service": node_service,
    }
    
    # Execute GraphQL query
    _, result = await ariadne.graphql(
        schema,
        data,
        context_value=context_value,
        debug=True,
    )
    
    return JSONResponse(content=result)

# Lightweight startup diagnostics to help OAuth debugging in dev
try:
    import sys
    import aiohttp  # type: ignore
    logger.info(
        "Startup diagnostics: python=%s aiohttp=%s GOOGLE_CLIENT_ID_set=%s GOOGLE_CLIENT_SECRET_set=%s",
        sys.executable,
        getattr(aiohttp, "__version__", "unknown"),
        bool(os.getenv("GOOGLE_CLIENT_ID")),
        bool(os.getenv("GOOGLE_CLIENT_SECRET")),
    )
except Exception as _e:
    logger.warning("Diagnostics init error: %s", _e)

# Pydantic models for API responses
class BimbaNodeBasic(BaseModel):
    """Basic Bimba Node containing only essential fields for lean responses"""
    coordinate: str
    name: str
    subsystem: int


# API endpoints
@app.get("/api/v1/nodes/{coordinate}", response_model=Optional[BimbaNodeBasic])
async def get_node_by_coordinate(coordinate: str, neo4j_client: Neo4jClient = Depends(get_neo4j_client)):
    """
    Retrieve a Bimba Node by its coordinate string.
    
    This implements Story 02.01 coordinate resolution:
    - AC: 1 - Accepts coordinate string parameter
    - AC: 2 - Returns node data for valid coordinates  
    - AC: 3 - Returns None for invalid coordinates
    - AC: 4 - Returns only coordinate, name, subsystem (lean response)
    """
    try:
        # Query the database directly - connection errors will be caught naturally
        raw_result = neo4j_client.get_bimba_node(coordinate)
        
        # Handle null case (AC: 3)
        if raw_result is None:
            return None
        
        # Filter to lean response structure (AC: 4) 
        # Only return coordinate, name, subsystem - no other fields
        return BimbaNodeBasic(
            coordinate=raw_result['coordinate'],
            name=raw_result['name'],
            subsystem=raw_result['subsystem']
        )
        
    except Exception as e:
        # Log the error but don't expose internal details
        logger.error(f"Error in get_node_by_coordinate for '{coordinate}': {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Epi-Logos Backend API",
        "version": "0.1.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "layer": "Backend (Deep Engine Room)"
    }

# Health endpoints consolidated in /api/health/ router

@app.get("/api/v1/status")
async def api_status():
    """API status endpoint"""
    return {
        "api_version": "v1",
        "status": "operational",
        "subsystems": {
            "anuttara": "initialized",
            "paramasiva": "initialized", 
            "parashakti": "initialized",
            "mahamaya": "initialized",
            "nara": "initialized",
            "epii": "initialized"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
