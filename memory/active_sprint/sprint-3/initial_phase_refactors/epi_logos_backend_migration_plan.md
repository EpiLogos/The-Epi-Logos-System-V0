# Backend Domain Migration Plan: Epi-Logos System Organization

**CRITICAL UNDERSTANDING:** This migration organizes ALL backend logic within `backend/epi_logos_system/` using domain-driven architecture with absolute imports.

## Executive Summary

**Migration Objective:** Consolidate scattered backend files into organized domain structure within `backend/epi_logos_system/`
**Import Strategy:** Absolute imports - `from backend.epi_logos_system.domain.module import Class`
**Shared Infrastructure:** Keep `shared/database` as cross-layer, deprecate AG-UI backend components
**Testing Strategy:** Test-first approach with comprehensive validation at each phase

## Current vs Target Architecture

### Current Scattered Structure
```
backend/
├── main.py                     # Entry point with scattered imports
├── api/                        # Mixed domain endpoints
├── auth/                       # Full OAuth implementation
├── services/                   # Mixed domain services
├── models/                     # User/subscription models
├── repositories/               # User data access
├── config/                     # Environment configuration
├── core/                       # DI container, exceptions
├── middleware/                 # Generic middleware
├── utils/                      # Utilities
├── app/                        # NodeService (CAG domain)
├── subsystems/                 # Coordinate resolution (CAG)
├── database/                   # Wrappers around shared/database
└── epi_logos_system/           # ← TARGET: Partial organization started
    ├── auth/                   # Basic auth utilities
    ├── config/                 # AG-UI config (to deprecate)
    ├── services/               # Health service
    └── tests/                  # AG-UI tests (to deprecate)
```

### Target Organized Structure (Modular)
```
backend/
├── main.py                     # Updated with epi_logos_system imports
├── epi_logos_system/           # ← ALL backend logic organized here
│   ├── auth/                   # Complete authentication domain (MODULAR)
│   │   ├── __init__.py
│   │   ├── api.py              # Auth endpoints
│   │   ├── models.py           # Auth request/response models
│   │   ├── exceptions.py       # Merged auth exceptions
│   │   ├── services/           # Modular auth services
│   │   │   ├── __init__.py
│   │   │   ├── jwt_service.py          # JWT operations (320 lines)
│   │   │   ├── mfa_service.py          # MFA/TOTP operations (160 lines)
│   │   │   ├── password_service.py     # Password hashing (240 lines)
│   │   │   ├── password_reset_service.py # Password reset flow (200 lines)
│   │   │   ├── validation_service.py   # Auth framework validation (522 lines)
│   │   │   └── auth_utilities.py       # Small utilities (jwt_handler + api_key_manager)
│   │   └── oauth/              # OAuth-specific components (MODULAR)
│   │       ├── __init__.py
│   │       ├── routes.py               # OAuth routes (merged routing)
│   │       ├── google_client.py        # Google OAuth client (300 lines)
│   │       ├── state_manager.py        # OAuth state management (356 lines)
│   │       ├── nonce_manager.py        # OIDC nonce handling (200 lines)
│   │       ├── account_linking_service.py # Account linking (380 lines)
│   │       ├── token_revocation_service.py # Token revocation (380 lines)
│   │       └── provider_handler.py     # Generic OAuth provider handler
│   ├── users/                  # User management domain (MODULAR)
│   │   ├── __init__.py
│   │   ├── api.py              # Merged user/billing/webhook endpoints
│   │   ├── services/           # Modular user services
│   │   │   ├── __init__.py
│   │   │   ├── user_service.py         # User operations
│   │   │   ├── billing_service.py      # Stripe/billing operations
│   │   │   ├── audit_service.py        # Security audit operations
│   │   │   ├── data_export_service.py  # Data export operations
│   │   │   └── data_sovereignty_service.py # Data sovereignty operations
│   │   ├── repositories/       # User data access
│   │   │   ├── __init__.py
│   │   │   ├── user_repository.py      # User data access
│   │   │   └── mongo_user_repository.py # MongoDB user access
│   │   └── models/             # User and subscription models
│   │       ├── __init__.py
│   │       ├── user.py                 # User models
│   │       └── subscription.py         # Subscription models
│   ├── cag/                    # Coordinate-Augmented Generation domain
│   │   ├── __init__.py
│   │   ├── api.py              # CAG orchestration endpoints
│   │   ├── services.py         # CAG orchestration logic
│   │   ├── models.py           # CAG request/response models
│   │   ├── lightrag/           # LightRAG service (Gnostic namespace)
│   │   │   ├── __init__.py
│   │   │   ├── api.py
│   │   │   ├── services.py
│   │   │   ├── models.py
│   │   │   ├── document_operations.py
│   │   │   ├── gemini_embeddings.py
│   │   │   ├── gemini_llm.py
│   │   │   ├── neo4j_storage.py
│   │   │   ├── qdrant_storage.py
│   │   │   └── mcp_server.py
│   │   ├── graphiti/           # Graphiti service (Episodic namespace)
│   │   │   ├── __init__.py
│   │   │   ├── api.py
│   │   │   ├── services.py
│   │   │   ├── models.py
│   │   │   ├── communities.py
│   │   │   └── mcp_server.py
│   │   └── bimba/              # Bimba coordinate resolution
│   │       ├── __init__.py
│   │       ├── services.py     # NodeService, coordinate resolution
│   │       ├── models.py       # BimbaNode, coordinate models
│   │       ├── resolvers.py    # GraphQL resolvers
│   │       └── schema.graphql  # GraphQL schema
│   ├── shared/                 # Cross-cutting infrastructure
│   │   ├── __init__.py
│   │   ├── config.py           # Environment configuration
│   │   ├── container.py        # Dependency injection
│   │   ├── exceptions.py       # Custom exceptions
│   │   ├── middleware.py       # Generic middleware
│   │   ├── health.py           # Health check services
│   │   ├── security.py         # Security utilities
│   │   └── utils.py            # General utilities
│   └── deprecated/             # Deprecated AG-UI components
│       ├── __init__.py
│       ├── ag_ui_config.py     # Commented out AG-UI config
│       └── ag_ui_tests/        # Commented out AG-UI tests
└── tests/                      # Test suite (domain-organized)
    ├── auth/
    ├── users/
    ├── cag/
    ├── shared/
    └── integration/
```

