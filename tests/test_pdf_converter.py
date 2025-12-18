#!/usr/bin/env python3
"""
Unit tests for PDF Converter
"""

import os
import sys
import unittest
import tempfile
import shutil
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pdf_converter import PDFConverter


class TestPDFConverter(unittest.TestCase):
    """Test cases for PDFConverter class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.converter = PDFConverter(quality='high')
        self.temp_dir = tempfile.mkdtemp()
    
    def tearDown(self):
        """Clean up test fixtures."""
        # Clean up temporary directory
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
    
    def test_converter_initialization(self):
        """Test PDFConverter initialization."""
        self.assertEqual(self.converter.quality, 'high')
        self.assertIn('high', self.converter.quality_settings)
        self.assertIn('medium', self.converter.quality_settings)
        self.assertIn('low', self.converter.quality_settings)
    
    def test_quality_settings(self):
        """Test quality settings for different levels."""
        high_converter = PDFConverter(quality='high')
        self.assertEqual(high_converter.quality_settings['high']['dpi'], 300)
        self.assertEqual(high_converter.quality_settings['high']['quality'], 95)
        
        medium_converter = PDFConverter(quality='medium')
        self.assertEqual(medium_converter.quality_settings['medium']['dpi'], 200)
        self.assertEqual(medium_converter.quality_settings['medium']['quality'], 85)
        
        low_converter = PDFConverter(quality='low')
        self.assertEqual(low_converter.quality_settings['low']['dpi'], 150)
        self.assertEqual(low_converter.quality_settings['low']['quality'], 75)
    
    def test_merge_pdfs_file_not_found(self):
        """Test merge_pdfs with non-existent file."""
        non_existent = os.path.join(self.temp_dir, 'nonexistent.pdf')
        output = os.path.join(self.temp_dir, 'output.pdf')
        
        result = self.converter.merge_pdfs([non_existent], output)
        self.assertFalse(result)
    
    def test_image_to_pdf_file_not_found(self):
        """Test image_to_pdf with non-existent file."""
        non_existent = os.path.join(self.temp_dir, 'nonexistent.jpg')
        output = os.path.join(self.temp_dir, 'output.pdf')
        
        result = self.converter.image_to_pdf([non_existent], output)
        self.assertFalse(result)
    
    def test_optimize_pdf_file_not_found(self):
        """Test optimize_pdf with non-existent file."""
        non_existent = os.path.join(self.temp_dir, 'nonexistent.pdf')
        output = os.path.join(self.temp_dir, 'output.pdf')
        
        result = self.converter.optimize_pdf(non_existent, output)
        self.assertFalse(result)


class TestCLICommands(unittest.TestCase):
    """Test cases for CLI commands."""
    
    def test_cli_help(self):
        """Test CLI help command."""
        from click.testing import CliRunner
        from pdf_converter import cli
        
        runner = CliRunner()
        result = runner.invoke(cli, ['--help'])
        
        self.assertEqual(result.exit_code, 0)
        self.assertIn('Legal Document PDF Converter', result.output)
    
    def test_merge_command_help(self):
        """Test merge command help."""
        from click.testing import CliRunner
        from pdf_converter import cli
        
        runner = CliRunner()
        result = runner.invoke(cli, ['merge', '--help'])
        
        self.assertEqual(result.exit_code, 0)
        self.assertIn('Merge multiple PDF files', result.output)
    
    def test_convert_command_help(self):
        """Test convert command help."""
        from click.testing import CliRunner
        from pdf_converter import cli
        
        runner = CliRunner()
        result = runner.invoke(cli, ['convert', '--help'])
        
        self.assertEqual(result.exit_code, 0)
        self.assertIn('Convert image files', result.output)
    
    def test_optimize_command_help(self):
        """Test optimize command help."""
        from click.testing import CliRunner
        from pdf_converter import cli
        
        runner = CliRunner()
        result = runner.invoke(cli, ['optimize', '--help'])
        
        self.assertEqual(result.exit_code, 0)
        self.assertIn('Optimize a PDF file', result.output)


if __name__ == '__main__':
    unittest.main()
