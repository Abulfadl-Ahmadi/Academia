# Tickets App

Support ticket system with AI integration for the Academia platform, handling user support requests, AI-powered responses, and ticket management.

## 🏗️ Architecture Overview

The tickets app provides a comprehensive support system with:

- **Ticket Management**: Support ticket creation, tracking, and resolution
- **AI Integration**: Google Gemini AI for automated responses
- **User Support**: Multi-channel support system
- **Ticket Categorization**: Automatic ticket categorization and routing
- **Response Management**: AI and human response handling

## 📊 Models

### Ticket Model

**Location**: `tickets/models.py`

```python
class Ticket(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    CATEGORY_CHOICES = [
        ('technical', 'Technical'),
        ('billing', 'Billing'),
        ('general', 'General'),
        ('bug_report', 'Bug Report'),
        ('feature_request', 'Feature Request'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
```

**Key Features**:
- User-based ticket creation
- Priority and status tracking
- Category classification
- Assignment management
- Resolution tracking

### TicketResponse Model

**Location**: `tickets/models.py`

```python
class TicketResponse(models.Model):
    RESPONSE_TYPE_CHOICES = [
        ('user', 'User'),
        ('staff', 'Staff'),
        ('ai', 'AI'),
        ('system', 'System'),
    ]
    
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='responses')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    response_type = models.CharField(max_length=20, choices=RESPONSE_TYPE_CHOICES)
    content = models.TextField()
    is_ai_generated = models.BooleanField(default=False)
    ai_confidence = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

**Key Features**:
- Ticket-response relationship
- Response type classification
- AI response tracking
- Confidence scoring
- Timestamp management

### AIConversation Model

**Location**: `tickets/models.py`

```python
class AIConversation(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='ai_conversations')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    conversation_id = models.CharField(max_length=100, unique=True)
    context = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Key Features**:
- AI conversation tracking
- Context management
- Conversation persistence
- Active status tracking

## 🤖 AI Integration

### Google Gemini Integration

**AI Configuration**:
```python
# AI settings
GOOGLE_AI_API_KEY = 'your-google-ai-key'
AI_MODEL = 'gemini-pro'
AI_TEMPERATURE = 0.7
AI_MAX_TOKENS = 1000
```

**AI Features**:
- **Automatic Responses**: AI-generated ticket responses
- **Categorization**: Automatic ticket categorization
- **Priority Detection**: AI-based priority assessment
- **Context Understanding**: Conversation context management

### AI Response Generation

**Response Process**:
```python
def generate_ai_response(ticket, context=None):
    """Generate AI response for ticket"""
    # Analyze ticket content
    # Generate response using Gemini
    # Calculate confidence score
    # Return AI response
```

**AI Response Features**:
- **Context Awareness**: Understanding conversation context
- **Personalization**: User-specific responses
- **Accuracy Scoring**: Confidence level calculation
- **Learning**: Response improvement over time

### AI Categorization

**Categorization Process**:
```python
def categorize_ticket(ticket):
    """Categorize ticket using AI"""
    # Analyze ticket content
    # Determine category
    # Set priority level
    # Return categorization
```

**Categorization Features**:
- **Automatic Classification**: AI-based ticket categorization
- **Priority Detection**: Automatic priority assignment
- **Routing**: Intelligent ticket routing
- **Learning**: Category improvement over time

## 📡 API Endpoints

### Ticket Management

**Base URL**: `/tickets/`

#### Ticket Operations
- **GET** `/tickets/` - List user tickets
- **POST** `/tickets/` - Create new ticket
- **GET** `/tickets/{id}/` - Get ticket details
- **PUT** `/tickets/{id}/` - Update ticket
- **DELETE** `/tickets/{id}/` - Delete ticket

#### Ticket Actions
- **POST** `/tickets/{id}/assign/` - Assign ticket to staff
- **POST** `/tickets/{id}/close/` - Close ticket
- **POST** `/tickets/{id}/reopen/` - Reopen ticket
- **GET** `/tickets/{id}/responses/` - Get ticket responses

### Response Management

**Base URL**: `/tickets/responses/`

#### Response Operations
- **GET** `/responses/` - List responses
- **POST** `/responses/` - Create response
- **GET** `/responses/{id}/` - Get response details
- **PUT** `/responses/{id}/` - Update response
- **DELETE** `/responses/{id}/` - Delete response

### AI Integration

**Base URL**: `/tickets/ai/`