## Domain Analysis & Merge Strategy

### AUTH Domain Modular Strategy

**Current State Analysis:**
- `backend/auth/` - Complete OAuth implementation (13 files)
- `backend/epi_logos_system/auth/` - Basic utilities (2 files: jwt.py, exceptions.py)
- `backend/services/` - JWT, MFA, password services (4 files)

**Modular Strategy (Favoring Modularity):**
1. **OAuth Subdirectory:** Create `auth/oauth/` for OAuth-specific components
2. **Service Modularity:** Preserve individual service responsibilities in `auth/services/`
3. **Strategic Merging:** Only merge small utilities and related routing logic
4. **Exception Hierarchy:** Merge exception classes with clear inheritance
5. **API Consolidation:** Move `backend/api/auth.py` to `auth/api.py`

**File Mapping (Modular Approach):**
```
# OAuth Components → auth/oauth/ (PRESERVE MODULARITY)
backend/auth/oauth_routes.py              → auth/oauth/routes.py
backend/auth/oauth_exchange_routes.py     → auth/oauth/routes.py (MERGE - routing consolidation)
backend/auth/google_oauth_client.py       → auth/oauth/google_client.py (KEEP SEPARATE - 300+ lines)
backend/auth/oauth_state.py               → auth/oauth/state_manager.py (KEEP SEPARATE - 356 lines)
backend/auth/oidc_nonce.py                → auth/oauth/nonce_manager.py (KEEP SEPARATE - 200 lines)
backend/auth/token_revocation.py          → auth/oauth/token_revocation_service.py (KEEP SEPARATE - 380 lines)
backend/auth/account_linking.py           → auth/oauth/account_linking_service.py (KEEP SEPARATE - 380 lines)
backend/auth/oauth_handler.py             → auth/oauth/provider_handler.py (KEEP SEPARATE - generic handler)

# Core Auth Services → auth/services/ (PRESERVE MODULARITY)
backend/services/jwt_service.py           → auth/services/jwt_service.py (KEEP SEPARATE - 320 lines)
backend/services/mfa_service.py           → auth/services/mfa_service.py (KEEP SEPARATE - 160 lines)
backend/services/password_service.py      → auth/services/password_service.py (KEEP SEPARATE - 240 lines)
backend/services/password_reset_service.py → auth/services/password_reset_service.py (KEEP SEPARATE - 200 lines)
backend/auth/validation.py                → auth/services/validation_service.py (KEEP SEPARATE - 522 lines)

# Small Utilities → auth/services/ (STRATEGIC MERGE)
backend/auth/jwt_handler.py               → auth/services/auth_utilities.py (MERGE - 95 lines)
backend/auth/api_key_manager.py           → auth/services/auth_utilities.py (MERGE - 85 lines)

# Exceptions → auth/ (NATURAL MERGE)
backend/auth/exceptions.py                → auth/exceptions.py (MERGE - exception hierarchy)
backend/epi_logos_system/auth/exceptions.py → auth/exceptions.py (MERGE - exception hierarchy)

# API Endpoints → auth/
backend/api/auth.py                       → auth/api.py

# Existing utilities
backend/epi_logos_system/auth/jwt.py      → auth/models.py (RENAME - auth models)
```

