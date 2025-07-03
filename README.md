# 🎓 FPT University Chatbot - AI Assistant with Authentication

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
</p>

> **Chatbot tư vấn thông minh sử dụng Pinecone Assistant + GPT-4o với hệ thống xác thực người dùng**

## 📋 Tổng quan

Hệ thống chatbot tư vấn cho FPT University với:

- 🤖 **Pinecone Assistant** với GPT-4o
- 🔐 **User Authentication** với JWT + Email verification
- 📚 **Document-based Q&A** với citations
- 🚀 **Production Ready** NestJS architecture

## ⚡ Quick Start - CHỈ 2 LỆNH!

### Prerequisites

- Node.js + pnpm
- MongoDB running on port 27017 (cho user data)

### Setup (Hoàn toàn tự động)

```bash
# 1. Cài đặt dependencies
pnpm install

# 2. Start server (Tự động upload tài liệu FPT University)
pnpm run start:dev
```

🎉 **XONG!** Chatbot sẵn sàng tại `http://localhost:3000`

**✅ Tự động hóa hoàn toàn:**

- ✅ Tự động khởi tạo Pinecone Assistant
- ✅ Tự động upload tài liệu "THÔNG TIN ĐẠI HỌC FPT 2025.docx"
- ✅ Tự động kiểm tra và bỏ qua nếu đã có tài liệu
- ✅ Tự động seed database từ JSON files
- ✅ Sẵn sàng sử dụng ngay lập tức

### Cấu hình Environment (Optional)

Nếu muốn sử dụng API keys riêng:

```bash
cp env.template .env
# Cập nhật PINECONE_API_KEY, GEMINI_API_KEY trong .env
```

## ✨ Tính năng chính

### 🔥 Core Features

- **Pinecone Assistant** - AI Assistant với GPT-4o
- **User Authentication** - Đăng ký, đăng nhập, xác thực email
- **Document Processing** - Tự động xử lý PDF, DOC, DOCX
- **Citation System** - Trích dẫn nguồn chính xác
- **RESTful API** - Swagger documentation

### 🎯 AI Capabilities

- Trả lời câu hỏi dựa trên tài liệu đã upload
- Chat interface với real-time responses
- Automatic document chunking và vectorization
- Source attribution cho minh bạch thông tin

## 🏗️ Architecture

### Simplified Data Flow

```
User Authentication → JWT Token
     ↓
User Question → Pinecone Assistant → GPT-4o → Response (with citations)
```

### Tech Stack

- **Backend**: NestJS + TypeScript
- **Database**: MongoDB (user data)
- **AI**: Pinecone Assistant + GPT-4o
- **Auth**: JWT + Redis caching
- **Email**: Nodemailer với verification

## 📊 API Endpoints

### 🔐 Authentication

```http
POST /auth/register                 # User registration
POST /auth/login                    # User login
POST /auth/verify-email             # Email verification
POST /auth/logout                   # User logout
```

### 🤖 Chatbot Core

```http
POST /ask                          # Chat (backward compatibility)
POST /assistant/chat               # New chat endpoint
Content-Type: application/json

{
  "question": "Học phí ngành kỹ thuật phần mềm là bao nhiêu?",
  "sessionId": "optional_session_id"
}
```

### 📚 Document Management

```http
POST /assistant/upload             # Upload documents
GET /assistant/status              # Assistant health
GET /assistant/files               # List uploaded files
```

## 🛠️ Environment Variables

```env
# Server
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/FchatCareer

# AI Services
PINECONE_API_KEY=your_pinecone_api_key
GEMINI_API_KEY=your_gemini_api_key

# Authentication
JWT_ACCESS_TOKEN_SECRET=your_jwt_secret
JWT_ACCESS_TOKEN_EXPIRATION_TIME=3600s

# Email Service
MAIL_HOST=smtp.gmail.com
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
MAIL_FROM=your_email@gmail.com

# Redis (optional for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 🚀 Scripts Available

### Development

```bash
pnpm run start:dev              # Development server (auto-upload tài liệu)
pnpm run start:prod             # Production server
pnpm run build                  # Build for production
```

### AI Assistant (Optional - tự động chạy khi start:dev)

```bash
pnpm run assistant:upload       # Manual upload FPT University documents
pnpm run assistant:status       # Check assistant status
```

### Utilities

```bash
pnpm run lint                   # Code linting
pnpm run test                   # Run tests
pnpm run kill                   # Kill all Node processes
```

## 📚 Usage Examples

### 1. User Registration & Login

```javascript
// Register
POST /auth/register
{
  "email": "student@fpt.edu.vn",
  "password": "SecurePass123",
  "fullName": "Nguyễn Văn A"
}

