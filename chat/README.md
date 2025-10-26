# Chat App

Real-time chat system for the Academia platform, providing live communication capabilities for courses, support, and general interaction.

## 🏗️ Architecture Overview

The chat app provides a comprehensive real-time communication system with:

- **Real-time Messaging**: WebSocket-based instant messaging
- **Chat Rooms**: Multiple chat room support
- **Message Types**: Text, image, and file messages
- **User Presence**: Online/offline status tracking
- **Message History**: Persistent message storage

## 📊 Models

### ChatRoom Model

**Location**: `chat/models.py`

```python
class ChatRoom(models.Model):
    CHAT_TYPE_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private'),
        ('course', 'Course'),
        ('support', 'Support'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    chat_type = models.CharField(max_length=20, choices=CHAT_TYPE_CHOICES)
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    max_participants = models.PositiveIntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Key Features**:
- Multiple chat room types
- Course integration
- Participant limits
- Active status management
- Creator attribution

### ChatMessage Model

**Location**: `chat/models.py`

```python
class ChatMessage(models.Model):
    MESSAGE_TYPE_CHOICES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('file', 'File'),
        ('system', 'System'),
    ]
    
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPE_CHOICES, default='text')
    content = models.TextField()
    file = models.FileField(upload_to='chat/files/', blank=True)
    is_edited = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Key Features**:
- Multiple message types
- File attachment support
- Edit and delete tracking
- Timestamp management
- Sender attribution

### ChatParticipant Model

**Location**: `chat/models.py`

```python
class ChatParticipant(models.Model):
    ROLE_CHOICES = [
        ('member', 'Member'),
        ('moderator', 'Moderator'),
        ('admin', 'Admin'),
    ]
    
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
```

**Key Features**:
- Role-based participation
- Join timestamp tracking
- Active status management
- Room-user relationship

### UserPresence Model

**Location**: `chat/models.py`

```python
class UserPresence(models.Model):
    STATUS_CHOICES = [
        ('online', 'Online'),
        ('away', 'Away'),
        ('busy', 'Busy'),
        ('offline', 'Offline'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='offline')
    last_seen = models.DateTimeField(auto_now=True)
    is_typing = models.BooleanField(default=False)
    current_room = models.ForeignKey(ChatRoom, on_delete=models.SET_NULL, null=True, blank=True)
```

**Key Features**:
- Online status tracking
- Last seen timestamp
- Typing indicator
- Current room tracking

## 🔌 WebSocket Integration

### Django Channels Configuration

**Channels Setup**:
```python
# settings.py
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
        },
    },
}
```

**WebSocket Features**:
- **Real-time Communication**: Instant message delivery
- **Room Management**: Multiple chat room support
- **User Presence**: Online/offline status
- **Typing Indicators**: Real-time typing status
- **Message Broadcasting**: Room-based message distribution

### WebSocket Consumers

**Chat Consumer**:
```python
class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Handle WebSocket connection"""
        # Join room group
        # Set user presence
        # Send connection confirmation
        
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave room group
        # Update user presence
        # Clean up connection
        
    async def receive(self, text_data):
        """Handle incoming messages"""
        # Parse message data
        # Validate message
        # Save to database
        # Broadcast to room
```

**Presence Consumer**:
```python
class PresenceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Handle presence connection"""
        # Set user online
        # Update presence status
        # Notify room members
        
    async def disconnect(self, close_code):
        """Handle presence disconnection"""
        # Set user offline
        # Update presence status
        # Notify room members
```

## 📡 API Endpoints

### Chat Room Management

**Base URL**: `/chat/rooms/`

#### Room Operations
- **GET** `/rooms/` - List chat rooms
- **POST** `/rooms/` - Create chat room
- **GET** `/rooms/{id}/` - Get room details
- **PUT** `/rooms/{id}/` - Update room
- **DELETE** `/rooms/{id}/` - Delete room

#### Room Actions
- **POST** `/rooms/{id}/join/` - Join room
- **POST** `/rooms/{id}/leave/` - Leave room
- **GET** `/rooms/{id}/participants/` - Get room participants
- **GET** `/rooms/{id}/messages/` - Get room messages

### Message Management

**Base URL**: `/chat/messages/`

#### Message Operations
- **GET** `/messages/` - List messages
- **POST** `/messages/` - Send message
- **GET** `/messages/{id}/` - Get message details
- **PUT** `/messages/{id}/` - Edit message
- **DELETE** `/messages/{id}/` - Delete message

#### Message Actions
- **POST** `/messages/{id}/react/` - React to message
- **GET** `/messages/{id}/reactions/` - Get message reactions
- **POST** `/messages/{id}/reply/` - Reply to message

### Presence Management

**Base URL**: `/chat/presence/`

#### Presence Operations
- **GET** `/presence/` - Get user presence
- **PUT** `/presence/` - Update presence status
- **GET** `/presence/online/` - Get online users
- **GET** `/presence/typing/` - Get typing users

