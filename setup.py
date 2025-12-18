"""
Setup script for Legal Document PDF Converter
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="legal-pdf-converter",
    version="1.0.0",
    author="Legal Document Solutions",
    description="A command-line tool for merging PDFs, converting images to PDFs, and optimizing PDFs with high-quality compression",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/Jobikinobi/PDf-Converter",
    py_modules=["pdf_converter"],
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Legal Industry",
        "Topic :: Office/Business",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    entry_points={
        "console_scripts": [
            "pdf-converter=pdf_converter:cli",
        ],
    },
)