// Login
POST /auth/login
{
  "email": "student@fpt.edu.vn",
  "password": "SecurePass123"
}
```

### 2. Chat with AI Assistant

```javascript
// Chat (requires authentication)
POST /assistant/chat
Authorization: Bearer <jwt_token>
{
  "question": "Ngành AI học những gì?",
  "sessionId": "user123_session1"
}

// Response with citations
{
  "answer": "Ngành Trí tuệ nhân tạo tại FPT University...",
  "citations": [
    {
      "position": 45,
      "references": [
        {
          "pages": [12, 13],
          "file": {
            "name": "THÔNG TIN ĐẠI HỌC FPT 2025.docx"
          }
        }
      ]
    }
  ]
}
```

### 3. Document Upload (Optional - đã tự động)

```bash
curl -X POST http://localhost:3000/assistant/upload \
  -H "Authorization: Bearer <jwt_token>" \
  -F "file=@./document.pdf"
```

**Lưu ý**: Tài liệu FPT University đã được tự động upload khi start server.

## 💡 Ví dụ câu hỏi

```
"Học phí ngành kỹ thuật phần mềm bao nhiêu?"
"Ngành trí tuệ nhân tạo học những gì?"
"Cơ sở Hà Nội ở đâu?"
"Có những học bổng nào?"
"Yêu cầu đầu vào ngành AI như thế nào?"
"Cơ hội nghề nghiệp sau tốt nghiệp?"
```

## 🛠️ Troubleshooting

### Authentication Issues

```bash
# Check JWT token
curl -H "Authorization: Bearer <token>" http://localhost:3000/users/profile

# Reset password
POST /auth/forgot-password
```

### AI Assistant Issues

```bash
# Check assistant status
curl http://localhost:3000/assistant/status

# View uploaded files
curl http://localhost:3000/assistant/files
```

### MongoDB Issues

```bash
# Check MongoDB connection
mongosh mongodb://localhost:27017/FchatCareer

# Restart MongoDB service
sudo systemctl restart mongod
```

## 📱 API Documentation

Truy cập Swagger documentation tại: `http://localhost:3000/api/docs`

## 🔧 Development

### Project Structure

```
src/
├── auth/                    # 🔐 Authentication & Authorization
├── user/                    # 👤 User Management
├── pinecone-assistant/      # 🤖 AI Assistant integration
├── common/                  # 🛠️ Shared utilities
├── config/                  # ⚙️ Configuration
├── entity/                  # 📄 Database entities
├── mail/                    # 📧 Email service
└── main.ts                  # 🚀 Application entry point
```

### Key Features

- ✅ JWT Authentication với refresh tokens
- ✅ Email verification system
- ✅ User profile management
- ✅ AI-powered document Q&A
- ✅ Automatic document processing
- ✅ Citation và source tracking
- ✅ Production-ready architecture

## 🚀 Deployment

### Docker

```bash
# Build image
docker build -t fpt-chatbot .

# Run container
docker run -p 3000:3000 fpt-chatbot
```

### Production checklist

- ✅ Cập nhật production database URLs
- ✅ Cấu hình email service (SMTP)
- ✅ Setup Redis cho session caching
- ✅ Configure reverse proxy (Nginx)
- ✅ Setup SSL certificates
- ✅ Configure monitoring và logging

## AI Tag Sessions Script (Tự động gán tag bằng AI)

Script `ai_tag_sessions.py` hỗ trợ cấu hình động qua biến môi trường để dễ deploy/Docker:

### Chạy trực tiếp:

```bash
BACKEND_API=http://backend:3000/api/v1/admin/dashboard/sessions-messages \
UPDATE_TAG_API=http://backend:3000/api/v1/admin/dashboard/update-session-tag \
GEMINI_API_KEY=your_gemini_api_key \
python ai_tag_sessions.py
```

### Khi dùng Docker Compose:

```yaml
services:
  ai-tag:
    image: python:3.10
    volumes:
      - ./SWD-BE:/app
    working_dir: /app
    command: python ai_tag_sessions.py
    environment:
      - BACKEND_API=http://backend:3000/api/v1/admin/dashboard/sessions-messages
      - UPDATE_TAG_API=http://backend:3000/api/v1/admin/dashboard/update-session-tag
      - GEMINI_API_KEY=your_gemini_api_key
```

Nếu không truyền biến môi trường, script sẽ dùng giá trị mặc định (localhost).

---

🎓 **FPT University Chatbot** - Developed with ❤️ using NestJS + Pinecone Assistant
