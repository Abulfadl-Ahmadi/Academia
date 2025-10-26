# Knowledge App

Hierarchical knowledge management system for the Academia platform, providing dual knowledge organization structures and comprehensive progress tracking.

## 🏗️ Architecture Overview

The knowledge app provides a sophisticated knowledge management system with:

- **Dual Hierarchy**: Legacy Subject→Topic and new Folder system
- **Progress Tracking**: Student progress through knowledge tree
- **Mastery Detection**: Automatic mastery level calculation
- **Topic Management**: Hierarchical organization of educational content
- **Question Integration**: Knowledge-based question organization

## 📊 Models

### Legacy Knowledge Hierarchy

#### Subject Model

**Location**: `knowledge/models.py`

```python
class Subject(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

**Key Features**:
- Top-level knowledge organization
- Active/inactive status
- Description and metadata
- Hierarchical foundation

#### Chapter Model

**Location**: `knowledge/models.py`

```python
class Chapter(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
```

**Key Features**:
- Subject-based organization
- Ordering and sequencing
- Hierarchical structure
- Content organization

#### Section Model

**Location**: `knowledge/models.py`

```python
class Section(models.Model):
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
```

**Key Features**:
- Chapter subdivision
- Content organization
- Sequential ordering
- Active status management

#### Lesson Model

**Location**: `knowledge/models.py`

```python
class Lesson(models.Model):
    section = models.ForeignKey(Section, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
```

**Key Features**:
- Section-based lessons
- Content management
- Sequential ordering
- Active status tracking

#### TopicCategory Model

**Location**: `knowledge/models.py`

```python
class TopicCategory(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
```

**Key Features**:
- Lesson categorization
- Topic organization
- Hierarchical structure
- Content classification

#### Topic Model

**Location**: `knowledge/models.py`

```python
class Topic(models.Model):
    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('expert', 'Expert'),
    ]
    
    category = models.ForeignKey(TopicCategory, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='beginner')
    prerequisites = models.ManyToManyField('self', blank=True, symmetrical=False)
    tags = models.CharField(max_length=500, blank=True)
    estimated_study_time = models.PositiveIntegerField(default=0)  # in minutes
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

**Key Features**:
- Detailed topic information
- Difficulty classification
- Prerequisite relationships
- Tag-based organization
- Study time estimation
- Prerequisite management

### New Folder System

#### Folder Model

**Location**: `knowledge/models.py`

```python
class Folder(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Key Features**:
- Flexible hierarchical structure
- Parent-child relationships
- Unlimited depth
- Active status management
- Timestamp tracking

### Progress Tracking

#### StudentTopicProgress Model

**Location**: `knowledge/models.py`

```python
class StudentTopicProgress(models.Model):
    MASTERY_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('mastered', 'Mastered'),
    ]
    
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)
    mastery_level = models.CharField(max_length=20, choices=MASTERY_CHOICES, default='not_started')
    progress_percentage = models.FloatField(default=0.0)
    time_spent_minutes = models.PositiveIntegerField(default=0)
    last_accessed = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