#### AI Operations
- **POST** `/ai/generate-response/` - Generate AI response
- **POST** `/ai/categorize/` - Categorize ticket
- **GET** `/ai/conversations/` - List AI conversations
- **POST** `/ai/conversations/` - Create AI conversation

#### AI Actions
- **POST** `/ai/chat/` - AI chat interface
- **GET** `/ai/suggestions/` - Get AI suggestions
- **POST** `/ai/feedback/` - Submit AI feedback

## 🔄 Ticket Workflow

### Ticket Creation

1. **User Submission**
   - User creates ticket
   - Ticket details are captured
   - Initial categorization
   - Priority assignment

2. **AI Processing**
   - AI analyzes ticket content
   - Automatic categorization
   - Priority assessment
   - Initial response generation

3. **Ticket Assignment**
   - Ticket is assigned to staff
   - Notification is sent
   - Status is updated
   - Workflow begins

### Ticket Resolution

1. **Staff Response**
   - Staff reviews ticket
   - Provides response
   - Updates status
   - Monitors progress

2. **AI Assistance**
   - AI suggests responses
   - Provides context
   - Assists with resolution
   - Learns from interactions

3. **Resolution**
   - Ticket is resolved
   - User is notified
   - Feedback is collected
   - Ticket is closed

### AI Conversation

1. **Conversation Initiation**
   - AI conversation starts
   - Context is established
   - User interacts with AI
   - Responses are generated

2. **Context Management**
   - Conversation context is maintained
   - User history is considered
   - Responses are personalized
   - Learning occurs

3. **Conversation Completion**
   - Conversation ends
   - Context is saved
   - Feedback is collected
   - Learning is updated

## 🧪 Testing

### Unit Tests

**Test Coverage**:
- Ticket model validation
- AI response generation
- Categorization logic
- Response management

**Running Tests**:
```bash
python manage.py test tickets
```

### Integration Tests

**Test Coverage**:
- Complete ticket workflow
- AI integration
- Response handling
- API endpoints

### AI Testing

**Test Scenarios**:
- AI response accuracy
- Categorization performance
- Context understanding
- Learning effectiveness

## 📈 Performance Optimization

### Database Optimization

- **Indexes**: Strategic indexing on ticket fields
- **Query Optimization**: select_related for ticket relationships
- **Caching**: Ticket and response caching
- **Connection Pooling**: Database connection optimization

### AI Optimization

- **Response Caching**: AI response caching
- **Context Management**: Efficient context handling
- **Model Optimization**: AI model optimization
- **Performance Monitoring**: AI performance tracking

### API Optimization

- **Pagination**: Ticket list pagination
- **Filtering**: Efficient ticket filtering
- **Serialization**: Optimized ticket serialization
- **Response Caching**: Cached ticket data

## 🔧 Configuration

### Ticket Settings

**Default Configuration**:
```python
TICKET_AUTO_ASSIGN = True
TICKET_AI_RESPONSE = True
TICKET_CATEGORIZATION = True
TICKET_PRIORITY_DETECTION = True
```

### AI Settings

**AI Configuration**:
```python
AI_RESPONSE_ENABLED = True
AI_CATEGORIZATION_ENABLED = True
AI_CONFIDENCE_THRESHOLD = 0.7
AI_LEARNING_ENABLED = True
```

### Response Settings

**Response Configuration**:
```python
RESPONSE_AUTO_GENERATE = True
RESPONSE_AI_ASSISTANCE = True
RESPONSE_LEARNING = True
RESPONSE_FEEDBACK = True
```

## 🚀 Deployment Considerations

### Production Settings

- **Database**: PostgreSQL for production
- **Caching**: Redis for AI caching
- **AI Service**: Google Gemini API
- **Monitoring**: Ticket and AI performance monitoring

### Security Considerations

- **Data Protection**: Ticket data protection
- **AI Security**: AI response security
- **Access Control**: Ticket access restrictions
- **Audit Logging**: Ticket activity logging

### AI Considerations

- **Model Management**: AI model versioning
- **Response Quality**: AI response monitoring
- **Learning**: Continuous learning implementation
- **Feedback**: User feedback collection

## 📚 Related Documentation

- [Accounts App](accounts/README.md) - User management
- [Backend Architecture](api/README.md)
- [API Documentation](docs/API.md)
- [AI Integration Guide](docs/AI.md)

---

**Support Ticket System** - AI-powered support and ticket management system
