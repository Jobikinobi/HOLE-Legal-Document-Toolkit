#!/usr/bin/env python3
"""
Legal Document PDF Converter
A command-line tool for merging PDFs, converting images to PDFs,
and optimizing PDFs with high-quality compression suitable for legal documents.
"""

import os
import sys
import tempfile
from pathlib import Path
from typing import List, Optional
import click
from PyPDF2 import PdfMerger, PdfReader, PdfWriter
from PIL import Image
import img2pdf
import pikepdf
from io import BytesIO


class PDFConverter:
    """Main class for PDF conversion and optimization operations."""
    
    def __init__(self, quality: str = 'high'):
        """
        Initialize the PDF converter.
        
        Args:
            quality: Compression quality level ('high', 'medium', 'low')
        """
        self.quality = quality
        self.quality_settings = {
            'high': {'dpi': 300, 'quality': 95, 'optimize': True},
            'medium': {'dpi': 200, 'quality': 85, 'optimize': True},
            'low': {'dpi': 150, 'quality': 75, 'optimize': True}
        }
    
    def merge_pdfs(self, input_files: List[str], output_file: str) -> bool:
        """
        Merge multiple PDF files into a single PDF.
        
        Args:
            input_files: List of PDF file paths to merge
            output_file: Path to the output merged PDF file
            
        Returns:
            True if successful, False otherwise
        """
        try:
            merger = PdfMerger()
            
            for pdf_file in input_files:
                if not os.path.exists(pdf_file):
                    click.echo(f"Error: File not found: {pdf_file}", err=True)
                    return False
                    
                click.echo(f"Adding: {pdf_file}")
                merger.append(pdf_file)
            
            merger.write(output_file)
            merger.close()
            
            click.echo(f"Successfully merged {len(input_files)} PDFs into {output_file}")
            return True
            
        except Exception as e:
            click.echo(f"Error merging PDFs: {str(e)}", err=True)
            return False
    
    def image_to_pdf(self, image_files: List[str], output_file: str) -> bool:
        """
        Convert image files to a single PDF document.
        
        Args:
            image_files: List of image file paths
            output_file: Path to the output PDF file
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Verify all files exist
            for img_file in image_files:
                if not os.path.exists(img_file):
                    click.echo(f"Error: File not found: {img_file}", err=True)
                    return False
            
            # Get quality settings
            settings = self.quality_settings[self.quality]
            dpi = settings['dpi']
            
            # Process images
            processed_images = []
            for img_file in image_files:
                click.echo(f"Processing: {img_file}")
                
                # Open and process image
                img = Image.open(img_file)
                
                # Convert to RGB if necessary (for JPEG compatibility)
                if img.mode in ('RGBA', 'LA', 'P'):
                    rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    if img.mode in ('RGBA', 'LA'):
                        rgb_img.paste(img, mask=img.split()[-1] if len(img.split()) > 3 else None)
                    img = rgb_img
                
                # Save to BytesIO with quality settings
                img_bytes = BytesIO()
                img.save(img_bytes, format='JPEG', quality=settings['quality'], optimize=settings['optimize'], dpi=(dpi, dpi))
                img_bytes.seek(0)
                processed_images.append(img_bytes.getvalue())
            
            # Convert to PDF using img2pdf with proper DPI settings
            layout_fun = img2pdf.get_layout_fun(pagesize=None, imgsize=None, border=None, fit=img2pdf.FitMode.into, auto_orient=True)
            
            with open(output_file, "wb") as f:
                f.write(img2pdf.convert(processed_images, layout_fun=layout_fun))
            
            click.echo(f"Successfully converted {len(image_files)} images to {output_file}")
            return True
            
        except Exception as e:
            click.echo(f"Error converting images to PDF: {str(e)}", err=True)
            return False
    
    def optimize_pdf(self, input_file: str, output_file: str) -> bool:
        """
        Optimize a PDF file by compressing images while maintaining quality.
        Uses pikepdf for advanced PDF optimization.
        
        Args:
            input_file: Path to the input PDF file
            output_file: Path to the output optimized PDF file
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if not os.path.exists(input_file):
                click.echo(f"Error: File not found: {input_file}", err=True)
                return False
            
            click.echo(f"Optimizing: {input_file}")
            
            # Get quality settings
            settings = self.quality_settings[self.quality]
            
            # Open PDF with pikepdf for optimization
            with pikepdf.open(input_file) as pdf:
                # Optimize images in the PDF
                for page in pdf.pages:
                    if '/Resources' in page and '/XObject' in page['/Resources']:
                        xobjects = page['/Resources']['/XObject']
                        
                        for name in xobjects:
                            obj = xobjects[name]
                            
                            # Check if it's an image
                            if '/Subtype' in obj and obj['/Subtype'] == '/Image':
                                # Extract and recompress image
                                try:
                                    raw_image = obj.read_bytes()
                                    
                                    # Only recompress if it's significant size
                                    if len(raw_image) > 1024:  # > 1KB
                                        img = Image.open(BytesIO(raw_image))
                                        
                                        # Convert to RGB if necessary
                                        if img.mode in ('RGBA', 'LA', 'P'):
                                            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                                            if img.mode == 'P':
                                                img = img.convert('RGBA')
                                            if img.mode in ('RGBA', 'LA'):
                                                rgb_img.paste(img, mask=img.split()[-1] if len(img.split()) > 3 else None)
                                            img = rgb_img
                                        
                                        # Compress image
                                        img_bytes = BytesIO()
                                        img.save(img_bytes, format='JPEG', quality=settings['quality'], optimize=settings['optimize'])
                                        img_bytes.seek(0)
                                        
                                        # Replace image in PDF
                                        obj.write(img_bytes.read(), filter=pikepdf.Name.DCTDecode)
                                
                                except Exception as img_error:
                                    # Skip images that can't be processed
                                    click.echo(f"Warning: Could not optimize image {name}: {str(img_error)}", err=True)
                                    continue
                
                # Save optimized PDF
                pdf.save(output_file, compress_streams=True, object_stream_mode=pikepdf.ObjectStreamMode.generate)
            
            # Report file size reduction
            original_size = os.path.getsize(input_file)
            optimized_size = os.path.getsize(output_file)
            reduction = ((original_size - optimized_size) / original_size) * 100
            
            click.echo(f"Successfully optimized PDF:")
            click.echo(f"  Original size: {original_size / 1024:.2f} KB")
            click.echo(f"  Optimized size: {optimized_size / 1024:.2f} KB")
            click.echo(f"  Reduction: {reduction:.2f}%")
            
            return True
            
        except Exception as e:
            click.echo(f"Error optimizing PDF: {str(e)}", err=True)
            return False


