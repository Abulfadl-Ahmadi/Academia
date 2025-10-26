# Courses App

Course management and live streaming system for the Academia platform, handling course creation, student enrollment, session management, and live streaming capabilities.

## 🏗️ Architecture Overview

The courses app provides a comprehensive course management system with:

- **Course Management**: Course creation, organization, and administration
- **Live Streaming**: Real-time video streaming with chat integration
- **Session Management**: Scheduled classes and session recordings
- **Enrollment System**: Student enrollment and access control
- **VOD Integration**: Video-on-demand content delivery

## 📊 Models

### ClassCategory Model

**Location**: `courses/models.py`

```python
class ClassCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

**Key Features**:
- Course categorization
- Active/inactive status
- Description and metadata
- Hierarchical organization

### Course Model

**Location**: `courses/models.py`

```python
class Course(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='taught_courses')
    students = models.ManyToManyField(User, related_name='enrolled_courses', blank=True)
    category = models.ForeignKey(ClassCategory, on_delete=models.CASCADE)
    vod_channel_id = models.CharField(max_length=100, blank=True)
    rtmp_url = models.URLField(blank=True)
    rtmp_key = models.CharField(max_length=200, blank=True)
    live_iframe = models.TextField(blank=True)
    is_live = models.BooleanField(default=False)
    chat_mode = models.CharField(max_length=20, choices=CHAT_MODE_CHOICES, default='public')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

**Key Features**:
- Teacher-student relationship
- Live streaming configuration
- VOD channel integration
- Chat mode settings
- Active status management

### CourseSchedule Model

**Location**: `courses/models.py`

```python
class CourseSchedule(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='schedules')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_recurring = models.BooleanField(default=False)
    recurrence_pattern = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
```

**Key Features**:
- Scheduled class sessions
- Recurring schedule support
- Time-based organization
- Active status tracking

### CourseSession Model

**Location**: `courses/models.py`

```python
class CourseSession(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('live', 'Live'),
        ('ended', 'Ended'),
        ('cancelled', 'Cancelled'),
    ]
    
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sessions')
    schedule = models.ForeignKey(CourseSchedule, on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    recording_url = models.URLField(blank=True)
    attendance_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
```

**Key Features**:
- Session status tracking
- Recording management
- Attendance tracking
- Time-based sessions

## 🎥 Live Streaming System

### Streaming Configuration

**VOD Integration**:
```python
def setup_vod_channel(course):
    """Setup VOD channel for course"""
    # Create VOD channel
    # Configure streaming settings
    # Return channel configuration
```

**RTMP Configuration**:
```python
def setup_rtmp_stream(course):
    """Setup RTMP stream for live streaming"""
    # Configure RTMP URL and key
    # Setup streaming parameters
    # Return stream configuration
```

### Streaming Features

**Live Streaming**:
- Real-time video streaming
- RTMP protocol support
- VOD channel integration
- Stream quality management

**Chat Integration**:
- Real-time chat during streams
- Public/private chat modes
- Message moderation
- User interaction tracking

**Recording**:
- Automatic session recording
- VOD content generation
- Recording quality settings
- Storage management

## 📡 API Endpoints

### Course Management

**Base URL**: `/courses/`

#### Course CRUD Operations
- **GET** `/courses/` - List courses (filtered by user role)
- **POST** `/courses/` - Create course (teachers only)
- **GET** `/courses/{id}/` - Get course details
- **PUT** `/courses/{id}/` - Update course (teachers only)
- **DELETE** `/courses/{id}/` - Delete course (teachers only)

#### Course Actions
- **POST** `/courses/{id}/enroll-student/` - Enroll student
- **POST** `/courses/{id}/remove-student/` - Remove student
- **GET** `/courses/{id}/sessions/` - Get course sessions
- **GET** `/courses/{id}/student-sessions/` - Get student sessions

### Session Management

**Base URL**: `/sessions/`

#### Session Operations
- **GET** `/sessions/` - List sessions
- **POST** `/sessions/` - Create session
- **GET** `/sessions/{id}/` - Get session details
- **PUT** `/sessions/{id}/` - Update session
- **DELETE** `/sessions/{id}/` - Delete session

#### Live Streaming
- **POST** `/courses/{id}/start-live/` - Start live session
- **POST** `/courses/{id}/end-live/` - End live session
- **GET** `/courses/{id}/live-status/` - Get live status

### Schedule Management

**Base URL**: `/schedules/`

#### Schedule Operations
- **GET** `/schedules/` - List schedules
- **POST** `/schedules/` - Create schedule
- **GET** `/schedules/{id}/` - Get schedule details
- **PUT** `/schedules/{id}/` - Update schedule
- **DELETE** `/schedules/{id}/` - Delete schedule

### Category Management

**Base URL**: `/categories/`

#### Category Operations
- **GET** `/categories/` - List categories
- **POST** `/categories/` - Create category
- **GET** `/categories/{id}/` - Get category details
- **PUT** `/categories/{id}/` - Update category
- **DELETE** `/categories/{id}/` - Delete category

## 🎓 Enrollment System

### Enrollment Process

**Student Enrollment**:
1. **Course Discovery**: Students browse available courses
2. **Enrollment Request**: Students request enrollment
3. **Teacher Approval**: Teachers approve/reject enrollment
4. **Access Grant**: Students gain course access
5. **Notification**: Enrollment confirmation sent

**Enrollment Features**:
- Automatic enrollment for public courses
- Teacher approval for private courses
- Enrollment capacity limits
- Prerequisite checking
- Payment integration

