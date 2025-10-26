# Tests App

Comprehensive test management system for the Academia platform, handling test creation, question management, student sessions, scoring, and progress tracking.

## 🏗️ Architecture Overview

The tests app provides a complete testing solution with:

- **Test Types**: Scheduled, topic-based, and practice tests
- **Question Management**: Multiple choice, true/false, and custom questions
- **Session Security**: Device fingerprinting, time limits, and anti-cheating measures
- **Scoring System**: Automatic scoring with detailed analytics
- **Progress Tracking**: Student performance monitoring and analytics

## 📊 Models

### TestCollection Model

**Location**: `tests/models.py`

```python
class TestCollection(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    teacher = models.ForeignKey(User, on_delete=models.CASCADE)
    students = models.ManyToManyField(User, related_name='test_collections')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

**Key Features**:
- Teacher-created test collections
- Student enrollment management
- Active/inactive status tracking
- Automatic student synchronization from courses

### Test Model

**Location**: `tests/models.py`

```python
class Test(models.Model):
    TEST_TYPE_CHOICES = [
        ('scheduled', 'Scheduled Test'),
        ('topic_based', 'Topic-based Test'),
        ('practice', 'Practice Test'),
    ]
    
    TEST_CONTENT_TYPE_CHOICES = [
        ('pdf', 'PDF Test'),
        ('typed', 'Typed Questions'),
    ]
    
    title = models.CharField(max_length=200)
    test_type = models.CharField(max_length=20, choices=TEST_TYPE_CHOICES)
    content_type = models.CharField(max_length=10, choices=TEST_CONTENT_TYPE_CHOICES)
    test_collection = models.ForeignKey(TestCollection, on_delete=models.CASCADE)
    topic = models.ForeignKey('knowledge.Topic', on_delete=models.CASCADE, null=True, blank=True)
    folder = models.ForeignKey('knowledge.Folder', on_delete=models.CASCADE, null=True, blank=True)
    file = models.ForeignKey('contents.File', on_delete=models.CASCADE, null=True, blank=True)
    questions = models.ManyToManyField('Question', blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField()
    max_attempts = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
```

**Key Features**:
- Multiple test types and content types
- Time-based scheduling
- Duration and attempt limits
- Integration with knowledge tree (topics/folders)
- PDF and typed question support

### Question Model

**Location**: `tests/models.py`

```python
class Question(models.Model):
    public_id = models.CharField(max_length=10, unique=True)
    text = models.TextField()
    difficulty_level = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    detailed_solution = models.TextField(blank=True)
    correct_option = models.ForeignKey('Option', on_delete=models.CASCADE, null=True, blank=True)
    folders = models.ManyToManyField('knowledge.Folder', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

**Key Features**:
- Unique public ID for questions
- Difficulty level classification
- Detailed solution support
- Folder-based organization
- Image support for questions and solutions

### StudentTestSession Model

**Location**: `tests/models.py`

```python
class StudentTestSession(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('expired', 'Expired'),
        ('abandoned', 'Abandoned'),
    ]
    
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    test = models.ForeignKey(Test, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    device_fingerprint = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    score = models.FloatField(null=True, blank=True)
    total_questions = models.PositiveIntegerField(default=0)
    answered_questions = models.PositiveIntegerField(default=0)
```

**Key Features**:
- Session tracking and security
- Device fingerprinting for anti-cheating
- IP address and user agent logging
- Score and progress tracking
- Session status management

### StudentAnswer Model

**Location**: `tests/models.py`

```python
class StudentAnswer(models.Model):
    session = models.ForeignKey(StudentTestSession, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option = models.ForeignKey(Option, on_delete=models.CASCADE, null=True, blank=True)
    is_correct = models.BooleanField(default=False)
    answered_at = models.DateTimeField(auto_now_add=True)
    time_spent_seconds = models.PositiveIntegerField(default=0)
```

**Key Features**:
- Individual answer tracking
- Correctness validation
- Time tracking per question
- Session-based organization

### StudentProgress Model

**Location**: `tests/models.py`

```python
class StudentProgress(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    test_collection = models.ForeignKey(TestCollection, on_delete=models.CASCADE)
    total_tests = models.PositiveIntegerField(default=0)
    completed_tests = models.PositiveIntegerField(default=0)
    average_score = models.FloatField(default=0.0)
    last_test_date = models.DateTimeField(null=True, blank=True)
    mastery_level = models.CharField(max_length=20, choices=MASTERY_CHOICES, default='beginner')
```

**Key Features**:
- Student performance tracking
- Test completion statistics
- Average score calculation
- Mastery level determination
- Progress analytics

## 🔐 Security Features

### Device Fingerprinting

**Implementation**:
```python
def generate_device_fingerprint(request):
    """Generate unique device fingerprint for session security"""
    # Combine IP, User-Agent, and other browser characteristics
    # Create hash for device identification
```

**Security Measures**:
- Unique device identification
- Session validation
- Anti-cheating detection
- Session hijacking prevention

### Session Security

**Features**:
- **Time Limits**: Enforced test duration
- **Attempt Limits**: Maximum attempts per test
- **Session Validation**: Active session verification
- **Device Tracking**: Device change detection
- **IP Validation**: IP address verification

### Anti-Cheating Measures

**Implementation**:
- Device fingerprinting
- Session monitoring
- Time-based validation
- Answer pattern analysis
- Suspicious activity detection

## 📡 API Endpoints

### Test Management

**Base URL**: `/tests/`

#### Test CRUD Operations
- **GET** `/tests/` - List tests (filtered by user role)
- **POST** `/tests/` - Create new test (teachers only)
- **GET** `/tests/{id}/` - Get test details
- **PUT** `/tests/{id}/` - Update test (teachers only)
- **DELETE** `/tests/{id}/` - Delete test (teachers only)

#### Test Taking Flow
- **POST** `/tests/{id}/enter/` - Enter test session
- **POST** `/tests/{id}/submit-answer/` - Submit answer
- **POST** `/tests/{id}/finish/` - Finish test
- **POST** `/tests/{id}/exit/` - Exit test session

### Question Management

**Base URL**: `/questions/`

#### Question Operations
- **GET** `/questions/` - List questions
- **POST** `/questions/` - Create question
- **GET** `/questions/{id}/` - Get question details
- **PUT** `/questions/{id}/` - Update question
- **DELETE** `/questions/{id}/` - Delete question

#### Question Images
- **POST** `/question-images/` - Upload question image
- **DELETE** `/question-images/{id}/` - Delete question image

### Test Collections

**Base URL**: `/test-collections/`

#### Collection Management
- **GET** `/test-collections/` - List collections
- **POST** `/test-collections/` - Create collection
- **GET** `/test-collections/{id}/` - Get collection details
- **PUT** `/test-collections/{id}/` - Update collection
- **DELETE** `/test-collections/{id}/` - Delete collection

### Student Progress

**Base URL**: `/student-progress/`

#### Progress Tracking
- **GET** `/student-progress/` - Get student progress
- **GET** `/student-progress/{collection_id}/` - Get collection progress

## 🧮 Scoring System

### Automatic Scoring

**Implementation**:
```python
def calculate_test_score(session):
    """Calculate test score based on correct answers"""
    correct_answers = session.answers.filter(is_correct=True).count()
    total_questions = session.total_questions
    score = (correct_answers / total_questions) * 100
    return score
```

**Features**:
- Automatic score calculation
- Percentage-based scoring
- Time-based scoring (optional)
- Difficulty-weighted scoring (optional)

### Progress Analytics

**Metrics Tracked**:
- Test completion rate
- Average scores
- Time spent per question
- Difficulty progression
- Mastery level assessment

### Mastery Detection

**Algorithm**:
```python
def calculate_mastery_level(student, test_collection):
    """Calculate student mastery level based on performance"""
    # Analyze recent test scores
    # Consider difficulty progression
    # Determine mastery level
```

**Mastery Levels**:
- **Beginner**: 0-40% average score
- **Intermediate**: 40-70% average score
- **Advanced**: 70-90% average score
- **Expert**: 90%+ average score

## 🎯 Test Types

### Scheduled Tests

**Features**:
- Fixed start and end times
- Time-limited access
- Automatic session management
- Scheduled availability

**Use Cases**:
- Formal examinations
- Timed assessments
- Class-wide testing

### Topic-based Tests

**Features**:
- Knowledge tree integration
- Topic-specific questions
- Difficulty progression
- Adaptive questioning

**Use Cases**:
- Subject-specific testing
- Curriculum-based assessment
- Knowledge validation

### Practice Tests

**Features**:
- Unlimited attempts
- Immediate feedback
- Self-paced learning
- Progress tracking

**Use Cases**:
- Self-assessment
- Exam preparation
- Skill practice

## 📊 Question Management

### Question Types

#### Multiple Choice
- **Structure**: Question text + multiple options
- **Scoring**: Single correct answer
- **Validation**: Option selection validation

#### True/False
- **Structure**: Statement + true/false options
- **Scoring**: Binary scoring
- **Validation**: Boolean validation

#### Custom Questions
- **Structure**: Flexible question format
- **Scoring**: Custom scoring logic
- **Validation**: Custom validation rules

### Question Images

**Support**:
- **Upload**: Base64 image upload
- **Formats**: PNG, JPG, SVG support
- **Storage**: S3-compatible storage
- **Display**: CDN delivery

### Question Organization

**Folder System**:
- Hierarchical organization
- Tag-based categorization
- Search and filtering
- Bulk operations

## 🔄 Test Session Flow

### Session Creation

1. **Validation**
   - Test availability check
   - Time window validation
   - Attempt limit verification
   - Device fingerprinting

2. **Session Initialization**
   - Create session record
   - Generate device fingerprint
   - Log IP and user agent
   - Set session status

### Answer Submission

1. **Validation**
   - Session validity check
   - Question availability
   - Time limit verification
   - Answer format validation

2. **Processing**
   - Save answer record
   - Update session progress
   - Calculate correctness
   - Log timing information

### Session Completion

1. **Finalization**
   - Calculate final score
   - Update progress records
   - Generate analytics
   - Send notifications

2. **Cleanup**
   - Mark session as completed
   - Archive session data
   - Update student progress
   - Trigger notifications

## 🧪 Testing

### Unit Tests

**Test Coverage**:
- Model validation
- Scoring algorithms
- Session management
- Security features

**Running Tests**:
```bash
python manage.py test tests
```

### Integration Tests

**Test Coverage**:
- Complete test flow
- API endpoint functionality
- Security validation
- Performance testing

### Load Testing

**Scenarios**:
- Concurrent test sessions
- High-volume question loading
- Session management under load
- Database performance

## 📈 Performance Optimization

### Database Optimization

- **Indexes**: Strategic indexing on frequently queried fields
- **Query Optimization**: select_related and prefetch_related
- **Caching**: Session and question caching
- **Connection Pooling**: Database connection optimization

### API Optimization

- **Pagination**: Test and question pagination
- **Filtering**: Efficient query filtering
- **Serialization**: Optimized serializer fields
- **Response Caching**: Cached test data

### Session Optimization

- **Memory Management**: Efficient session storage
- **Cleanup**: Automatic session cleanup
- **Monitoring**: Session performance tracking
- **Scaling**: Horizontal session scaling

## 🔧 Configuration

### Test Settings

**Default Configuration**:
```python
TEST_SESSION_TIMEOUT = 3600  # 1 hour
MAX_TEST_ATTEMPTS = 3
DEFAULT_TEST_DURATION = 60  # minutes
```

### Security Settings

**Session Security**:
```python
SESSION_SECURITY_ENABLED = True
DEVICE_FINGERPRINT_REQUIRED = True
IP_VALIDATION_ENABLED = True
```

### Scoring Settings

**Scoring Configuration**:
```python
DEFAULT_SCORING_METHOD = 'percentage'
DIFFICULTY_WEIGHTING = True
TIME_BONUS_ENABLED = False
```

## 🚀 Deployment Considerations

### Production Settings

- **Session Storage**: Redis for session management
- **Database**: PostgreSQL for production
- **Caching**: Redis caching layer
- **Monitoring**: Session and performance monitoring

### Security Hardening

- **HTTPS**: SSL/TLS encryption
- **Session Security**: Secure session management
- **Anti-cheating**: Enhanced security measures
- **Audit Logging**: Comprehensive activity logging

## 📚 Related Documentation

- [Knowledge App](knowledge/README.md) - Knowledge tree integration
- [Courses App](courses/README.md) - Course integration
- [Backend Architecture](api/README.md)
- [API Documentation](docs/API.md)
- [Security Guide](docs/SECURITY.md)

---

**Test Management System** - Comprehensive testing solution for educational platform
