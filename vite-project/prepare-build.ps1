# This script prepares the project for build by copying necessary PDF viewer CSS files
# from node_modules to public directory

# Create directories if they don't exist
mkdir -Force public\css\react-pdf-viewer\core
mkdir -Force public\css\react-pdf-viewer\page-navigation
mkdir -Force public\css\react-pdf-viewer\zoom

# Copy CSS files
Copy-Item -Path node_modules\@react-pdf-viewer\core\lib\styles\index.css -Destination public\css\react-pdf-viewer\core\
Copy-Item -Path node_modules\@react-pdf-viewer\page-navigation\lib\styles\index.css -Destination public\css\react-pdf-viewer\page-navigation\
Copy-Item -Path node_modules\@react-pdf-viewer\zoom\lib\styles\index.css -Destination public\css\react-pdf-viewer\zoom\

Write-Output "PDF viewer CSS files have been copied to public directory."