## 💬 Message Types

### Text Messages

**Text Message Features**:
- **Rich Text**: Formatting support
- **Emojis**: Emoji support
- **Mentions**: User mentions
- **Links**: Automatic link detection
- **Code**: Code block support

### Image Messages

**Image Message Features**:
- **Image Upload**: Image file upload
- **Image Preview**: Thumbnail generation
- **Image Optimization**: Automatic optimization
- **Image Sharing**: Image sharing capabilities

### File Messages

**File Message Features**:
- **File Upload**: File attachment support
- **File Preview**: File preview generation
- **File Download**: File download capabilities
- **File Security**: File security scanning

### System Messages

**System Message Features**:
- **User Joins**: Join notifications
- **User Leaves**: Leave notifications
- **Room Updates**: Room change notifications
- **System Alerts**: System-wide alerts

## 🔄 Chat Workflow

### Room Creation

1. **Room Setup**
   - User creates room
   - Room settings are configured
   - Participants are invited
   - Room is activated

2. **Room Management**
   - Room settings are updated
   - Participants are managed
   - Room permissions are set
   - Room is monitored

### Message Flow

1. **Message Creation**
   - User types message
   - Message is validated
   - Message is saved
   - Message is broadcast

2. **Message Processing**
   - Message is received
   - Message is processed
   - Message is displayed
   - Message is stored

### Presence Management

1. **User Connection**
   - User connects to chat
   - Presence is updated
   - Room members are notified
   - Status is broadcast

2. **User Disconnection**
   - User disconnects from chat
   - Presence is updated
   - Room members are notified
   - Status is broadcast

## 🧪 Testing

### Unit Tests

**Test Coverage**:
- Chat room model validation
- Message model validation
- Presence tracking
- WebSocket functionality

**Running Tests**:
```bash
python manage.py test chat
```

### Integration Tests

**Test Coverage**:
- Complete chat workflow
- WebSocket communication
- Message broadcasting
- Presence management

### WebSocket Tests

**Test Scenarios**:
- Connection handling
- Message broadcasting
- Presence updates
- Room management

## 📈 Performance Optimization

### Database Optimization

- **Indexes**: Strategic indexing on chat fields
- **Query Optimization**: select_related for chat relationships
- **Caching**: Message and room caching
- **Connection Pooling**: Database connection optimization

### WebSocket Optimization

- **Connection Pooling**: WebSocket connection management
- **Message Queuing**: Message queue management
- **Broadcasting**: Efficient message broadcasting
- **Presence Updates**: Optimized presence updates

### API Optimization

- **Pagination**: Message list pagination
- **Filtering**: Efficient message filtering
- **Serialization**: Optimized message serialization
- **Response Caching**: Cached chat data

## 🔧 Configuration

### Chat Settings

**Default Configuration**:
```python
CHAT_MAX_MESSAGE_LENGTH = 1000
CHAT_MESSAGE_HISTORY_LIMIT = 1000
CHAT_ROOM_MAX_PARTICIPANTS = 100
CHAT_TYPING_TIMEOUT = 3000  # milliseconds
```

### WebSocket Settings

**WebSocket Configuration**:
```python
CHAT_WEBSOCKET_URL = 'ws://localhost:8000/ws/chat/'
CHAT_PRESENCE_WEBSOCKET_URL = 'ws://localhost:8000/ws/presence/'
CHAT_HEARTBEAT_INTERVAL = 30  # seconds
CHAT_CONNECTION_TIMEOUT = 60  # seconds
```

### Message Settings

**Message Configuration**:
```python
CHAT_MESSAGE_EDIT_TIMEOUT = 300  # 5 minutes
CHAT_MESSAGE_DELETE_TIMEOUT = 300  # 5 minutes
CHAT_FILE_UPLOAD_LIMIT = 10 * 1024 * 1024  # 10MB
CHAT_IMAGE_OPTIMIZATION = True
```

## 🚀 Deployment Considerations

### Production Settings

- **Redis**: Redis for WebSocket channels
- **Database**: PostgreSQL for production
- **WebSocket**: Daphne for WebSocket handling
- **Monitoring**: Chat performance monitoring

### Security Considerations

- **WebSocket Security**: Secure WebSocket connections
- **Message Security**: Message content security
- **User Privacy**: User privacy protection
- **Audit Logging**: Chat activity logging

### Scaling Considerations

- **Horizontal Scaling**: Multiple server instances
- **Load Balancing**: WebSocket load balancing
- **Redis Clustering**: Redis cluster setup
- **Message Queuing**: Message queue management

## 📚 Related Documentation

- [Courses App](courses/README.md) - Course chat integration
- [Accounts App](accounts/README.md) - User management
- [Backend Architecture](api/README.md)
- [API Documentation](docs/API.md)
- [WebSocket Guide](docs/WEBSOCKET.md)

---

**Real-time Chat System** - WebSocket-based communication and messaging system
