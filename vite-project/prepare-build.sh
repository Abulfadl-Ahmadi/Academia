#!/bin/bash

# This script prepares the project for build by copying necessary PDF viewer CSS files
# from node_modules to public directory

# Create directories if they don't exist
mkdir -p public/css/react-pdf-viewer/core
mkdir -p public/css/react-pdf-viewer/page-navigation
mkdir -p public/css/react-pdf-viewer/zoom

# Copy CSS files
cp node_modules/@react-pdf-viewer/core/lib/styles/index.css public/css/react-pdf-viewer/core/
cp node_modules/@react-pdf-viewer/page-navigation/lib/styles/index.css public/css/react-pdf-viewer/page-navigation/
cp node_modules/@react-pdf-viewer/zoom/lib/styles/index.css public/css/react-pdf-viewer/zoom/

# Copy PDF worker file if available
if [ -f "node_modules/pdfjs-dist/build/pdf.worker.min.js" ]; then
  cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/pdf.worker.min.js
fi

echo "PDF viewer CSS files have been copied to public directory."