```

**Key Features**:
- Individual student progress
- Mastery level tracking
- Progress percentage calculation
- Time tracking
- Completion status

## 🌳 Knowledge Tree Structure

### Legacy Hierarchy

```
Subject
├── Chapter
│   ├── Section
│   │   ├── Lesson
│   │   │   ├── TopicCategory
│   │   │   │   └── Topic
```

**Characteristics**:
- Fixed 5-level hierarchy
- Rigid structure
- Subject-based organization
- Legacy system compatibility

### New Folder System

```
Folder
├── Folder (Child)
│   ├── Folder (Grandchild)
│   │   └── ...
```

**Characteristics**:
- Flexible hierarchy
- Unlimited depth
- Dynamic organization
- Modern approach

## 📡 API Endpoints

### Legacy Knowledge Tree

**Base URL**: `/knowledge/`

#### Subject Management
- **GET** `/subjects/` - List subjects
- **POST** `/subjects/` - Create subject
- **GET** `/subjects/{id}/` - Get subject details
- **PUT** `/subjects/{id}/` - Update subject
- **DELETE** `/subjects/{id}/` - Delete subject

#### Chapter Management
- **GET** `/chapters/` - List chapters
- **POST** `/chapters/` - Create chapter
- **GET** `/chapters/{id}/` - Get chapter details
- **PUT** `/chapters/{id}/` - Update chapter
- **DELETE** `/chapters/{id}/` - Delete chapter

#### Section Management
- **GET** `/sections/` - List sections
- **POST** `/sections/` - Create section
- **GET** `/sections/{id}/` - Get section details
- **PUT** `/sections/{id}/` - Update section
- **DELETE** `/sections/{id}/` - Delete section

#### Lesson Management
- **GET** `/lessons/` - List lessons
- **POST** `/lessons/` - Create lesson
- **GET** `/lessons/{id}/` - Get lesson details
- **PUT** `/lessons/{id}/` - Update lesson
- **DELETE** `/lessons/{id}/` - Delete lesson

#### TopicCategory Management
- **GET** `/topic-categories/` - List topic categories
- **POST** `/topic-categories/` - Create topic category
- **GET** `/topic-categories/{id}/` - Get topic category details
- **PUT** `/topic-categories/{id}/` - Update topic category
- **DELETE** `/topic-categories/{id}/` - Delete topic category

#### Topic Management
- **GET** `/topics/` - List topics
- **POST** `/topics/` - Create topic
- **GET** `/topics/{id}/` - Get topic details
- **PUT** `/topics/{id}/` - Update topic
- **DELETE** `/topics/{id}/` - Delete topic

### New Folder System

**Base URL**: `/folders/`

#### Folder Management
- **GET** `/folders/` - List folders
- **POST** `/folders/` - Create folder
- **GET** `/folders/{id}/` - Get folder details
- **PUT** `/folders/{id}/` - Update folder
- **DELETE** `/folders/{id}/` - Delete folder

#### Folder Tree
- **GET** `/folders/tree/` - Get complete folder tree
- **GET** `/folders/{id}/tree/` - Get folder subtree

### Progress Tracking

**Base URL**: `/student-progress/`

#### Progress Management
- **GET** `/student-progress/` - Get student progress
- **GET** `/student-progress/{subject_id}/` - Get subject progress
- **PUT** `/student-progress/{id}/` - Update progress
- **POST** `/student-progress/` - Create progress record

## 🎯 Special Actions

### Knowledge Tree Actions

#### Book Files
- **GET** `/subjects/{id}/book_files/` - Get subject book files
- **POST** `/subjects/{id}/book_files/` - Upload book files

#### Knowledge Tree
- **GET** `/subjects/{id}/knowledge_tree/` - Get complete subject tree
- **GET** `/subjects/{id}/student_progress/` - Get student progress for subject

#### Question Statistics
- **GET** `/topics/{id}/question_statistics/` - Get topic question statistics

### Folder Actions

#### Folder Tree
- **GET** `/folders/tree/` - Get complete folder tree
- **GET** `/folders/{id}/tree/` - Get folder subtree

#### Merge Folders
- **POST** `/folders/merge/` - Merge duplicate folders

## 📊 Progress Tracking

### Mastery Level Calculation

**Algorithm**:
```python
def calculate_mastery_level(student, topic):
    """Calculate student mastery level for a topic"""
    # Analyze test scores
    # Consider time spent
    # Evaluate completion rate
    # Determine mastery level
