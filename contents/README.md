# Contents App

File storage and media management system for the Academia platform, handling file uploads, storage, and delivery through S3-compatible storage and CDN.

## 🏗️ Architecture Overview

The contents app provides a comprehensive file management system with:

- **File Storage**: S3-compatible storage for files and media
- **CDN Integration**: Content delivery network for fast file access
- **File Management**: Upload, organize, and manage files
- **Gallery System**: Image gallery and media organization
- **Access Control**: File access permissions and restrictions

## 📊 Models

### File Model

**Location**: `contents/models.py`

```python
class File(models.Model):
    FILE_TYPE_CHOICES = [
        ('image', 'Image'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('document', 'Document'),
        ('pdf', 'PDF'),
        ('other', 'Other'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES)
    file = models.FileField(upload_to='files/')
    file_size = models.PositiveIntegerField()
    mime_type = models.CharField(max_length=100)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    is_public = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Key Features**:
- Multiple file types support
- File metadata tracking
- User-based uploads
- Public/private access control
- File size and MIME type tracking

### Gallery Model

**Location**: `contents/models.py`

```python
class Gallery(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    is_public = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Key Features**:
- Gallery organization
- Owner-based galleries
- Public/private access
- Active status management

### GalleryItem Model

**Location**: `contents/models.py`

```python
class GalleryItem(models.Model):
    gallery = models.ForeignKey(Gallery, on_delete=models.CASCADE, related_name='items')
    file = models.ForeignKey(File, on_delete=models.CASCADE)
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

**Key Features**:
- Gallery-file relationship
- Item ordering
- Item metadata
- Active status tracking

## 📁 File Storage System

### S3-Compatible Storage

**Storage Configuration**:
```python
# Django settings for S3 storage
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
AWS_ACCESS_KEY_ID = 'your-access-key'
AWS_SECRET_ACCESS_KEY = 'your-secret-key'
AWS_STORAGE_BUCKET_NAME = 'your-bucket-name'
AWS_S3_ENDPOINT_URL = 'your-s3-endpoint'
```

**Storage Features**:
- S3-compatible storage
- CDN integration
- File versioning
- Automatic backup

### File Upload System

**Upload Process**:
```python
def upload_file(file, user, title=None):
    """Upload file to S3 storage"""
    # Validate file
    # Generate unique filename
    # Upload to S3
    # Create file record
    # Return file object
```

**Upload Features**:
- File validation
- Size limits
- Type restrictions
- Virus scanning
- Automatic optimization

### File Access Control

**Access Levels**:
- **Public**: Accessible to all users
- **Private**: Accessible only to owner
- **Restricted**: Accessible to specific users
- **Protected**: Accessible with authentication

**Access Management**:
- User-based permissions
- Role-based access
- Time-based access
- Download limits

## 📡 API Endpoints

### File Management

**Base URL**: `/contents/files/`

#### File Operations
- **GET** `/files/` - List files
- **POST** `/files/` - Upload file
- **GET** `/files/{id}/` - Get file details
- **PUT** `/files/{id}/` - Update file
- **DELETE** `/files/{id}/` - Delete file

#### File Actions
- **GET** `/files/{id}/download/` - Download file
- **GET** `/files/{id}/preview/` - Preview file
- **POST** `/files/{id}/share/` - Share file
- **GET** `/files/{id}/access/` - Check file access

### Gallery Management

**Base URL**: `/contents/galleries/`

#### Gallery Operations
- **GET** `/galleries/` - List galleries
- **POST** `/galleries/` - Create gallery
- **GET** `/galleries/{id}/` - Get gallery details
- **PUT** `/galleries/{id}/` - Update gallery
- **DELETE** `/galleries/{id}/` - Delete gallery

#### Gallery Actions
- **GET** `/galleries/{id}/items/` - Get gallery items
- **POST** `/galleries/{id}/items/` - Add item to gallery
- **PUT** `/galleries/{id}/items/{item_id}/` - Update gallery item
- **DELETE** `/galleries/{id}/items/{item_id}/` - Remove item from gallery

### File Operations

**Base URL**: `/contents/`

#### File Operations
- **POST** `/upload/` - Upload file
- **GET** `/download/{id}/` - Download file
- **GET** `/preview/{id}/` - Preview file
- **POST** `/share/` - Share file

## 🖼️ Media Management

### Image Processing

**Image Features**:
- Automatic resizing
- Format conversion
- Quality optimization
- Thumbnail generation

**Image Processing**:
```python
def process_image(file):
    """Process uploaded image"""
    # Resize image
    # Optimize quality
    # Generate thumbnails
    # Convert format
    # Return processed image
```

### Video Processing

**Video Features**:
- Format conversion
- Quality optimization
- Thumbnail generation
- Streaming optimization

**Video Processing**:
```python
def process_video(file):
    """Process uploaded video"""
    # Convert format
    # Optimize quality
    # Generate thumbnails
    # Create streaming versions
    # Return processed video
```

### Document Processing

**Document Features**:
- PDF optimization
- Text extraction
- Metadata extraction
- Search indexing

**Document Processing**:
```python
def process_document(file):
    """Process uploaded document"""
    # Extract text
    # Extract metadata
    # Optimize file
    # Index for search
    # Return processed document
```

## 🎨 Gallery System

### Gallery Organization

**Gallery Features**:
- Hierarchical organization
- Item ordering
- Metadata management
- Access control

**Gallery Management**:
```python
def create_gallery(user, title, description=None):
    """Create new gallery"""
    # Create gallery
    # Set permissions
    # Return gallery object
```

### Gallery Items

**Item Features**:
- File association
- Item ordering
- Metadata management
- Active status

**Item Management**:
```python
def add_item_to_gallery(gallery, file, title=None, order=0):
    """Add item to gallery"""
    # Create gallery item
    # Set order
    # Return item object
```

## 🔄 File Workflow

### File Upload

1. **File Selection**
   - User selects file
   - File validation
   - Size and type checking
   - Security scanning

2. **File Processing**
   - File optimization
   - Format conversion
   - Thumbnail generation
   - Metadata extraction

3. **Storage**
   - Upload to S3
   - CDN distribution
   - Database record
   - Access permissions

### File Access

1. **Access Request**
   - User requests file
   - Permission check
   - Access validation
   - Rate limiting

2. **File Delivery**
   - CDN delivery
   - Streaming optimization
   - Caching
   - Performance monitoring

### File Management

1. **File Organization**
   - Gallery creation
   - Item organization
   - Metadata management
   - Access control

2. **File Sharing**
   - Share permissions
   - Access links
   - Expiration settings
   - Usage tracking

## 🧪 Testing

### Unit Tests

**Test Coverage**:
- File model validation
- Upload functionality
- Gallery management
- Access control

**Running Tests**:
```bash
python manage.py test contents
```

### Integration Tests

**Test Coverage**:
- Complete upload flow
- Gallery operations
- File access
- API endpoints

### Performance Tests

**Scenarios**:
- Large file uploads
- Concurrent uploads
- CDN performance
- Storage optimization

## 📈 Performance Optimization

### Storage Optimization

- **CDN**: Global content delivery
- **Caching**: File caching
- **Compression**: File compression
- **Optimization**: Automatic optimization

### Database Optimization

- **Indexes**: Strategic indexing on file fields
- **Query Optimization**: select_related for file relationships
- **Caching**: File metadata caching
- **Connection Pooling**: Database connection optimization

### API Optimization

- **Pagination**: File list pagination
- **Filtering**: Efficient file filtering
- **Serialization**: Optimized file serialization
- **Response Caching**: Cached file data

## 🔧 Configuration

### Storage Settings

**Default Configuration**:
```python
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
ALLOWED_FILE_TYPES = ['image', 'video', 'audio', 'document', 'pdf']
CDN_ENABLED = True
FILE_COMPRESSION = True
```

### Upload Settings

**Upload Configuration**:
```python
UPLOAD_TIMEOUT = 300  # 5 minutes
CHUNK_SIZE = 8192  # 8KB
MAX_CONCURRENT_UPLOADS = 5
VIRUS_SCANNING_ENABLED = True
```

### Gallery Settings

**Gallery Configuration**:
```python
MAX_GALLERY_ITEMS = 1000
GALLERY_CACHE_TTL = 3600  # 1 hour
THUMBNAIL_SIZES = ['small', 'medium', 'large']
IMAGE_OPTIMIZATION = True
```

## 🚀 Deployment Considerations

### Production Settings

- **Storage**: S3-compatible storage
- **CDN**: Global content delivery
- **Database**: PostgreSQL for production
- **Monitoring**: File performance monitoring

### Security Considerations

- **File Security**: Secure file storage
- **Access Control**: File access restrictions
- **Virus Scanning**: File security scanning
- **Audit Logging**: File activity logging

### Scaling Considerations

- **Horizontal Scaling**: Multiple server instances
- **Load Balancing**: File distribution
- **CDN Scaling**: Global content delivery
- **Storage Scaling**: Distributed storage

## 📚 Related Documentation

- [Shop App](shop/README.md) - Product file management
- [Tests App](tests/README.md) - Test file management
- [Backend Architecture](api/README.md)
- [API Documentation](docs/API.md)
- [Storage Guide](docs/STORAGE.md)

---

**File Storage & Media Management** - Comprehensive file management and storage system