@click.group()
@click.version_option(version='1.0.0')
def cli():
    """
    Legal Document PDF Converter
    
    A command-line tool for merging PDFs, converting images to PDFs,
    and optimizing PDFs with high-quality compression suitable for legal documents.
    """
    pass


@cli.command()
@click.argument('input_files', nargs=-1, required=True, type=click.Path(exists=True))
@click.option('-o', '--output', required=True, type=click.Path(), help='Output PDF file path')
def merge(input_files, output):
    """
    Merge multiple PDF files into a single PDF.
    
    Example:
        pdf-converter merge file1.pdf file2.pdf file3.pdf -o merged.pdf
    """
    converter = PDFConverter()
    success = converter.merge_pdfs(list(input_files), output)
    sys.exit(0 if success else 1)


@cli.command()
@click.argument('image_files', nargs=-1, required=True, type=click.Path(exists=True))
@click.option('-o', '--output', required=True, type=click.Path(), help='Output PDF file path')
@click.option('-q', '--quality', type=click.Choice(['high', 'medium', 'low']), default='high', 
              help='Compression quality level (default: high)')
def convert(image_files, output, quality):
    """
    Convert image files to a PDF document.
    
    Supports: JPEG, PNG, TIFF, BMP, GIF
    
    Example:
        pdf-converter convert image1.jpg image2.png -o document.pdf -q high
    """
    converter = PDFConverter(quality=quality)
    success = converter.image_to_pdf(list(image_files), output)
    sys.exit(0 if success else 1)


@cli.command()
@click.argument('input_file', type=click.Path(exists=True))
@click.option('-o', '--output', required=True, type=click.Path(), help='Output PDF file path')
@click.option('-q', '--quality', type=click.Choice(['high', 'medium', 'low']), default='high',
              help='Compression quality level (default: high)')
def optimize(input_file, output, quality):
    """
    Optimize a PDF file by compressing images while maintaining quality.
    
    This uses advanced compression algorithms to reduce file size while
    preserving image quality suitable for legal documents.
    
    Example:
        pdf-converter optimize input.pdf -o optimized.pdf -q high
    """
    converter = PDFConverter(quality=quality)
    success = converter.optimize_pdf(input_file, output)
    sys.exit(0 if success else 1)


@cli.command()
@click.argument('image_files', nargs=-1, type=click.Path(exists=True))
@click.option('--pdf', 'pdf_files', multiple=True, type=click.Path(exists=True), help='PDF files to merge')
@click.option('-o', '--output', required=True, type=click.Path(), help='Output PDF file path')
@click.option('-q', '--quality', type=click.Choice(['high', 'medium', 'low']), default='high',
              help='Compression quality level (default: high)')
def batch(image_files, pdf_files, output, quality):
    """
    Batch process: convert images to PDF, then merge with existing PDFs, and optimize.
    
    This is a convenience command that performs all operations in one step.
    
    Example:
        pdf-converter batch img1.jpg img2.png --pdf file1.pdf --pdf file2.pdf -o final.pdf -q high
    """
    converter = PDFConverter(quality=quality)
    temp_files = []
    temp_dir = tempfile.mkdtemp()
    
    # Validate that at least one input is provided
    if not image_files and not pdf_files:
        click.echo("Error: At least one image file or PDF file must be provided", err=True)
        sys.exit(1)
    
    try:
        # Convert images to temporary PDF if there are any
        if image_files:
            temp_img_pdf = os.path.join(temp_dir, 'temp_images.pdf')
            if not converter.image_to_pdf(list(image_files), temp_img_pdf):
                sys.exit(1)
            temp_files.append(temp_img_pdf)
        
        # Prepare list of PDFs to merge
        all_pdfs = temp_files + list(pdf_files)
        
        # Merge all PDFs
        temp_merged = os.path.join(temp_dir, 'temp_merged.pdf')
        if not converter.merge_pdfs(all_pdfs, temp_merged):
            sys.exit(1)
        temp_files.append(temp_merged)
        
        # Optimize the final PDF
        if not converter.optimize_pdf(temp_merged, output):
            sys.exit(1)
        
        click.echo(f"\nBatch processing complete: {output}")
        sys.exit(0)
        
    finally:
        # Clean up temporary files and directory
        for temp_file in temp_files:
            if os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except OSError:
                    pass
        
        # Remove temporary directory
        try:
            os.rmdir(temp_dir)
        except OSError:
            pass


if __name__ == '__main__':
    cli()
