# 🤖 FPT University Chatbot với RAG System

## 📋 Tổng quan
Chatbot tư vấn nghề nghiệp cho FPT University sử dụng công nghệ RAG (Retrieval-Augmented Generation) với Google Gemini AI và Pinecone Vector Database.

## ✨ Tính năng chính
- 🎓 Tư vấn về 19+ ngành học tại FPT University
- 💰 Thông tin học phí chi tiết theo từng ngành
- 🏫 Thông tin 5 cơ sở (Hà Nội, TP.HCM, Đà Nẵng, Cần Thơ, Quy Nhon)
- 🏆 Hướng dẫn về học bổng và hỗ trợ tài chính
- 💼 Cơ hội nghề nghiệp sau tốt nghiệp
- 🤖 AI-powered responses với context từ database

## 🔧 Công nghệ sử dụng
- **Backend**: NestJS + TypeScript
- **AI**: Google Gemini (text-embedding-004, gemini-2.0-flash)
- **Vector DB**: Pinecone (768 dimensions)
- **Server**: Express.js
- **Frontend**: HTML/CSS/JavaScript
- **Database**: MongoDB (cho user management)

## 🚀 Cài đặt và sử dụng

### 1. Clone và cài đặt dependencies
```bash
git clone https://github.com/Glannt/SWD-BE.git
cd SWD-BE
git checkout fpt_ai_chatbot_rag
pnpm install
```

### 2. Cấu hình environment
Tạo file `.env` từ template:
```bash
cp env.template .env
```

Cập nhật thông tin trong `.env`:
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=fpt-university-768d
```

### 3. Setup Pinecone Index
```bash
pnpm run setup
```

### 4. Import dữ liệu
```bash
pnpm run ingest
```

### 5. Chạy server
```bash
pnpm run simple
```

### 6. Truy cập ứng dụng
Mở trình duyệt và truy cập: http://localhost:3000

## 📁 Cấu trúc project

```
src/
├── chatbot/
│   ├── services/
│   │   ├── ask.service.ts         # Logic xử lý câu hỏi
│   │   ├── gemini.service.ts      # Google Gemini AI integration
│   │   ├── pinecone.service.ts    # Pinecone Vector DB
│   │   └── ingest.service.ts      # Import dữ liệu
│   ├── controllers/
│   │   └── ask.controller.ts      # API endpoints
│   ├── dto/
│   │   ├── ask-question.dto.ts    # Request DTO
│   │   └── ask-response.dto.ts    # Response DTO
│   ├── cli/
│   │   └── ingest-cli.ts         # CLI import data
│   └── chatbot.module.ts         # NestJS module
├── simple-server.ts              # Express server
└── ...

documents/
└── fpt_university_2025_data_v1_update.json  # Dữ liệu FPT University

public/
└── index.html                    # Chat interface

setup-768d-index.js               # Setup Pinecone index
```

## 🎯 API Endpoints

### Health Check
```
GET /health
```

### Chat với bot
```
POST /ask
Content-Type: application/json

{
  "question": "Học phí ngành kỹ thuật phần mềm?"
}
```

### Web Interface
```
GET /
```

## 📊 Dữ liệu hỗ trợ

### Ngành học (19 ngành)
- **CNTT**: SE, AI, IS, IA, DS, IOT
- **Thiết kế**: GD, MC
- **Kinh doanh**: MKT, BF, BA, HRM, ACT, EM, HM
- **Ngôn ngữ**: EL, KL, JL
- **Khác**: LAW

### Cơ sở (5 cơ sở)
- Hà Nội, TP.HCM, Đà Nẵng, Cần Thơ, Quy Nhon

### Thông tin khác
- Học phí chi tiết theo ngành
- 5 loại học bổng
- Cơ hội nghề nghiệp
- Yêu cầu tuyển sinh

## 🛠️ Scripts available

```bash
pnpm run setup     # Setup Pinecone index
pnpm run ingest    # Import dữ liệu vào Pinecone
pnpm run simple    # Chạy Express server
pnpm run start     # Chạy NestJS server
pnpm run build     # Build project
```

## 💡 Ví dụ câu hỏi

- "Học phí ngành kỹ thuật phần mềm bao nhiêu?"
- "Ngành trí tuệ nhân tạo học những gì?"
- "Cơ sở Hà Nội ở đâu?"
- "Có những học bổng nào?"
- "Ra trường ngành CNTT làm gì?"

## 🐛 Troubleshooting

### Lỗi Pinecone connection
- Kiểm tra PINECONE_API_KEY trong .env
- Đảm bảo index đã được tạo: `pnpm run setup`

### Lỗi Gemini API
- Kiểm tra GEMINI_API_KEY trong .env
- Đảm bảo API key có quyền truy cập

### Lỗi import dữ liệu
- Kiểm tra file `documents/fpt_university_2025_data_v1_update.json` tồn tại
- Chạy lại: `pnpm run ingest`

## 🤝 Contribution

1. Fork project
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📞 Liên hệ

- **Developer**: FPT University Team
- **Email**: daihocfpt@fpt.edu.vn
- **Hotline**: (024) 7300 1866

---

> 🎓 **FPT University Chatbot** - Tư vấn nghề nghiệp thông minh với AI 