### USERS Domain Organization (Modular)

**Service Modularity (Preserve Individual Responsibilities):**
```
backend/services/user_service.py          → users/services/user_service.py (KEEP SEPARATE)
backend/services/stripe_service.py        → users/services/billing_service.py (KEEP SEPARATE)
backend/services/audit_service.py         → users/services/audit_service.py (KEEP SEPARATE)
backend/services/data_export_service.py   → users/services/data_export_service.py (KEEP SEPARATE)
backend/services/data_sovereignty_service.py → users/services/data_sovereignty_service.py (KEEP SEPARATE)
```

**API Organization (Strategic Consolidation):**
```
backend/api/users.py                      → users/api.py (MERGE - user endpoints)
backend/api/billing.py                   → users/api.py (MERGE - billing endpoints)
backend/api/webhooks.py                  → users/api.py (MERGE - webhook endpoints)
```

**Repository Organization:**
```
backend/repositories/user_repository.py   → users/repositories/user_repository.py (KEEP SEPARATE)
backend/repositories/mongo_user_repository.py → users/repositories/mongo_user_repository.py (KEEP SEPARATE)
```

**Models Organization:**
```
backend/models/user.py                    → users/models/user.py (KEEP SEPARATE)
backend/models/subscription.py           → users/models/subscription.py (KEEP SEPARATE)
```

### CAG Domain Organization

**Preserve Existing Structure:**
```
backend/services/lightrag/*              → cag/lightrag/ (move entire directory)
backend/services/graphiti/*              → cag/graphiti/ (move entire directory)
```

**Coordinate Resolution:**
```
backend/app/services.py                  → cag/bimba/services.py
backend/subsystems/coordinate_resolution/* → cag/bimba/ (merge)
```

### SHARED Domain Organization (Strategic Consolidation)

**Infrastructure Organization:**
```
backend/config/*                         → shared/config.py (MERGE - configuration consolidation)
backend/core/container.py                → shared/container.py (MOVE)
backend/core/exceptions.py               → shared/exceptions.py (MOVE)
backend/middleware/*                     → shared/middleware.py (MERGE - middleware consolidation)
backend/utils/*                          → shared/utils.py (MERGE - utility consolidation)
backend/api/health.py                    → shared/health.py (MOVE)
backend/api/security.py                  → shared/security.py (MOVE)
backend/epi_logos_system/services/health_service.py → shared/health.py (MERGE - health consolidation)
```

### AG-UI Deprecation Strategy

**Components to Deprecate:**
```
backend/epi_logos_system/config/environment.py → deprecated/ag_ui_config.py (comment out)
backend/epi_logos_system/tests/ag_ui/*         → deprecated/ag_ui_tests/ (comment out)
```

**Main.py Comments to Add:**
```python
# AG-UI Protocol has been moved to Agentic layer (Trilaminar Architecture compliance)
# Frontend should communicate with Agentic layer at http://localhost:8001/api/v1/ag-ui/*
# Backend AG-UI components deprecated as of [DATE]
```

## Migration Phases

### Phase 0: Testing & Validation Setup
1. **Establish baseline test coverage**
   ```bash
   cd backend && python -m pytest --cov=. --cov-report=html
   ```
2. **Create migration validation tests**
   - Import validation tests
   - Domain boundary tests
   - Cross-domain dependency tests
3. **Set up automated import validation**
   ```bash
   python -m backend.epi_logos_system.shared.utils validate_imports
   ```
4. **Create rollback strategy with git branching**
   ```bash
   git checkout -b backend-domain-migration
   git checkout -b rollback-checkpoint
   ```

### Phase 1: Cleanup & Preparation
1. **Remove `backend/database/` wrappers**
   ```bash
   rm -rf backend/database/
   ```
2. **Update imports to use `shared/database` directly**
   - Replace all `from backend.database` with `from shared.database`
