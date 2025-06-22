# 🌱 Auto-Seed System Documentation

## 📋 Tổng quan

Hệ thống Auto-Seed được thiết kế để tự động kiểm tra và khởi tạo dữ liệu cho MongoDB khi khởi động ứng dụng. Điều này đảm bảo rằng khi bạn chia sẻ codebase cho người khác, họ có thể chạy ngay lập tức mà không cần setup dữ liệu thủ công.

## 🚀 Cách hoạt động

### 1. Tự động khi khởi động
Khi bạn chạy `pnpm run start:dev`, hệ thống sẽ:

```bash
🔍 Checking database data availability...
📦 Database is empty or incomplete. Starting auto-seed process...
📄 Seeding Campuses...
✅ Campuses seeded successfully
📄 Seeding Majors...
✅ Majors seeded successfully
...
✅ Auto-seed completed successfully!
```

### 2. Logic kiểm tra thông minh
- Chỉ seed khi **thực sự cần thiết** (database trống hoặc thiếu dữ liệu quan trọng)
- Kiểm tra các collection chính: `campuses`, `majors`, `scholarships`
- Nếu đã có dữ liệu, bỏ qua quá trình seed

### 3. Nguồn dữ liệu
Tất cả dữ liệu được lấy từ thư mục `documents/`:
- `FchatCareer.campuses.json` → Collection `campuses`
- `FchatCareer.majors.json` → Collection `majors`
- `FchatCareer.scholarships.json` → Collection `scholarships`
- `FchatCareer.tuitionFees.json` → Collection `tuitionfees`
- ... và các file khác

## 📊 API Endpoints

### Kiểm tra trạng thái seed
```http
GET /system/data-seed/status
```

### Seed thủ công
```http
POST /system/data-seed/seed
```

### Xem các file JSON có sẵn
```http
GET /system/data-seed/files
```

## 🔧 Configuration

### Environment Variables cần thiết:
```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/FchatCareer
```

## 💡 Features chính

### ✅ Intelligent Detection
- Chỉ seed khi cần thiết
- Kiểm tra multiple collections
- Graceful error handling

### ✅ Comprehensive Coverage
- Supports tất cả entities: Campus, Major, Scholarship, TuitionFee, etc.
- Xử lý entity relationships (Foreign Keys)
- Mapping IDs tự động

### ✅ Production Ready
- Non-blocking startup (app vẫn chạy nếu seed fails)
- Detailed logging
- Error recovery

### ✅ Developer Friendly
- API endpoints để monitor và control
- Clear status messages
- Manual seed capability

## 🛠️ Troubleshooting

### Problem: Seed fails với lỗi "File not found"
**Solution:** Đảm bảo file JSON exists trong thư mục `documents/`

### Problem: Reference errors trong TuitionFees
**Solution:** Đảm bảo các collection `majors` và `intakebatches` được seed trước

### Problem: Duplicate key errors
**Solution:** Collection đã có dữ liệu. Xóa collection hoặc sử dụng `upsert` logic

## 🔄 Workflow Integration

### Development
```bash
# Clean start
pnpm run start:dev
# System tự động check và seed nếu cần
```

---

**🎉 Happy Coding!** Hệ thống Auto-Seed giúp bạn chia sẻ codebase dễ dàng và setup nhanh chóng cho team members mới. 