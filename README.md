# Legal Document PDF Converter

A powerful command-line tool for legal document preparation that enables PDF merging, image-to-PDF conversion, and advanced PDF optimization with high-quality compression.

## Features

- **PDF Merging**: Combine multiple PDF files into a single document
- **Image to PDF Conversion**: Convert images (JPEG, PNG, TIFF, BMP, GIF) to PDF format
- **Advanced PDF Optimization**: Compress PDFs while maintaining quality suitable for legal documents
- **High-Quality Compression**: Uses industry-standard codecs that preserve or exceed Adobe Acrobat Pro compression quality
- **Batch Processing**: Process multiple files in a single command
- **Flexible Quality Settings**: Choose between high, medium, or low quality compression levels

## Installation

### Prerequisites

- Python 3.8 or higher
- pip package manager

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Install the Tool

```bash
pip install -e .
```

This will install the `pdf-converter` command-line tool.

## Usage

### Merge PDFs

Combine multiple PDF files into a single document:

```bash
pdf-converter merge file1.pdf file2.pdf file3.pdf -o merged.pdf
```

### Convert Images to PDF

Convert one or more images to a PDF document:

```bash
pdf-converter convert image1.jpg image2.png image3.jpg -o document.pdf
```

With quality settings:

```bash
pdf-converter convert image1.jpg image2.png -o document.pdf -q high
```

### Optimize PDF

Compress and optimize a PDF file while maintaining high quality:

```bash
pdf-converter optimize input.pdf -o optimized.pdf
```

With custom quality level:

```bash
pdf-converter optimize input.pdf -o optimized.pdf -q medium
```

### Batch Processing

Convert images and merge with existing PDFs in one step:

```bash
pdf-converter batch img1.jpg img2.png --pdf file1.pdf file2.pdf -o final.pdf -q high
```

## Quality Settings

The tool offers three quality levels optimized for legal documents:

- **high** (default): 300 DPI, 95% quality - Best for legal documents requiring maximum clarity
- **medium**: 200 DPI, 85% quality - Good balance between quality and file size
- **low**: 150 DPI, 75% quality - Smaller files while maintaining readability

## Technical Details

### Compression Technology

The tool uses advanced compression algorithms that:

- Preserve image quality using JPEG DCT encoding
- Optimize PDF stream compression
- Maintain document structure integrity
- Ensure compatibility with all PDF readers

### Supported Formats

**Input Images:**
- JPEG/JPG
- PNG
- TIFF/TIF
- BMP
- GIF

**PDF Operations:**
- All standard PDF versions
- Encrypted PDFs (with password)
- Multi-page documents

## Examples

### Legal Document Workflow

1. **Scan documents** as high-resolution images
2. **Convert to PDF** with high quality:
   ```bash
   pdf-converter convert scan1.jpg scan2.jpg scan3.jpg -o scanned-docs.pdf -q high
   ```
3. **Merge with existing PDFs**:
   ```bash
   pdf-converter merge scanned-docs.pdf existing-doc.pdf -o complete-filing.pdf
   ```
4. **Optimize for submission**:
   ```bash
   pdf-converter optimize complete-filing.pdf -o final-submission.pdf -q high
   ```

### Quick Batch Processing

Process everything in one command:

```bash
pdf-converter batch *.jpg --pdf *.pdf -o legal-package.pdf -q high
```

## Command Reference

### Global Options

- `--version`: Show version information
- `--help`: Show help message

### Commands

All commands support the following options where applicable:

- `-o, --output`: Output file path (required)
- `-q, --quality`: Quality level (high/medium/low, default: high)

For detailed help on any command:

```bash
pdf-converter <command> --help
```

## Development

### Running Tests

```bash
python -m pytest tests/
```

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

&copy; 2025 GitHub &bull; [MIT License](https://gh.io/mit)