3. **Create `epi_logos_system` domain directories**
   ```bash
   mkdir -p backend/epi_logos_system/{auth/oauth,users,cag/{lightrag,graphiti,bimba},shared,deprecated}
   ```
4. **Deprecate AG-UI components**
   - Move AG-UI config to deprecated/
   - Comment out AG-UI code with deprecation notices

### Phase 2: Domain Migration (Modular Approach)

#### AUTH Domain Migration (Preserve Modularity)
1. **Create modular OAuth subdirectory structure**
2. **Move OAuth components preserving individual responsibilities**
3. **Move auth services preserving modularity**
4. **Merge only small utilities and exception hierarchies**
5. **Update auth API endpoints**

#### USERS Domain Migration (Preserve Modularity)
1. **Move user services preserving individual responsibilities**
2. **Merge API endpoints for routing consolidation**
3. **Move repositories preserving modularity**
4. **Move models preserving modularity**

#### CAG Domain Migration (Preserve Structure)
1. **Move LightRAG service preserving structure**
2. **Move Graphiti service preserving structure**
3. **Move Bimba coordinate resolution preserving structure**
4. **Create CAG orchestration layer**

#### SHARED Domain Migration (Strategic Consolidation)
1. **Move infrastructure components**
2. **Merge configuration management (strategic consolidation)**
3. **Merge middleware and utilities (strategic consolidation)**
4. **Merge health check services (strategic consolidation)**

### Phase 3: Import Path Updates
1. **Update all imports to absolute paths from `backend.epi_logos_system`**
   ```python
   # OLD: from backend.auth.jwt_handler import JWTHandler
   # NEW: from backend.epi_logos_system.auth.services import JWTHandler
   ```
2. **Update `main.py` router imports**
3. **Update cross-domain dependencies**
4. **Validate import performance**

### Phase 4: Architecture Validation
1. **Domain boundary validation**
   - No circular dependencies
   - Clear domain interfaces
2. **Dependency analysis and visualization**
   ```bash
   python -m backend.epi_logos_system.shared.utils analyze_dependencies
   ```
3. **Comprehensive test suite execution**
4. **Code quality and type safety checks**
5. **Performance and load testing**
6. **Documentation updates**

## Detailed Implementation Commands

### Phase 1 Commands (Modular Structure Setup)
```bash
# Remove database wrappers
rm -rf backend/database/

# Create modular domain structure
mkdir -p backend/epi_logos_system/auth/{services,oauth}
mkdir -p backend/epi_logos_system/users/{services,repositories,models}
mkdir -p backend/epi_logos_system/cag/{lightrag,graphiti,bimba}
mkdir -p backend/epi_logos_system/shared
mkdir -p backend/epi_logos_system/deprecated

# Create __init__.py files for all modules
touch backend/epi_logos_system/auth/__init__.py
touch backend/epi_logos_system/auth/services/__init__.py
touch backend/epi_logos_system/auth/oauth/__init__.py
touch backend/epi_logos_system/users/__init__.py
touch backend/epi_logos_system/users/services/__init__.py
touch backend/epi_logos_system/users/repositories/__init__.py
touch backend/epi_logos_system/users/models/__init__.py
touch backend/epi_logos_system/cag/__init__.py
touch backend/epi_logos_system/cag/lightrag/__init__.py
touch backend/epi_logos_system/cag/graphiti/__init__.py
touch backend/epi_logos_system/cag/bimba/__init__.py
touch backend/epi_logos_system/shared/__init__.py
touch backend/epi_logos_system/deprecated/__init__.py
```

