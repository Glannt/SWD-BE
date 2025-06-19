# 🚀 FPT University Chatbot - MongoDB Exclusive Approach

## 📋 Tổng quan thay đổi

Hệ thống chatbot đã được **hoàn toàn chuyển đổi** để sử dụng **MongoDB làm nguồn dữ liệu chính**, loại bỏ dependency vào JSON file fix cứng.

### ✅ Những gì đã thay đổi:

1. **🗄️ MongoDB-First Architecture**: Chatbot ưu tiên lấy dữ liệu từ MongoDB realtime
2. **🔍 RAG Enhancement**: Vector search được sử dụng để enhance context từ MongoDB  
3. **❌ Loại bỏ JSON Fix cứng**: Không còn phụ thuộc vào file JSON tĩnh
4. **⚡ Improved Performance**: Dữ liệu realtime từ database thay vì file tĩnh

### 🏗️ Kiến trúc mới:

```
User Question
     ↓
🗄️ MongoDB Realtime Query (PRIMARY)
     ↓ (enhance context)
🔍 Pinecone Vector Search (SECONDARY)
     ↓ (fallback nếu thất bại)
📝 Static Fallback Responses
```

## 🛠️ Cách sử dụng mới

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

### 2. Setup Vector Database (Chỉ cần ingest)

```bash
# Chỉ cần 1 bước: Tạo vector embeddings từ dữ liệu có sẵn trong MongoDB
pnpm run ingest:mongodb
# hoặc  
pnpm run ingest

# Lưu ý: MongoDB đã có dữ liệu sẵn, không cần seed từ JSON
```

### 3. Khởi động Chatbot

```bash
# Development mode
pnpm run start:dev

# Production mode  
pnpm run start:prod
```

## 📊 Scripts đã thay đổi

### Scripts hiện tại:
- `pnpm run ingest:mongodb` - Tạo embeddings từ dữ liệu có sẵn trong MongoDB  
- `pnpm run ingest` - Alias cho ingest:mongodb
- `pnpm run seed:mongodb` - Giữ lại để tham khảo, nhưng không cần thiết

### Scripts đã loại bỏ:
- ~~`ingest:json`~~ - Không còn cần ingest từ JSON
- ~~`ingest:both`~~ - Không còn có "both sources"
- ~~`test-config`~~ - Config test đã được tích hợp

### 💡 Lưu ý quan trọng:
- MongoDB đã có dữ liệu sẵn → Không cần chạy `seed:mongodb`
- Chỉ cần chạy `ingest:mongodb` để tạo vector embeddings

## 🔄 Luồng hoạt động mới

### 1. MongoDB Primary Query
- Phân tích câu hỏi theo từ khóa
- Query trực tiếp từ MongoDB collections:
  - `campuses` - Thông tin cơ sở
  - `majors` - Thông tin ngành học
  - `tuitionfees` - Học phí
  - `scholarships` - Học bổng

### 2. Vector Enhancement (Optional)
- Nếu tìm thấy trong MongoDB → Enhance với vector search
- Kết hợp context từ MongoDB + Vector để có câu trả lời đầy đủ hơn

### 3. Vector Fallback
- Nếu MongoDB không có dữ liệu → Fallback sang vector search
- Sử dụng embeddings được tạo từ MongoDB trước đó

### 4. Static Fallback
- Cuối cùng mới sử dụng responses tĩnh

## 📈 Lợi ích của MongoDB-First Approach

### ✅ Ưu điểm:
- **Real-time Data**: Dữ liệu luôn cập nhật từ database
- **Dynamic**: Có thể thêm/sửa/xóa dữ liệu qua API hoặc admin panel
- **Scalable**: Dễ mở rộng với nhiều loại dữ liệu mới
- **Consistent**: Một nguồn dữ liệu duy nhất (single source of truth)
- **Performance**: Query database nhanh hơn đọc file

### 🎯 Use Cases phù hợp:
- Hệ thống cần cập nhật dữ liệu thường xuyên
- Nhiều người dùng đồng thời
- Cần quản lý dữ liệu qua admin interface
- Tích hợp với các hệ thống khác

## 🔧 API Endpoints

### Chatbot Core
```bash
# Hỏi chatbot (MongoDB-first)
POST /chatbot/ask
{
  "question": "Học phí ngành AI là bao nhiêu?"
}
```

### System Monitoring
```bash
# Kiểm tra trạng thái hệ thống
GET /chatbot/system/status

# Thống kê dữ liệu MongoDB
GET /chatbot/system/data-stats

# Health check toàn diện
GET /chatbot/system/health-check
```

## 🚨 Troubleshooting

### MongoDB Issues

```bash
# Kiểm tra MongoDB connection
mongosh --eval "db.adminCommand('ping')"

# Kiểm tra collections
mongosh swd_db --eval "show collections"

# Kiểm tra dữ liệu
mongosh swd_db --eval "db.majors.countDocuments()"
```

### Nếu cần cập nhật vector database:
```bash
# Re-ingest embeddings từ dữ liệu có sẵn trong MongoDB
pnpm run ingest:mongodb

# Lưu ý: Không cần seed vì MongoDB đã có dữ liệu
```

### Vector Database Issues:
```bash
# Test Pinecone connection
curl -X GET https://api.pinecone.io/indexes \
  -H "Api-Key: YOUR_API_KEY"

# Check system status
curl http://localhost:3000/chatbot/system/status
```

## 📝 Sử dụng với MongoDB có sẵn dữ liệu

Vì MongoDB đã có dữ liệu sẵn, quá trình setup rất đơn giản:

1. **Kiểm tra dữ liệu** đã có trong MongoDB (collections: campuses, majors, tuitionfees, scholarships)
2. **Chạy ingest** để tạo embeddings từ dữ liệu có sẵn:
   ```bash
   pnpm run ingest:mongodb
   ```
3. **Khởi động chatbot**:
   ```bash
   pnpm run start:dev
   ```  
4. **Test chatbot** để đảm bảo hoạt động đúng

## 💡 Best Practices

1. **Kiểm tra MongoDB có dữ liệu** trước khi ingest
2. **Re-ingest khi có dữ liệu mới** trong MongoDB  
3. **Monitor logs** để kiểm tra source của responses
4. **Backup MongoDB** định kỳ
5. **Update embeddings** khi có thay đổi lớn về dữ liệu
6. **Không cần seed** vì MongoDB đã có dữ liệu sẵn

## 🎯 Next Steps

- [ ] Admin panel để quản lý dữ liệu MongoDB
- [ ] API endpoints để CRUD dữ liệu
- [ ] Auto re-ingest khi có thay đổi dữ liệu
- [ ] Advanced analytics và metrics
- [ ] Multi-language support

---

**🎉 Chúc mừng! Bạn đã hoàn thành migration sang MongoDB-exclusive chatbot!** 