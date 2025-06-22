# 🎓 FPT University Chatbot - AI Career Counseling System

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
</p>

> **Chatbot tư vấn nghề nghiệp thông minh sử dụng RAG (Retrieval-Augmented Generation) với MongoDB, Pinecone Vector Database và Google Gemini AI**

## 📋 Tổng quan

Hệ thống chatbot tư vấn nghề nghiệp cho FPT University với:
- 🎓 **19+ ngành học** với thông tin chi tiết
- 🏫 **5 cơ sở** (Hà Nội, TP.HCM, Đà Nẵng, Cần Thơ, Quy Nhon)
- 💰 **Thông tin học phí** realtime từ database
- 🏆 **Học bổng và hỗ trợ tài chính**
- 🤖 **AI-powered responses** với MongoDB + Vector Search
- 🌱 **Auto-seed database** từ JSON files

## ✨ Tính năng chính

### 🔥 Core Features
- **MongoDB-first approach** - Dữ liệu realtime từ database
- **Vector Enhanced Search** - RAG với Pinecone + Gemini AI
- **Auto-seed System** - Tự động setup database khi khởi động
- **Production Ready** - NestJS architecture với caching
- **Developer Friendly** - API documentation với Swagger

### 🎯 AI Capabilities
- Tư vấn về ngành học và cơ hội nghề nghiệp
- Thông tin học phí chi tiết theo campus
- Hướng dẫn về học bổng và tài chính
- Chat interface thân thiện với real-time responses

## 🚀 Quick Start

### 1. Cài đặt
```bash
# Clone repository
git clone [repo-url]
cd SWD-BE_main

# Install dependencies
pnpm install
```

### 2. Cấu hình Environment
```bash
# Copy template
cp env.template .env

# Cấu hình các API keys trong .env:
MONGODB_URI=mongodb://localhost:27017/FchatCareer
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=fpt-university-768d
```

### 3. Khởi động Development
```bash
# Start development server (auto-seed sẽ chạy tự động)
pnpm run start:dev
```

**🎉 Xong! Chatbot sẵn sàng tại http://localhost:3000**

## 🛠️ Scripts Available

### Development
```bash
pnpm run start:dev          # Development server với auto-seed
pnpm run start:prod         # Production server
pnpm run build              # Build for production
```

### Data Management
```bash
pnpm run ingest:mongodb     # Tạo vector embeddings từ MongoDB
pnpm run seed:mongodb       # Seed data từ JSON files (nếu cần)
pnpm run ingest:standalone  # Standalone ingest script
```

### Utilities
```bash
pnpm run kill              # Kill tất cả Node processes
pnpm run restart           # Kill và restart development server
pnpm run test              # Run tests
```

## 🏗️ Kiến trúc hệ thống

### Data Flow
```
User Question
     ↓
🗄️ MongoDB Primary Search (realtime data)
     ↓ (enhance context)
🔍 Pinecone Vector Search (semantic search)
     ↓ (AI generation)
🧠 Gemini AI Response Generation
     ↓ (fallback nếu cần)
📝 Static Fallback Responses
```

### Tech Stack
- **Backend**: NestJS + TypeScript + Express
- **Database**: MongoDB (primary data)
- **Vector DB**: Pinecone (768d embeddings)
- **AI**: Google Gemini (text-embedding-004, gemini-2.0-flash)
- **Auth**: JWT + Redis caching
- **Email**: Nodemailer với verification

## 📊 API Endpoints

### Chatbot Core
```http
POST /ask
POST /chatbot/ask
Content-Type: application/json

{
  "question": "Học phí ngành kỹ thuật phần mềm là bao nhiêu?"
}
```

### System Management
```http
GET /system/data-seed/status        # Check auto-seed status
POST /system/data-seed/seed         # Manual seed trigger
GET /system/data-seed/files         # View available JSON files
GET /chatbot/system/status          # System health check
```

### Authentication
```http
POST /auth/register                 # User registration
POST /auth/login                    # User login
POST /auth/verify-email             # Email verification
```

### Documentation
```http
GET /api/docs                       # Swagger API documentation
```

## 🌱 Auto-Seed System

### Cách hoạt động
Khi chạy `pnpm run start:dev`, hệ thống tự động:

1. **Kiểm tra** MongoDB có dữ liệu chưa
2. **Seed tự động** từ `documents/*.json` nếu database trống
3. **Skip** nếu đã có dữ liệu
4. **Log chi tiết** về quá trình seed

### Nguồn dữ liệu
```
documents/
├── FchatCareer.campuses.json       → campuses collection
├── FchatCareer.majors.json         → majors collection
├── FchatCareer.scholarships.json   → scholarships collection
├── FchatCareer.tuitionFees.json    → tuitionfees collection
└── ... (các file khác)
```

