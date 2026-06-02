# Academia Platform

A state-of-the-art, comprehensive educational platform built with **Django 5.2** and **React 19**, featuring advanced test management, course delivery, secure video streaming (VOD), an integrated e-commerce shop, support ticket system, dynamic knowledge management, and AI integration.

Specifically optimized for Persian-language education with full Jalali calendar integration, RTL layouts, and advanced typography fixes.

---

## 🎯 Key Capabilities & Features

### 🔐 Authentication & Session Security
*   **Dual Authentication Modes**: Supports standard username/email login and secure **SMS-based phone number verification** (using `sms.ir` gateway).
*   **Cross-Tab Token Synchronization**: Real-time token and logout synchronization across multiple browser tabs using the **BroadcastChannel API** and reactive Axios interceptors.
*   **Secure File Access**: JWT-linked token validation (`file_access_token`) restricts access to course materials and test content, protecting intellectual property.
*   **Device Fingerprinting**: Captures and validates unique device identifiers (`@fingerprintjs`) during test sessions to prevent multiple logins and cheating.

### 📝 Advanced Test Management & Test Maker Suite
*   **Test Maker Dashboard**: Comprehensive teacher interface to design question pools, assign options, organize files, and publish tests.
*   **Test Collections**: Grouping and organizing tests into collections with custom serialization (e.g., `folders_count`, `is_public` control).
*   **Detailed Answer Sheets**: Interactive page (`TestAnswerSheetPage`) displaying student inputs, correct choices, score breakdown, and PDF download options (using `@react-pdf-viewer`).
*   **Flexible Grading Engine**: Automated score calculations, time-remaining counts, random topic-based test generation, and historical performance tracking.

### 🎓 Course Delivery & Session Files
*   **Dynamic Schedules & Sessions**: Manage upcoming lectures, class timing, and course curriculum in real-time.
*   **Session File Management**: Allows instructors to link course slides, handouts, and code files to specific lecture sessions with secure download URLs.
*   **Chunked Video Uploads (VOD)**: Supports resumable video uploads for high-resolution class recordings (Tus-protocol compatible).

### 🛒 E-commerce & Finance
*   **Unified Product Catalog**: Digital products (courses, tests, collections) and physical goods.
*   **Zarinpal Payment Gateway**: Secure local Iranian payment gateway integration, sandbox support for development, and automated webhook callback processing (`/api/finance/payment/callback/`).
*   **Cart System**: Synchronized session-based cart for guests and account-based persistence for authenticated users.

### 🧠 Knowledge Tree & Learning Pathways
*   **Dual Hierarchy System**: Legacy `Subject ➔ Chapter ➔ Section ➔ Topic` hierarchy alongside a modern self-referencing Folder structure.
*   **Progress Tracking**: Tracks student progress, topic mastery, and dynamically recommends practice tests.

### 🤖 AI Support & Ticket Center
*   **Gemini AI Integration**: Automated support ticketing categorizing queries and providing instant educational assistance.
*   **AI Chat Threads**: Persistent chat history for students seeking help on various topics.

### 🔤 Localization & UI/UX Polish
*   **Persian Typography Fixes**: Custom CSS utilities and the `PersianNumber` component resolve common Persian font glyph boundary overlaps, ensuring neat math expressions and fractions.
*   **Jalali Calendar Alignment**: Saturday-first weekday grid alignment logic on calendars.
*   **Aesthetic UI**: Responsive sidebar navigation, dark/light themes, and interactive animations (framer-motion).

---

## 🛠️ Technology Stack

### Backend
*   **Framework**: Django 5.2.4
*   **API Framework**: Django REST Framework (DRF) 3.16.0
*   **Database**: PostgreSQL / SQLite (for local development)
*   **Async/Real-time**: Django Channels 4.3.1 (with Daphne web server)
*   **Authentication**: Simple JWT 5.5.1 with HTTP-only cookies
*   **Storage**: AWS S3 compatible (ParsPack Object Storage integration via `django-storages`)

### Frontend
*   **Framework**: React 19.1.0 & TypeScript
*   **Styling**: Tailwind CSS v4.1.11 (`@tailwindcss/vite`) + shadcn/ui
*   **State Management**: TanStack Query v5.89.0 + React Context API
*   **Routing**: React Router DOM 7.7.0
*   **Animations**: Framer Motion 12.23.12
*   **Rich Utilities**: Lexical Editor 0.36.1, Recharts (for analytics), moment-jalaali

---

## 📁 Project Structure

