#!/usr/bin/env python3
"""
Test Environment Setup Script

Ensures all dependencies are installed and environment is ready
for orchestrator testing.

Usage:
    python setup_test_environment.py
"""

import os
import sys
import subprocess
import importlib
from pathlib import Path

def check_python_version():
    """Check Python version compatibility"""
    print("🐍 Checking Python version...")
    
    version = sys.version_info
    print(f"   Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major != 3 or version.minor < 9:
        print("   ❌ Python 3.9+ required")
        return False
    else:
        print("   ✅ Python version compatible")
        return True

def check_virtual_environment():
    """Check if running in virtual environment"""
    print("\n🏠 Checking virtual environment...")
    
    in_venv = hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)
    
    if in_venv:
        print("   ✅ Running in virtual environment")
        print(f"   Virtual env path: {sys.prefix}")
        return True
    else:
        print("   ⚠️  Not running in virtual environment")
        print("   Recommendation: Activate virtual environment with 'source .venv/bin/activate'")
        return False

def check_environment_file():
    """Check if .env file exists and has required variables"""
    print("\n📄 Checking environment configuration...")
    
    env_path = Path("../.env")
    if not env_path.exists():
        print("   ❌ .env file not found in parent directory")
        print("   Please copy .env.example to .env and configure your API keys")
        return False
    
    print("   ✅ .env file found")
    
    # Check for required environment variables
    required_vars = [
        "REDIS_URL",
        "MONGODB_URI", 
        "OPENAI_API_KEY",
        "GEMINI_API_KEY"
    ]
    
    # Load environment variables
    try:
        from dotenv import load_dotenv
        load_dotenv(env_path)
        
        missing_vars = []
        for var in required_vars:
            if not os.getenv(var):
                missing_vars.append(var)
        
        if missing_vars:
            print(f"   ⚠️  Missing environment variables: {missing_vars}")
            print("   Please configure these in your .env file")
            return False
        else:
            print("   ✅ Required environment variables found")
            return True
            
    except ImportError:
        print("   ⚠️  python-dotenv not installed, cannot verify environment variables")
        return False

def check_required_packages():
    """Check if required packages are installed"""
    print("\n📦 Checking required packages...")
    
    required_packages = [
        ("pydantic", "pydantic"),
        ("pydantic_ai", "pydantic-ai"),
        ("fastapi", "fastapi"),
        ("redis", "redis"),
        ("pymongo", "pymongo"),
        ("openai", "openai"),
        ("google.generativeai", "google-generativeai"),
        ("anthropic", "anthropic"),
        ("dotenv", "python-dotenv"),
        ("pytest", "pytest"),
        ("asyncio", None)  # Built-in module
    ]
    
    missing_packages = []
    
    for module_name, package_name in required_packages:
        try:
            importlib.import_module(module_name)
            print(f"   ✅ {module_name}")
        except ImportError:
            print(f"   ❌ {module_name}")
            if package_name:
                missing_packages.append(package_name)
    
    if missing_packages:
        print(f"\n   Missing packages: {missing_packages}")
        print("   Install with: pip install " + " ".join(missing_packages))
        return False
    else:
        print("   ✅ All required packages installed")
        return True

def check_orchestrator_modules():
    """Check if orchestrator modules can be imported"""
    print("\n🎭 Checking orchestrator modules...")
    
    orchestrator_modules = [
        "orchestrator.core",
        "orchestrator.session", 
        "orchestrator.persona_manager",
        "orchestrator.context_package",
        "orchestrator.conversation",
        "llm_services"
    ]
    
    missing_modules = []
    
    for module in orchestrator_modules:
        try:
            importlib.import_module(module)
            print(f"   ✅ {module}")
        except ImportError as e:
            print(f"   ❌ {module}: {e}")
            missing_modules.append(module)
    
    if missing_modules:
        print(f"\n   Missing orchestrator modules: {missing_modules}")
        print("   Make sure you're running from the agentic directory")
        return False
    else:
        print("   ✅ All orchestrator modules available")
        return True

def install_missing_packages():
    """Install missing packages"""
    print("\n🔧 Installing missing packages...")
    
    try:
        # Install from requirements.txt if it exists
        requirements_path = Path("requirements.txt")
        if requirements_path.exists():
            print("   Installing from requirements.txt...")
            result = subprocess.run([
                sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                print("   ✅ Requirements installed successfully")
                return True
            else:
                print(f"   ❌ Failed to install requirements: {result.stderr}")
                return False
        else:
            print("   ❌ requirements.txt not found")
            return False
            
    except Exception as e:
        print(f"   ❌ Error installing packages: {e}")
        return False

def create_test_directories():
    """Create necessary test directories"""
    print("\n📁 Creating test directories...")
    
    test_dirs = [
        "test_logs",
        "test_data"
    ]
    
    for dir_name in test_dirs:
        dir_path = Path(dir_name)
        if not dir_path.exists():
            dir_path.mkdir(exist_ok=True)
            print(f"   ✅ Created {dir_name}")
        else:
            print(f"   ✅ {dir_name} already exists")

def run_quick_import_test():
    """Run a quick import test"""
    print("\n🧪 Running quick import test...")
    
    try:
        # Test basic imports
        from orchestrator.core import UnifiedOrchestrator, OrchestratorRequest, PersonaType
        from orchestrator.session import SessionManager
        from llm_services import LLMServiceManager
        
        print("   ✅ Core imports successful")
        
        # Test basic instantiation
        llm_manager = LLMServiceManager()
        available_providers = llm_manager.get_available_providers()
        print(f"   ✅ LLM Manager initialized, providers: {available_providers}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Import test failed: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 Orchestrator Test Environment Setup")
    print("=" * 50)
    
    checks = [
        ("Python Version", check_python_version),
        ("Virtual Environment", check_virtual_environment),
        ("Environment File", check_environment_file),
        ("Required Packages", check_required_packages),
        ("Orchestrator Modules", check_orchestrator_modules)
    ]
    
    all_passed = True
    
    for check_name, check_func in checks:
        if not check_func():
            all_passed = False
    
    if not all_passed:
        print("\n" + "=" * 50)
        print("⚠️  Some checks failed. Attempting to fix...")
        
        # Try to install missing packages
        if not check_required_packages():
            install_missing_packages()
    
    # Create test directories
    create_test_directories()
    
    # Run final import test
    if run_quick_import_test():
        print("\n" + "=" * 50)
        print("✅ Test environment setup complete!")
        print("\n🎯 Ready to run orchestrator tests:")
        print("   python test_redis_session.py     # Test Redis connection")
        print("   python test_llm_integration.py   # Test LLM providers")
        print("   python test_orchestrator_live.py # Full orchestrator test")
        print("\n🧪 Or run pytest for unit tests:")
        print("   pytest orchestrator/tests/ -v")
    else:
        print("\n" + "=" * 50)
        print("❌ Test environment setup incomplete!")
        print("   Please check the errors above and resolve them manually.")
        print("   Common issues:")
        print("   - Missing API keys in .env file")
        print("   - Not running in virtual environment")
        print("   - Missing Python packages")

if __name__ == "__main__":
    main()