### Monitoring
```bash
# Check seed status
curl http://localhost:3000/system/data-seed/status

# Manual seed
curl -X POST http://localhost:3000/system/data-seed/seed
```

## 📁 Cấu trúc project

```
src/
├── auth/                    # Authentication module
├── chatbot/                 # Main chatbot functionality
│   ├── services/
│   │   ├── ask.service.ts           # Core chatbot logic
│   │   ├── gemini.service.ts        # Google AI integration
│   │   ├── pinecone.service.ts      # Vector database
│   │   └── mongodb-data.service.ts  # MongoDB operations
│   ├── controllers/
│   │   ├── ask.controller.ts        # Chatbot API endpoints
│   │   └── system.controller.ts     # System management
│   └── cli/                         # Command line tools
├── common/                  # Shared utilities
│   ├── services/
│   │   └── data-seed.service.ts     # Auto-seed functionality
│   └── controllers/
│       └── data-seed.controller.ts  # Seed management API
├── entity/                  # MongoDB entities
├── user/                    # User management
├── mail/                    # Email service
└── config/                  # Configuration

documents/                   # JSON data files
public/                     # Frontend assets
├── index.html              # Chat interface
```

## 🎯 Dữ liệu hỗ trợ

### Ngành học (19+ ngành)
- **CNTT**: SE (Kỹ thuật phần mềm), AI (Trí tuệ nhân tạo), IS (Hệ thống thông tin), IA (An toàn thông tin), DS (Khoa học dữ liệu), IOT
- **Thiết kế**: GD (Thiết kế đồ họa), MC (Đa phương tiện)
- **Kinh doanh**: MKT (Marketing), BF (Tài chính ngân hàng), BA (Quản trị kinh doanh), HRM (Quản trị nhân lực), ACT (Kế toán), EM (Quản lý sự kiện), HM (Quản trị khách sạn)
- **Ngôn ngữ**: EL (Ngôn ngữ Anh), JL (Tiếng Nhật), KL (Tiếng Hàn)

### Cơ sở (5 cơ sở)
- Hà Nội, TP.HCM, Đà Nẵng, Cần Thơ, Quy Nhon

### Thông tin khác
- Học phí chi tiết theo ngành và campus
- 8+ loại học bổng với các mức hỗ trợ khác nhau
- Cơ hội nghề nghiệp sau tốt nghiệp
- Yêu cầu tuyển sinh và điều kiện đào tạo

## 💡 Ví dụ câu hỏi

```
"Học phí ngành kỹ thuật phần mềm bao nhiêu?"
"Ngành trí tuệ nhân tạo học những gì?"
"Cơ sở Hà Nội ở đâu?"
"Có những học bổng nào?"
"Ra trường ngành CNTT làm được gì?"
"Yêu cầu đầu vào ngành AI như thế nào?"
```

## 🛠️ Troubleshooting

### MongoDB Issues
```bash
# Kiểm tra MongoDB service
sudo systemctl status mongod
mongosh --eval "db.adminCommand('ping')"

# Kiểm tra dữ liệu
mongosh FchatCareer --eval "show collections"
mongosh FchatCareer --eval "db.majors.countDocuments()"
```

### Pinecone Issues
```bash
# Test API key
curl -X GET https://api.pinecone.io/indexes \
  -H "Api-Key: YOUR_API_KEY"

# Setup index nếu chưa có
pnpm run setup
```

### Gemini AI Issues
- Kiểm tra API key tại: https://makersuite.google.com/app/apikey
- Đảm bảo API enabled và có quota

### Auto-seed Issues
```bash
# Check seed status
curl http://localhost:3000/system/data-seed/status

# Manual seed nếu cần
curl -X POST http://localhost:3000/system/data-seed/seed

# Verify JSON files
ls -la documents/FchatCareer.*.json
```

## 🚀 Deployment

### Development
```bash
pnpm run start:dev          # NestJS development server
node start-chatbot.js simple # Simple Express server
```

### Production
```bash
pnpm run build              # Build application
pnpm run start:prod         # Start production server
node start-chatbot.js nestjs # Production NestJS mode
```

### Docker (Coming soon)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm install
COPY . .
RUN pnpm run build
CMD ["pnpm", "run", "start:prod"]
```

## 🤝 Contributing

1. Fork project
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📞 Support

- **Developer**: FPT University Team
- **Email**: daihocfpt@fpt.edu.vn
- **Hotline**: (024) 7300 1866

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

> 🎓 **FPT University Chatbot** - Tư vấn nghề nghiệp thông minh với AI. Được phát triển với ❤️ bởi FPT University Team.