### Phase 2 Commands (Modular Migration)
```bash
# Create modular directory structure
mkdir -p backend/epi_logos_system/auth/services
mkdir -p backend/epi_logos_system/auth/oauth
mkdir -p backend/epi_logos_system/users/services
mkdir -p backend/epi_logos_system/users/repositories
mkdir -p backend/epi_logos_system/users/models

# Move AUTH services (preserve modularity)
mv backend/services/jwt_service.py backend/epi_logos_system/auth/services/
mv backend/services/mfa_service.py backend/epi_logos_system/auth/services/
mv backend/services/password_service.py backend/epi_logos_system/auth/services/
mv backend/services/password_reset_service.py backend/epi_logos_system/auth/services/
mv backend/auth/validation.py backend/epi_logos_system/auth/services/validation_service.py

# Move AUTH OAuth components (preserve modularity)
mv backend/auth/google_oauth_client.py backend/epi_logos_system/auth/oauth/google_client.py
mv backend/auth/oauth_state.py backend/epi_logos_system/auth/oauth/state_manager.py
mv backend/auth/oidc_nonce.py backend/epi_logos_system/auth/oauth/nonce_manager.py
mv backend/auth/account_linking.py backend/epi_logos_system/auth/oauth/account_linking_service.py
mv backend/auth/token_revocation.py backend/epi_logos_system/auth/oauth/token_revocation_service.py
mv backend/auth/oauth_handler.py backend/epi_logos_system/auth/oauth/provider_handler.py

# Move USERS services (preserve modularity)
mv backend/services/user_service.py backend/epi_logos_system/users/services/
mv backend/services/stripe_service.py backend/epi_logos_system/users/services/billing_service.py
mv backend/services/audit_service.py backend/epi_logos_system/users/services/
mv backend/services/data_export_service.py backend/epi_logos_system/users/services/
mv backend/services/data_sovereignty_service.py backend/epi_logos_system/users/services/

# Move USERS repositories and models
mv backend/repositories/user_repository.py backend/epi_logos_system/users/repositories/
mv backend/repositories/mongo_user_repository.py backend/epi_logos_system/users/repositories/
mv backend/models/user.py backend/epi_logos_system/users/models/
mv backend/models/subscription.py backend/epi_logos_system/users/models/

# Move CAG services (preserve structure)
mv backend/services/lightrag/* backend/epi_logos_system/cag/lightrag/
mv backend/services/graphiti/* backend/epi_logos_system/cag/graphiti/
mv backend/app/services.py backend/epi_logos_system/cag/bimba/services.py
mv backend/subsystems/coordinate_resolution/* backend/epi_logos_system/cag/bimba/

# Move SHARED infrastructure
mv backend/core/container.py backend/epi_logos_system/shared/container.py
mv backend/core/exceptions.py backend/epi_logos_system/shared/exceptions.py

# Deprecate AG-UI components
mv backend/epi_logos_system/config/environment.py backend/epi_logos_system/deprecated/ag_ui_config.py
mv backend/epi_logos_system/tests/ag_ui/ backend/epi_logos_system/deprecated/ag_ui_tests/
```

## Success Criteria

1. **✅ All existing tests pass** with same or better coverage
2. **✅ No circular dependencies** detected by analysis tools
3. **✅ Clean domain boundaries** validated by automated tests
4. **✅ Import performance** maintained or improved
5. **✅ Application startup time** not degraded
6. **✅ All API endpoints** functional and tested
7. **✅ Documentation** updated and accurate
8. **✅ AG-UI components** properly deprecated with clear migration path

## Validation Checklist

- [ ] Phase 0: Testing framework established
- [ ] Phase 1: Cleanup completed, directories created
- [ ] Phase 2: All domains migrated successfully
- [ ] Phase 3: Import paths updated and validated
- [ ] Phase 4: Architecture validated and documented
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Documentation updated

## 🎯 **Modular Architecture Benefits**

### **Why This Approach Works:**

1. **Preserves Single Responsibility Principle**
   - Each service maintains clear, focused responsibility
   - Easy to test individual components in isolation
   - Clear ownership and debugging paths

2. **Enables Team Development**
   - Multiple developers can work on different services simultaneously
   - Reduced merge conflicts and coordination issues
   - Clear module boundaries for code reviews

3. **Maintains Import Clarity**
   - Explicit dependencies: `from backend.epi_logos_system.auth.services.jwt_service import JWTService`
   - No confusion about what's in mega-files
   - Clear service discovery and documentation

4. **Strategic Consolidation Where Appropriate**
   - Small utilities merged: `jwt_handler.py` + `api_key_manager.py` → `auth_utilities.py`
   - Routing consolidation: OAuth routes merged for endpoint organization
   - Exception hierarchies: Natural consolidation for error handling

5. **Scalable Architecture**
   - Easy to add new services without disrupting existing ones
   - Clear patterns for future development
   - Maintainable codebase with explicit responsibilities

### **Success Metrics:**
- **✅ Modularity Preserved:** Individual service responsibilities maintained
- **✅ Strategic Consolidation:** Only small utilities and routing logic merged
- **✅ Clear Domain Boundaries:** Organized structure with explicit interfaces
- **✅ Developer Experience:** Easy to navigate, test, and maintain
- **✅ Scalable Patterns:** Clear guidelines for future development

This plan provides a comprehensive, clear, and actionable roadmap that any developer or LLM can follow to successfully migrate the backend to domain-driven architecture within the epi_logos_system container while preserving modularity and maintainability.
