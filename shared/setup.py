"""
Setup configuration for the Epi-Logos System shared components.
Enables development installation of the shared package.
"""

from setuptools import setup, find_packages

setup(
    name="epi-logos-shared",
    version="0.1.0",
    description="Epi-Logos System Shared Components",
    packages=find_packages(include=['shared', 'shared.*']),
    python_requires=">=3.9",
    install_requires=[
        # Database client dependencies
        "neo4j",
        "pymongo",
        "redis", 
        "qdrant-client",
        "pydantic",
    ],
    include_package_data=True,
)