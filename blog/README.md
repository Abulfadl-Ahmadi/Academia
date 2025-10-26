# Blog App

Content management system for the Academia platform, handling blog posts, articles, and content publishing with rich text editing capabilities.

## 🏗️ Architecture Overview

The blog app provides a comprehensive content management system with:

- **Blog Management**: Blog post creation, editing, and publishing
- **Content Organization**: Category and tag-based content organization
- **Rich Text Editing**: Advanced text editing capabilities
- **Content Publishing**: Draft, review, and publish workflow
- **Content Discovery**: Search and filtering capabilities

## 📊 Models

### BlogPost Model

**Location**: `blog/models.py`

```python
class BlogPost(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]
    
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    content = models.TextField()
    excerpt = models.TextField(blank=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    featured_image = models.ImageField(upload_to='blog/images/', blank=True)
    is_featured = models.BooleanField(default=False)
    view_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
```

**Key Features**:
- SEO-friendly slugs
- Rich text content
- Author attribution
- Status management
- Featured content support
- View tracking
- Publication timestamps

### BlogCategory Model

**Location**: `blog/models.py`

```python
class BlogCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#000000')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

**Key Features**:
- Category organization
- Color coding
- Active status management
- SEO-friendly slugs
- Description support

### BlogTag Model

**Location**: `blog/models.py`

```python
class BlogTag(models.Model):
    name = models.CharField(max_length=50)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

**Key Features**:
- Tag-based organization
- SEO-friendly slugs
- Description support
- Active status management

### BlogPostCategory Model

**Location**: `blog/models.py`

```python
class BlogPostCategory(models.Model):
    post = models.ForeignKey(BlogPost, on_delete=models.CASCADE)
    category = models.ForeignKey(BlogCategory, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
```

**Key Features**:
- Many-to-many relationship
- Post-category association
- Timestamp tracking

### BlogPostTag Model

**Location**: `blog/models.py`

```python
class BlogPostTag(models.Model):
    post = models.ForeignKey(BlogPost, on_delete=models.CASCADE)
    tag = models.ForeignKey(BlogTag, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
```

**Key Features**:
- Many-to-many relationship
- Post-tag association
- Timestamp tracking

## 📝 Content Management

### Rich Text Editing

**Editor Features**:
- **WYSIWYG**: What you see is what you get editing
- **Formatting**: Bold, italic, underline, strikethrough
- **Lists**: Ordered and unordered lists
- **Links**: Internal and external links
- **Images**: Image insertion and management
- **Tables**: Table creation and editing
- **Code**: Code block insertion
- **Quotes**: Blockquote formatting

**Editor Integration**:
```python
def save_blog_post(title, content, author, status='draft'):
    """Save blog post with rich text content"""
    # Validate content
    # Process rich text
    # Save to database
    # Return post object
```

### Content Organization

**Organization Features**:
- **Categories**: Hierarchical category organization
- **Tags**: Flexible tag-based organization
- **Featured Content**: Highlighted content support
- **Status Management**: Draft, published, archived states
- **Author Attribution**: Content creator tracking

### Content Publishing

**Publishing Workflow**:
1. **Draft Creation**: Author creates draft content
2. **Content Review**: Content is reviewed and edited
3. **Publishing**: Content is published
4. **Promotion**: Content is promoted and shared
5. **Archiving**: Content is archived when outdated

## 📡 API Endpoints

### Blog Post Management

**Base URL**: `/blog/posts/`

#### Post Operations
- **GET** `/posts/` - List blog posts
- **POST** `/posts/` - Create blog post
- **GET** `/posts/{id}/` - Get blog post details
- **PUT** `/posts/{id}/` - Update blog post
- **DELETE** `/posts/{id}/` - Delete blog post

#### Post Actions
- **POST** `/posts/{id}/publish/` - Publish blog post
- **POST** `/posts/{id}/archive/` - Archive blog post
- **GET** `/posts/{id}/content/` - Get post content
- **POST** `/posts/{id}/feature/` - Feature blog post

### Category Management

**Base URL**: `/blog/categories/`

#### Category Operations
- **GET** `/categories/` - List categories
- **POST** `/categories/` - Create category
- **GET** `/categories/{id}/` - Get category details
- **PUT** `/categories/{id}/` - Update category
- **DELETE** `/categories/{id}/` - Delete category

#### Category Actions
- **GET** `/categories/{id}/posts/` - Get category posts
- **POST** `/categories/{id}/posts/` - Add post to category

### Tag Management

**Base URL**: `/blog/tags/`

#### Tag Operations
- **GET** `/tags/` - List tags
- **POST** `/tags/` - Create tag
- **GET** `/tags/{id}/` - Get tag details
- **PUT** `/tags/{id}/` - Update tag
- **DELETE** `/tags/{id}/` - Delete tag

#### Tag Actions
- **GET** `/tags/{id}/posts/` - Get tag posts
- **POST** `/tags/{id}/posts/` - Add post to tag

### Content Discovery

**Base URL**: `/blog/`

#### Discovery Operations
- **GET** `/search/` - Search blog posts
- **GET** `/featured/` - Get featured posts
- **GET** `/recent/` - Get recent posts
- **GET** `/popular/` - Get popular posts

## 🔍 Content Discovery