```
Academia/
├── api/                   # Django Settings, ASGI/WSGI, routing, and custom middlewares
├── accounts/              # User management, phone verification, and profiles
├── courses/               # Courses, sessions, schedule, and dashboard statistics
├── contents/              # Video upload service, secure file models, official books, and gallery images
├── tests/                 # Quiz creation, question bank, test collections, and grading
├── shop/                  # Products catalog, cart, and discount system
├── finance/               # Orders, transactions, and Zarinpal gateway integration
├── tickets/               # Support tickets and Gemini AI conversations
├── knowledge/             # Educational knowledge tree nodes and folder management
├── blog/                  # Post articles, tags, comments, and categories
├── chat/                  # WebSocket consumers and rooms for real-time course chat
├── utils/                 # General project helper utilities
├── vite-project/          # React v19 Frontend (TypeScript & Tailwind v4)
│   ├── src/               # Application code (components, pages, context, hooks)
│   ├── public/            # Static assets
│   └── package.json       # Node dependency listing
├── requirements.txt       # Python dependency listing
└── manage.py              # Django management CLI
```

---

## 🚀 Installation & Local Setup

### Prerequisites
*   Python 3.11+
*   Node.js 18+
*   PostgreSQL or MySQL (Optional, default SQLite is pre-configured)

### 1. Backend Setup
1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd Academia
    ```
2.  **Create and activate a virtual environment**:
    ```bash
    python -m venv venv
    # On Windows:
    venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```
3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
4.  **Configure environment variables**:
    Copy the sample environment file:
    ```bash
    cp env.example .env
    ```
    Open `.env` and fill in your configurations (database credentials, ParsPack S3 credentials, Gemini API key, sms.ir API key).
5.  **Run Database Migrations & Create Superuser**:
    ```bash
    python manage.py migrate
    python manage.py createsuperuser
    ```
6.  **Start Django Development Server**:
    ```bash
    python manage.py runserver
    ```

### 2. Frontend Setup
1.  **Navigate to the frontend folder**:
    ```bash
    cd vite-project
    ```
2.  **Install Node packages**:
    ```bash
    npm install
    ```
3.  **Run Dev Server**:
    ```bash
    npm run dev
    ```
    The application will run at `http://localhost:5173`.

---

## 📈 API Endpoints

All backend endpoints are prefixed with `/api/`.

### 🔐 Authentication
*   `POST /api/register/` - Register a new user
*   `POST /api/login/` - User login (supports Email, Username, or Phone Number)
*   `POST /api/token/refresh/` - Refresh JWT token
*   `POST /api/logout/` - Invalidate session and logout
*   `POST /api/send-phone-verification/` - Request phone registration verification SMS
*   `POST /api/verify-phone/` - Verify phone OTP code
*   `GET /api/user/` - Fetch authenticated user details

### 📝 Test Management & Taking
*   `GET /api/tests/` - List tests available
*   `POST /api/enter-test/` - Start a test session
*   `POST /api/submit-answer/` - Submit answer for a specific test question
*   `POST /api/finish-test/` - End and grade the current test session
*   `GET /api/tests/<id>/statistics/` - Fetch statistics for a test (Teacher)
*   `GET /api/tests/<test_id>/student/<student_id>/result/` - Fetch answers and result of a student

### 🎓 Courses & Dashboards
*   `GET /api/courses/` - Retrieve course list
*   `GET /api/courses/student/dashboard-stats/` - Student home page summary stats
*   `GET /api/courses/student/active-courses/` - Current enrolled courses for student
*   `GET /api/courses/teacher/analytics/` - Comprehensive teaching metrics

### 🛒 E-commerce & Checkout
*   `GET /api/shop/products/` - List products for purchase
*   `POST /api/shop/cart/` - Fetch / update shopping cart items
*   `POST /api/finance/payment/initiate/` - Request a payment gateway token
*   `GET /api/finance/payment/callback/` - Zarinpal verification webhook callback

---

## 📦 Production Builds

To compile static files and prepare applications for deployment:

### Backend
Collect all static files to static storage:
```bash
python manage.py collectstatic --noinput
```

### Frontend
To run type-checks and compile the bundle:
*   **Windows**:
    ```bash
    npm run windows-build
    ```
*   **Linux/macOS**:
    ```bash
    npm run linux-build
    ```
*   **Standard**:
    ```bash
    npm run build
    ```

---

## 🧪 Testing

To run unit tests across backend and frontend environments:

### Backend Tests
```bash
python manage.py test
```

### Frontend Tests
```bash
cd vite-project
npm test
```

---

## 🔄 Release History

*   **v1.3.0** (Current):
    *   Added **Test Maker Dashboard** and **Test Collection** organizational structures.
    *   Implemented **Cross-Tab Authentication Sync** via BroadcastChannel API.
    *   Added dynamic stats endpoints for Teacher and Student home dashboards.
    *   Resolved calendar Saturday start alignment issues.
*   **v1.2.0**:
    *   Added **Phone Number OTP Registration** (`sms.ir`).
    *   Implemented token-secure file download endpoints.
    *   Integrated custom Persian font rendering patches.
*   **v1.1.0**:
    *   Added Google Gemini AI educational helper integrations.
    *   Introduced ticket support page with scrollbar enhancements.
*   **v1.0.0**:
    *   Initial production release with standard course, test, and Zarinpal payment features.

---

**Built with ❤️ for advanced digital education**