### Access Control

**Course Access Levels**:
- **Public**: Open enrollment
- **Private**: Teacher approval required
- **Paid**: Payment required
- **Restricted**: Specific criteria required

**Access Management**:
- Role-based access control
- Time-based access
- Prerequisite enforcement
- Progress-based access

## 📅 Session Management

### Session Lifecycle

**Session States**:
1. **Scheduled**: Session is planned
2. **Live**: Session is currently active
3. **Ended**: Session has concluded
4. **Cancelled**: Session was cancelled

**Session Features**:
- Automatic session creation from schedules
- Real-time status updates
- Attendance tracking
- Recording management

### Schedule Management

**Recurring Schedules**:
- Daily, weekly, monthly patterns
- Custom recurrence rules
- Exception handling
- Automatic session generation

**Schedule Features**:
- Time zone support
- Conflict detection
- Rescheduling capabilities
- Notification system

## 🎥 VOD Integration

### Video-on-Demand

**VOD Features**:
- Recorded session playback
- Quality selection
- Progress tracking
- Download capabilities

**VOD Management**:
- Automatic recording
- Storage optimization
- Content organization
- Access control

### Streaming Quality

**Quality Levels**:
- **HD**: High definition streaming
- **SD**: Standard definition streaming
- **Mobile**: Mobile-optimized streaming
- **Audio**: Audio-only streaming

**Quality Management**:
- Adaptive bitrate streaming
- Quality selection
- Bandwidth optimization
- Device-specific optimization

## 🔄 Course Workflow

### Course Creation

1. **Course Setup**
   - Basic course information
   - Category assignment
   - Teacher assignment
   - Access level configuration

2. **Content Organization**
   - Session planning
   - Schedule creation
   - Resource organization
   - Prerequisite setup

3. **Streaming Configuration**
   - VOD channel setup
   - RTMP configuration
   - Chat settings
   - Recording settings

### Student Enrollment

1. **Course Discovery**
   - Browse available courses
   - Filter by category
   - Search functionality
   - Course details

2. **Enrollment Process**
   - Enrollment request
   - Payment processing
   - Access verification
   - Confirmation notification

3. **Course Access**
   - Session access
   - Resource access
   - Progress tracking
   - Communication tools

### Live Session Management

1. **Session Preparation**
   - Teacher preparation
   - Technical setup
   - Student notification
   - Access verification

2. **Live Session**
   - Stream management
   - Chat moderation
   - Attendance tracking
   - Technical support

3. **Session Conclusion**
   - Recording finalization
   - Attendance summary
   - Student notification
   - Resource availability

## 🧪 Testing

### Unit Tests

**Test Coverage**:
- Model validation
- Enrollment logic
- Session management
- Streaming configuration

**Running Tests**:
```bash
python manage.py test courses
```

### Integration Tests

**Test Coverage**:
- Complete course workflow
- Live streaming functionality
- Enrollment process
- VOD integration

### Load Testing

**Scenarios**:
- Concurrent live sessions
- High enrollment volumes
- Streaming performance
- Database performance

## 📈 Performance Optimization

### Database Optimization

- **Indexes**: Strategic indexing on frequently queried fields
- **Query Optimization**: select_related for course relationships
- **Caching**: Course and session caching
- **Connection Pooling**: Database connection optimization

### Streaming Optimization

- **CDN**: Content delivery network
- **Caching**: Stream caching
- **Compression**: Video compression
- **Bandwidth**: Bandwidth optimization

### API Optimization

- **Pagination**: Course and session pagination
- **Filtering**: Efficient course filtering
- **Serialization**: Optimized course serialization
- **Response Caching**: Cached course data

## 🔧 Configuration

### Course Settings

**Default Configuration**:
```python
COURSE_ENROLLMENT_LIMIT = 100
SESSION_DURATION_LIMIT = 180  # minutes
VOD_STORAGE_LIMIT = 1000  # GB
CHAT_MESSAGE_LIMIT = 1000
```

### Streaming Settings

**Streaming Configuration**:
```python
RTMP_TIMEOUT = 30  # seconds
VOD_QUALITY_LEVELS = ['HD', 'SD', 'Mobile']
STREAMING_BITRATE = 2000  # kbps
RECORDING_QUALITY = 'HD'
```

### Enrollment Settings

**Enrollment Configuration**:
```python
AUTO_ENROLLMENT_ENABLED = True
ENROLLMENT_APPROVAL_REQUIRED = False
PAYMENT_REQUIRED = False
PREREQUISITE_ENFORCEMENT = True
```

## 🚀 Deployment Considerations

### Production Settings

- **Streaming**: Professional streaming infrastructure
- **Database**: PostgreSQL for production
- **Caching**: Redis for session caching
- **CDN**: Global content delivery

### Security Considerations

- **Access Control**: Role-based course access
- **Streaming Security**: Secure streaming protocols
- **Data Protection**: Student data protection
- **Audit Logging**: Course activity logging

### Scaling Considerations

- **Horizontal Scaling**: Multiple server instances
- **Load Balancing**: Session distribution
- **Database Scaling**: Read replicas
- **CDN Scaling**: Global content delivery

## 📚 Related Documentation

- [Tests App](tests/README.md) - Test integration
- [Knowledge App](knowledge/README.md) - Knowledge integration
- [Backend Architecture](api/README.md)
- [API Documentation](docs/API.md)
- [Streaming Guide](docs/STREAMING.md)

---

**Course Management & Live Streaming** - Comprehensive course delivery system
