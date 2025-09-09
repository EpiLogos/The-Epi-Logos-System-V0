"""
Setup configuration for the Epi-Logos System agentic components.
Enables development installation of the agentic package.
"""

from setuptools import setup, find_packages

setup(
    name="epi-logos-agentic",
    version="0.1.0",
    description="Epi-Logos System Agentic Components",
    packages=find_packages(include=['agentic', 'agentic.*']),
    python_requires=">=3.9",
    install_requires=[
        # Core dependencies for CLI and orchestrator
        "typer",
        "rich",
        "pydantic",
        "asyncio",
        # Add other dependencies as needed
    ],
    entry_points={
        'console_scripts': [
            'agentic-cli=agentic.cli.chat_cli:app',
            'epii=agentic.cli.chat_cli:app',
        ],
    },
    include_package_data=True,
)