# Academia Platform

A comprehensive educational platform built with Django and React, featuring test management, course delivery, live streaming, e-commerce, and knowledge management systems.

## 🎯 Overview

Academia is a full-featured educational platform designed for students and teachers. It provides:

- **Test Management**: Create, schedule, and manage various types of tests
- **Course Delivery**: Live streaming, VOD, and session management
- **E-commerce**: Digital and physical product sales with payment integration
- **Knowledge Management**: Hierarchical knowledge tree with progress tracking
- **AI Integration**: AI-powered support tickets and assistance
- **Real-time Features**: Live chat, streaming, and notifications

## 🚀 Technology Stack

### Backend
- **Framework**: Django 5.2.4
- **API**: Django REST Framework
- **Authentication**: JWT with cookie-based tokens
- **Database**: PostgreSQL/MySQL (configurable)
- **Storage**: AWS S3 compatible (ParsPack Object Storage)
- **Real-time**: Django Channels (WebSockets)
- **Payment**: Zarinpal integration

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Context API + TanStack Query
- **Routing**: React Router DOM
- **Rich Text**: Lexical editor
- **PDF Rendering**: PDF.js
- **Live Streaming**: HLS.js

### Infrastructure
- **CDN**: ParsPack CDN for static/media files
- **SMS**: sms.ir for verification
- **Email**: Django's send_mail
- **AI**: Google Gemini integration
- **PWA**: Progressive Web App support

## 📁 Project Structure

```
Academia/
├── README.md (this file)
├── docs/ (comprehensive documentation)
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── DEVELOPMENT.md
├── scripts/ (utility scripts)
│   ├── deploy.sh
│   └── data_migration/
├── api/ (Django backend)
│   ├── settings.py
│   ├── urls.py
│   ├── auth.py
│   └── middleware.py
├── accounts/ (user management)
├── tests/ (test system)
├── courses/ (course management)
├── knowledge/ (knowledge tree)
├── shop/ (e-commerce)
├── finance/ (payments)
├── contents/ (file storage)
├── tickets/ (support system)
├── blog/ (content management)
├── chat/ (real-time chat)
├── vite-project/ (React frontend)
│   ├── src/
│   ├── public/
│   └── package.json
└── requirements.txt
```

## 🛠️ Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL or MySQL
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Academia
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Database setup**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

6. **Run development server**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd vite-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

## 🔑 Key Features

### Test Management System
- **Test Types**: Scheduled, topic-based, and practice tests
- **Question Types**: Multiple choice, true/false, and custom questions
- **Session Security**: Device fingerprinting, time limits, and anti-cheating measures
- **Scoring**: Automatic scoring with detailed analytics
- **Progress Tracking**: Student performance monitoring

### Course Delivery
- **Live Streaming**: Real-time video streaming with chat
- **VOD**: Video-on-demand content delivery
- **Session Management**: Scheduled classes and recordings
- **Enrollment**: Student enrollment and access control

### E-commerce Platform
- **Product Types**: Digital (courses, tests) and physical products
- **Payment Integration**: Zarinpal payment gateway
- **Cart Management**: Session-based cart for guests, user-based for authenticated users
- **Access Control**: Automatic access granting after purchase

### Knowledge Management
- **Dual Hierarchy**: Legacy Subject→Topic and new Folder system
- **Progress Tracking**: Student progress through knowledge tree
- **Mastery Detection**: Automatic mastery level calculation
- **Topic Management**: Hierarchical organization of educational content

### AI Integration
- **Support Tickets**: AI-powered ticket categorization and responses
- **Google Gemini**: Advanced AI capabilities for educational assistance

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Cookie Security**: HTTP-only cookies for token storage
- **Role-based Access**: Teacher, student, and admin roles
- **Test Session Security**: Device fingerprinting and session validation
- **Payment Security**: Secure payment processing with Zarinpal

## 📊 API Endpoints

### Authentication
- `POST /auth/login/` - User login
- `POST /auth/register/` - User registration
- `POST /auth/refresh/` - Token refresh
- `POST /auth/logout/` - User logout

### Tests
- `GET /tests/` - List tests
- `POST /tests/` - Create test
- `GET /tests/{id}/` - Test details
- `POST /tests/{id}/enter/` - Enter test session
- `POST /tests/{id}/submit-answer/` - Submit answer
- `POST /tests/{id}/finish/` - Finish test

### Courses
- `GET /courses/` - List courses
- `POST /courses/` - Create course
- `POST /courses/{id}/enroll/` - Enroll student
- `POST /courses/{id}/start-live/` - Start live session

### E-commerce
- `GET /shop/products/` - List products
- `POST /shop/cart/` - Add to cart
- `POST /finance/orders/` - Create order
- `POST /finance/payments/` - Process payment

## 🚀 Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

### Quick Production Setup

1. **Backend deployment**
   ```bash
   # Set production environment variables
   export DEBUG=False
   export ALLOWED_HOSTS=yourdomain.com
   
   # Collect static files
   python manage.py collectstatic
   
   # Run with production server
   gunicorn api.wsgi:application
   ```

2. **Frontend deployment**
   ```bash
   # Build for production
   npm run build
   
   # Serve with nginx or similar
   ```

## 🧪 Testing

### Backend Testing
```bash
python manage.py test
```

### Frontend Testing
```bash
cd vite-project
npm test
```

## 📚 Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Development Guide](docs/DEVELOPMENT.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Standards
- Follow PEP 8 for Python code
- Use TypeScript for frontend
- Write comprehensive tests
- Document new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation in the `docs/` directory

## 🔄 Version History

- **v1.0.0**: Initial release with core features
- **v1.1.0**: Added AI integration and improved UI
- **v1.2.0**: Enhanced security and performance optimizations

---

**Built with ❤️ for education**
