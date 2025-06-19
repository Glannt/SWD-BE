# 🔍 Troubleshooting: Chatbot trả về "Not Found"

## 🎯 Nguyên nhân có thể

Khi chatbot trả về "Not Found" thay vì câu trả lời hữu ích, có thể do:

1. **MongoDB không có dữ liệu**
2. **Vector search không tìm thấy kết quả**
3. **Logic fallback không được trigger**
4. **API keys không đúng hoặc hết quota**

## 🔧 Các bước debug

### Bước 1: Kiểm tra trạng thái hệ thống

```bash
# Kiểm tra server đang chạy
curl http://localhost:3000/chatbot/system/status

# Kết quả mong muốn:
# {
#   "status": "healthy",
#   "services": {
#     "mongodb": {"status": "healthy"},
#     "pinecone": {"status": "healthy"}, 
#     "gemini": {"status": "healthy"}
#   }
# }
```

### Bước 2: Kiểm tra dữ liệu MongoDB

```bash
# Xem thống kê dữ liệu
curl http://localhost:3000/chatbot/system/data-stats

# Nếu tất cả đều = 0, cần seed dữ liệu:
pnpm run seed:mongodb
```

### Bước 3: Debug câu hỏi cụ thể

```bash
# Debug câu hỏi "Ngành kỹ thuật phần mềm"
curl "http://localhost:3000/chatbot/system/debug/Ngành%20kỹ%20thuật%20phần%20mềm"

# Kiểm tra từng bước:
# - step1_embeddings: success/error
# - step2_vectorSearch: có kết quả không
# - step3_mongoQuery: triggered không
# - step4_fallback: có trigger không
```

### Bước 4: Health check toàn diện

```bash
curl http://localhost:3000/chatbot/system/health-check
```

## 🚀 Giải pháp từng trường hợp

### Case 1: MongoDB không có dữ liệu

```bash
# Seed dữ liệu từ JSON file
pnpm run seed:mongodb

# Ingest vào vector database
pnpm run ingest:mongodb

# Restart server
pnpm start:dev
```

### Case 2: Pinecone không có vectors

```bash
# Chỉ ingest vào Pinecone
pnpm run ingest:json

# Hoặc ingest từ cả MongoDB và JSON
pnpm run ingest:both
```

### Case 3: API keys sai

Kiểm tra file `.env`:
```bash
# Gemini API Key
GEMINI_API_KEY=AIzaSyBxHKg6EIKdQeLRa0sPEQNdvc2GDR5duaE

# Pinecone API Key  
PINECONE_API_KEY=pcsk_7ACs6N_L5KeAoJhycf6J67t7VkKiukQNQPg8kaF48FS1dVFjswwwUMfg25ETYSKJdroLLw
PINECONE_INDEX_NAME=fpt-university-768d

# MongoDB URI
MONGODB_URI=mongodb://localhost:27017/swd_db
```

### Case 4: Logic fallback không trigger

Cập nhật `getFallbackAnswer()` trong `ask.service.ts` để add thêm từ khóa:

```typescript
if (lowerQuestion.includes('ngành') || lowerQuestion.includes('kỹ thuật') || 
    lowerQuestion.includes('phần mềm') || lowerQuestion.includes('software')) {
  // Return fallback response
}
```

## 🧪 Test script tự động

```bash
# Chạy integration test
pnpm run test:integration

# Script sẽ test:
# - System status
# - MongoDB data
# - Debug endpoint
# - Actual chatbot questions
```

## 📊 Monitoring logs

Khi chatbot xử lý câu hỏi, check console logs:

```
🤖 Nhận được câu hỏi: Ngành kỹ thuật phần mềm
📝 Đang tạo embedding cho câu hỏi...
🔍 Đang tìm kiếm thông tin liên quan trong cơ sở dữ liệu vector...
⚠️ Không tìm thấy thông tin liên quan trong vector database
🔄 Fallback: Tìm kiếm trực tiếp trong MongoDB...
🔍 Analyzing question for MongoDB context: "ngành kỹ thuật phần mềm"
🎓 Searching for major information...
🔍 Found keyword: "phần mềm"
✅ Found major: Kỹ thuật phần mềm (SE)
```

## 🎯 Quick Fix Commands

```bash
# 1. Seed + Ingest + Start (toàn bộ setup)
pnpm run seed:mongodb && pnpm run ingest:mongodb && pnpm start:dev

# 2. Chỉ test xem có hoạt động không
curl -X POST http://localhost:3000/chatbot/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Ngành kỹ thuật phần mềm"}'

# 3. Debug nhanh
curl "http://localhost:3000/chatbot/system/debug/test"
```

## 📝 Expected Behavior

**Trước khi fix:**
```
❌ "Not Found"
```

**Sau khi fix:**
```
✅ "🎓 Thông tin các ngành đào tạo tại FPT University:

🔧 Kỹ thuật phần mềm (SE):
- Đào tạo kỹ sư phần mềm chuyên nghiệp
- Kỹ năng: Lập trình, thiết kế hệ thống, quản lý dự án
- Cơ hội nghề nghiệp: Developer, Team Leader, Solution Architect
- Thời gian: 4 năm, 144 tín chỉ
- Học phí: ~20.500.000 VND/học kỳ"
```

## 🔄 Workflow Fix

1. **Check**: `GET /chatbot/system/status`
2. **Seed**: `pnpm run seed:mongodb` (nếu cần)
3. **Ingest**: `pnpm run ingest:mongodb`
4. **Test**: `POST /chatbot/ask`
5. **Debug**: `GET /chatbot/system/debug/question` (nếu vẫn lỗi)

---

💡 **Tip**: Luôn chạy `pnpm run test:integration` sau khi fix để đảm bảo tất cả hoạt động ổn định! 