```

**Mastery Levels**:
- **Not Started**: 0% progress
- **In Progress**: 1-99% progress
- **Completed**: 100% progress
- **Mastered**: 100% + high scores

### Progress Analytics

**Metrics Tracked**:
- Progress percentage per topic
- Time spent on each topic
- Completion rates
- Mastery levels
- Prerequisite fulfillment

### Prerequisite Management

**Features**:
- Automatic prerequisite checking
- Progress blocking for unmet prerequisites
- Prerequisite completion tracking
- Learning path optimization

## 🔄 Data Migration

### Legacy to New System

**Migration Scripts**:
- `assign_parent_folders_to_questions.py` - Assign folders to questions
- `merge_duplicate_folders.py` - Merge duplicate folders
- `update_question_folders.py` - Update question folder assignments

**Migration Process**:
1. **Analysis**: Identify existing knowledge structure
2. **Mapping**: Map legacy hierarchy to new folders
3. **Migration**: Transfer data to new system
4. **Validation**: Verify data integrity
5. **Cleanup**: Remove obsolete data

### Dual System Support

**Features**:
- Both systems can coexist
- Gradual migration support
- Data synchronization
- Backward compatibility

## 🧪 Testing

### Unit Tests

**Test Coverage**:
- Model validation
- Hierarchy relationships
- Progress calculation
- Prerequisite logic

**Running Tests**:
```bash
python manage.py test knowledge
```

### Integration Tests

**Test Coverage**:
- Complete knowledge tree
- Progress tracking
- API endpoints
- Data migration

### Performance Tests

**Scenarios**:
- Large knowledge trees
- Deep folder hierarchies
- Progress calculation
- Tree traversal

## 📈 Performance Optimization

### Database Optimization

- **Indexes**: Strategic indexing on hierarchy fields
- **Query Optimization**: select_related for hierarchy traversal
- **Caching**: Tree structure caching
- **Connection Pooling**: Database connection optimization

### API Optimization

- **Pagination**: Tree node pagination
- **Filtering**: Efficient tree filtering
- **Serialization**: Optimized tree serialization
- **Response Caching**: Cached tree data

### Tree Optimization

- **Lazy Loading**: On-demand tree loading
- **Caching**: Tree structure caching
- **Compression**: Tree data compression
- **CDN**: Static tree data delivery

## 🔧 Configuration

### Knowledge Settings

**Default Configuration**:
```python
KNOWLEDGE_TREE_CACHE_TTL = 3600  # 1 hour
MAX_FOLDER_DEPTH = 10
PROGRESS_CALCULATION_INTERVAL = 300  # 5 minutes
```

### Progress Settings

**Progress Configuration**:
```python
MASTERY_THRESHOLD = 80.0  # percentage
PROGRESS_UPDATE_FREQUENCY = 60  # seconds
PREREQUISITE_ENFORCEMENT = True
```

### Migration Settings

**Migration Configuration**:
```python
MIGRATION_BATCH_SIZE = 1000
MIGRATION_TIMEOUT = 3600  # 1 hour
VALIDATION_ENABLED = True
```

## 🚀 Deployment Considerations

### Production Settings

- **Database**: PostgreSQL for production
- **Caching**: Redis for tree caching
- **CDN**: Static tree data delivery
- **Monitoring**: Tree performance monitoring

### Security Considerations

- **Access Control**: Role-based tree access
- **Data Validation**: Input sanitization
- **Audit Logging**: Tree modification logging
- **Backup**: Regular tree data backups

## 📚 Related Documentation

- [Tests App](tests/README.md) - Question integration
- [Courses App](courses/README.md) - Course integration
- [Backend Architecture](api/README.md)
- [API Documentation](docs/API.md)
- [Data Migration Guide](scripts/README.md)

## 🔄 Migration Guide

### From Legacy to New System

1. **Preparation**
   - Backup existing data
   - Analyze current structure
   - Plan migration strategy

2. **Migration**
   - Run migration scripts
   - Validate data integrity
   - Test new system

3. **Validation**
   - Verify data accuracy
   - Test functionality
   - Performance validation

4. **Cleanup**
   - Remove obsolete data
   - Update references
   - Archive legacy data

---

**Knowledge Management System** - Hierarchical knowledge organization and progress tracking