### Search Functionality

**Search Features**:
- **Full-text Search**: Content and title search
- **Category Filtering**: Filter by categories
- **Tag Filtering**: Filter by tags
- **Author Filtering**: Filter by authors
- **Date Filtering**: Filter by publication date
- **Status Filtering**: Filter by publication status

**Search Implementation**:
```python
def search_posts(query, filters=None):
    """Search blog posts with filters"""
    # Build search query
    # Apply filters
    # Execute search
    # Return results
```

### Content Filtering

**Filter Options**:
- **Category**: Filter by content category
- **Tag**: Filter by content tags
- **Author**: Filter by content author
- **Status**: Filter by publication status
- **Date Range**: Filter by publication date
- **Featured**: Filter featured content

### Content Sorting

**Sort Options**:
- **Date**: Sort by publication date
- **Title**: Sort alphabetically
- **Views**: Sort by view count
- **Author**: Sort by author name
- **Category**: Sort by category

## 📊 Content Analytics

### View Tracking

**View Metrics**:
- **Total Views**: Overall view count
- **Unique Views**: Unique visitor count
- **View Trends**: View count over time
- **Popular Content**: Most viewed content

**View Implementation**:
```python
def track_view(post, user=None):
    """Track blog post view"""
    # Increment view count
    # Track unique views
    # Update analytics
    # Return view data
```

### Content Performance

**Performance Metrics**:
- **Engagement**: User engagement metrics
- **Popularity**: Content popularity ranking
- **Trends**: Content performance trends
- **Analytics**: Detailed content analytics

### Author Analytics

**Author Metrics**:
- **Post Count**: Number of published posts
- **View Count**: Total views across posts
- **Popularity**: Author popularity ranking
- **Performance**: Author performance metrics

## 🔄 Content Workflow

### Content Creation

1. **Draft Creation**
   - Author creates draft
   - Content is written
   - Images are added
   - Categories and tags are assigned

2. **Content Review**
   - Content is reviewed
   - Edits are made
   - Quality is ensured
   - Approval is given

3. **Content Publishing**
   - Content is published
   - SEO is optimized
   - Social sharing is enabled
   - Analytics are activated

### Content Management

1. **Content Organization**
   - Categories are assigned
   - Tags are added
   - Content is organized
   - Relationships are established

2. **Content Promotion**
   - Featured content is selected
   - Social sharing is enabled
   - SEO is optimized
   - Analytics are monitored

3. **Content Maintenance**
   - Content is updated
   - Links are checked
   - Performance is monitored
   - Content is archived

## 🧪 Testing

### Unit Tests

**Test Coverage**:
- Blog post model validation
- Category and tag management
- Content creation
- View tracking

**Running Tests**:
```bash
python manage.py test blog
```

### Integration Tests

**Test Coverage**:
- Complete content workflow
- Search functionality
- Content discovery
- API endpoints

### Performance Tests

**Scenarios**:
- Large content volumes
- Search performance
- View tracking
- Database performance

## 📈 Performance Optimization

### Database Optimization

- **Indexes**: Strategic indexing on content fields
- **Query Optimization**: select_related for content relationships
- **Caching**: Content and search caching
- **Connection Pooling**: Database connection optimization

### Search Optimization

- **Full-text Indexing**: Database full-text search
- **Search Caching**: Search result caching
- **Query Optimization**: Search query optimization
- **Performance Monitoring**: Search performance tracking

### API Optimization

- **Pagination**: Content list pagination
- **Filtering**: Efficient content filtering
- **Serialization**: Optimized content serialization
- **Response Caching**: Cached content data

## 🔧 Configuration

### Blog Settings

**Default Configuration**:
```python
BLOG_POSTS_PER_PAGE = 10
BLOG_SEARCH_RESULTS = 20
BLOG_FEATURED_LIMIT = 5
BLOG_VIEW_TRACKING = True
```

### Content Settings

**Content Configuration**:
```python
BLOG_RICH_TEXT_EDITOR = True
BLOG_IMAGE_UPLOAD = True
BLOG_CATEGORY_REQUIRED = True
BLOG_TAG_LIMIT = 10
```

### SEO Settings

**SEO Configuration**:
```python
BLOG_SEO_META_TAGS = True
BLOG_SITEMAP_GENERATION = True
BLOG_RSS_FEED = True
BLOG_SOCIAL_SHARING = True
```

## 🚀 Deployment Considerations

### Production Settings

- **Database**: PostgreSQL for production
- **Caching**: Redis for content caching
- **CDN**: Static content delivery
- **Monitoring**: Content performance monitoring

### Security Considerations

- **Content Security**: Content access restrictions
- **Author Permissions**: Author-based permissions
- **Data Protection**: Content data protection
- **Audit Logging**: Content activity logging

### SEO Considerations

- **SEO Optimization**: Search engine optimization
- **Sitemap Generation**: Automatic sitemap generation
- **Meta Tags**: SEO meta tag management
- **Social Sharing**: Social media integration

## 📚 Related Documentation

- [Contents App](contents/README.md) - File management
- [Backend Architecture](api/README.md)
- [API Documentation](docs/API.md)
- [Content Guide](docs/CONTENT.md)

---

**Blog & Content Management** - Comprehensive content management and publishing system
