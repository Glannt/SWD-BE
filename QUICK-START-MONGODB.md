# 🚀 Quick Start - FPT University Chatbot với MongoDB

## ⚡ TL;DR - Khởi động nhanh

MongoDB đã có dữ liệu → Chỉ cần 3 bước:

```bash
# 1. Cấu hình environment
cp env.template .env
# (Điền các API keys cần thiết)

# 2. Tạo vector embeddings từ MongoDB
pnpm run ingest:mongodb

# 3. Khởi động chatbot  
pnpm run start:dev
```

**✅ Xong! Chatbot sẵn sàng tại http://localhost:3000**

---

## 📋 Chi tiết từng bước

### Bước 1: Environment Setup
```bash
# Copy file cấu hình
cp env.template .env

# Chỉnh sửa .env với các thông tin:
MONGODB_URI=mongodb://localhost:27017/your_db_name
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key  
PINECONE_INDEX_NAME=fpt-university-768d
```

### Bước 2: Kiểm tra MongoDB (optional)
```bash
# Kiểm tra dữ liệu có sẵn
mongosh your_db_name --eval "
  console.log('Campuses:', db.campuses.countDocuments());
  console.log('Majors:', db.majors.countDocuments());
  console.log('Tuition Fees:', db.tuitionfees.countDocuments());
  console.log('Scholarships:', db.scholarships.countDocuments());
"
```

### Bước 3: Ingest dữ liệu vào Vector Database
```bash
# Tạo embeddings từ MongoDB có sẵn
pnpm run ingest:mongodb

# Hoặc ngắn gọn hơn
pnpm run ingest
```

### Bước 4: Khởi động Application
```bash
# Development mode
pnpm run start:dev

# Production mode  
pnpm run start:prod
```

---

## 🧪 Test Chatbot

### Qua Web UI:
- Truy cập: http://localhost:3000
- Gõ câu hỏi về FPT University

### Qua API:
```bash
curl -X POST http://localhost:3000/chatbot/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Học phí ngành AI là bao nhiêu?"}'
```

### Ví dụ câu hỏi test:
- "Có những campus nào?"
- "Ngành kỹ thuật phần mềm học những gì?"
- "Học phí ngành AI bao nhiêu?"
- "Có học bổng gì không?"

---

## 🔧 Troubleshooting nhanh

### Lỗi MongoDB connection:
```bash
# Kiểm tra MongoDB running
sudo systemctl status mongod

# Test connection
mongosh --eval "db.adminCommand('ping')"
```

### Lỗi Pinecone:
```bash
# Test API key
curl -X GET https://api.pinecone.io/indexes \
  -H "Api-Key: YOUR_API_KEY"
```

### Lỗi Gemini:
- Kiểm tra API key tại: https://makersuite.google.com/app/apikey
- Đảm bảo API enabled và có quota

### System health check:
```bash
curl http://localhost:3000/chatbot/system/status
```

---

## 📱 Workflow khi có dữ liệu mới

Khi MongoDB được update với dữ liệu mới:

```bash
# 1. Re-ingest để cập nhật vector database
pnpm run ingest:mongodb

# 2. Restart application (nếu cần)
pnpm run start:dev
```

**Lưu ý**: Không cần seed từ JSON vì MongoDB đã có dữ liệu realtime.

---

## 🎯 Kiến trúc hoạt động

```
User Question → MongoDB Query (primary) → Vector Search (enhance) → AI Response
                     ↓ (fallback)              ↓ (fallback)
                Static Responses ← ← ← ← ← ← ← ← ← 
```

**🔥 Chatbot ưu tiên dữ liệu realtime từ MongoDB, enhanced bởi vector search!** 