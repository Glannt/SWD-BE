# 🗄️ MongoDB Integration cho FPT University Chatbot

## 📋 Tổng quan

Hệ thống chatbot đã được nâng cấp để hỗ trợ **3 nguồn dữ liệu**:

1. **🎯 Pinecone Vector Database** (chính) - RAG với embeddings
2. **🗄️ MongoDB Real-time Data** (realtime) - Dữ liệu động từ database
3. **📄 JSON File Backup** (fallback) - Dữ liệu tĩnh dự phòng

## 🏗️ Kiến trúc hệ thống

```
User Question
     ↓
🔍 Vector Search (Pinecone + Gemini)
     ↓ (nếu không tìm thấy)
🗄️ MongoDB Realtime Query
     ↓ (nếu thất bại)
📝 Fallback Static Responses
```

## 📊 Entities MongoDB

### 1. Campus
```typescript
- name: string
- address: string  
- contactInfo: string
- descriptionHighlights: string
```

### 2. Major  
```typescript
- name: string
- code: string (SE, AI, IS, IA, DS, IOT...)
- description: string
- careerOpportunities: string
- totalCredits: number
- programDuration: string
```

### 3. TuitionFee
```typescript
- major: ObjectId (ref Major)
- semesterRange: string
- baseAmount: number
- currency: string
- effectiveFrom: Date
```

### 4. Scholarship
```typescript
- name: string
- description: string
- value: number
- coverage: enum (Full/Partial)
- requirements: string
- isActive: boolean
```

## 🚀 Cách sử dụng

### 1. Cấu hình Environment

```bash
# Sao chép và cấu hình .env
cp env.template .env

# Cấu hình các biến cần thiết
MONGODB_URI=mongodb://localhost:27017/swd_db
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=fpt-university-768d
```

### 2. Ingestion (Nạp dữ liệu)

#### Option A: Chỉ từ MongoDB
```bash
pnpm run ingest:mongodb
```

#### Option B: Chỉ từ JSON file  
```bash
pnpm run ingest:json
```

#### Option C: Từ cả hai nguồn (khuyến nghị)
```bash
pnpm run ingest:both
```

### 3. Khởi động server
```bash
pnpm start:dev
```

## 🔧 API Endpoints

### Chatbot Core
- `POST /chatbot/ask` - Hỏi chatbot (hỗ trợ MongoDB + Vector search)

### System Monitoring  
- `GET /chatbot/system/status` - Trạng thái hệ thống
- `GET /chatbot/system/data-stats` - Thống kê dữ liệu MongoDB
- `GET /chatbot/system/health-check` - Kiểm tra sức khỏe toàn diện

### Ví dụ test API:
```bash
# Test chatbot
curl -X POST http://localhost:3000/chatbot/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Học phí ngành AI là bao nhiêu?"}'

# Check system status
curl http://localhost:3000/chatbot/system/status
```

## 🔄 Luồng xử lý câu hỏi

### 1. Vector Search (Ưu tiên)
- Tạo embedding cho câu hỏi với Gemini
- Tìm kiếm trong Pinecone vector database
- Nếu tìm thấy → Sử dụng context để generate answer

### 2. MongoDB Realtime Query (Fallback)
- Phân tích từ khóa trong câu hỏi
- Query trực tiếp MongoDB theo category:
  - Campus: `getCampusByName()`
  - Major: `getMajorByCodeOrName()`  
  - Tuition: `getTuitionFeeByMajorCode()`
  - Scholarship: `getActiveScholarships()`
- Tạo context từ kết quả realtime

### 3. Static Fallback (Cuối cùng)
- Sử dụng responses được hardcode
- Thông tin cơ bản về học phí, campus

## 📈 Monitoring & Debugging

### System Status Response
```json
{
  "status": "healthy|partial|error",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "mongodb": {
      "status": "healthy",
      "stats": {
        "campuses": 5,
        "majors": 16,
        "tuitionFees": 45,
        "scholarships": 12
      }
    },
    "pinecone": {"status": "healthy"},
    "gemini": {"status": "healthy"}
  }
}
```

### Health Check Features
- ✅ MongoDB connection test
- ✅ Pinecone query test  
- ✅ Gemini AI embedding test
- ✅ Full integration test
- ✅ Performance timing

## 🛠️ Troubleshooting

### MongoDB Issues
```bash
# Check MongoDB service
sudo systemctl status mongod

# Check connection
mongosh --eval "db.adminCommand('ping')"

# Check collections
mongosh swd_db --eval "show collections"
```

### Pinecone Issues
```bash
# Verify API key
curl -X GET https://api.pinecone.io/indexes \
  -H "Api-Key: YOUR_API_KEY"

# Check index status  
GET /chatbot/system/status
```

### Gemini AI Issues
```bash
# Test API key
curl -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent \
  -H "x-goog-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}'
```

## 🎯 Best Practices

### 1. Data Management
- Thường xuyên cập nhật dữ liệu MongoDB
- Re-ingest sau khi có thay đổi lớn
- Monitor data statistics qua API

### 2. Performance
- MongoDB indexes cho tìm kiếm nhanh
- Pinecone vector caching
- Gemini rate limiting

### 3. Fallback Strategy
- Luôn có backup responses
- Graceful degradation khi services down
- Clear error messages cho users

## 📝 Development Notes

### Thêm entity mới
1. Tạo schema trong `src/entity/`
2. Thêm vào `MongoDbDataService`
3. Update `getAllDataAsChunks()` method
4. Thêm logic vào `getRealtimeMongoContext()`

### Custom queries
- Sửa `MongoDbDataService` methods
- Thêm indexes MongoDB nếu cần
- Test performance với data lớn

## 🔮 Future Enhancements

- [ ] Real-time sync MongoDB → Pinecone
- [ ] Advanced semantic search trong MongoDB
- [ ] Caching layer với Redis
- [ ] Multi-language support
- [ ] Analytics & user behavior tracking 