# Quick Start Guide - Legal Document PDF Converter

## Installation

### Step 1: Clone the Repository
```bash
git clone https://github.com/Jobikinobi/PDf-Converter.git
cd PDf-Converter
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Install the Tool (Optional)
For system-wide access:
```bash
pip install -e .
```

Or run directly:
```bash
python3 pdf_converter.py --help
```

## Quick Usage Examples

### 1. Merge Multiple PDFs
```bash
python3 pdf_converter.py merge doc1.pdf doc2.pdf doc3.pdf -o merged.pdf
```

### 2. Convert Images to PDF
```bash
python3 pdf_converter.py convert scan1.jpg scan2.jpg scan3.jpg -o document.pdf -q high
```

### 3. Optimize a PDF
```bash
python3 pdf_converter.py optimize large.pdf -o optimized.pdf -q high
```

### 4. Batch Process (Convert + Merge + Optimize)
```bash
python3 pdf_converter.py batch image1.jpg image2.jpg --pdf doc1.pdf --pdf doc2.pdf -o final.pdf -q high
```

## Quality Levels

- **high**: 300 DPI, 95% quality (Default - for legal documents)
- **medium**: 200 DPI, 85% quality (Good balance)
- **low**: 150 DPI, 75% quality (Smaller files)

## Common Legal Document Workflows

### Scanning and Preparing Court Filings
```bash
# Step 1: Convert scanned pages
python3 pdf_converter.py convert page*.jpg -o scanned.pdf -q high

# Step 2: Merge with exhibits
python3 pdf_converter.py merge cover.pdf scanned.pdf exhibit_a.pdf -o filing.pdf

# Step 3: Optimize for submission
python3 pdf_converter.py optimize filing.pdf -o final_filing.pdf -q high
```

### Quick One-Step Processing
```bash
python3 pdf_converter.py batch scan1.jpg scan2.jpg scan3.jpg --pdf cover.pdf --pdf exhibits.pdf -o complete_filing.pdf -q high
```

## Testing

Run the test suite:
```bash
python3 -m unittest tests/test_pdf_converter.py -v
```

## System Requirements

- Python 3.8 or higher
- 2GB RAM minimum (4GB recommended for large documents)
- 100MB free disk space for dependencies

## Supported Formats

**Input:**
- Images: JPEG, PNG, TIFF, BMP, GIF
- PDFs: All versions (1.0 through 2.0)

**Output:**
- PDF with optimized compression

## Getting Help

```bash
# General help
python3 pdf_converter.py --help

# Command-specific help
python3 pdf_converter.py merge --help
python3 pdf_converter.py convert --help
python3 pdf_converter.py optimize --help
python3 pdf_converter.py batch --help
```

## Troubleshooting

**Issue**: "Module not found" errors
**Solution**: Run `pip install -r requirements.txt`

**Issue**: Out of memory with large files
**Solution**: Process files in smaller batches

**Issue**: Poor quality output
**Solution**: Use `-q high` and ensure input images are at least 300 DPI

For more detailed information, see README.md and CONFIG.md
