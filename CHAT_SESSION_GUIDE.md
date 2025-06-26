# Chat Session Management Guide

## Tổng quan

Hệ thống chat session management tự động tạo và quản lý các phiên chat, lưu trữ lịch sử câu hỏi và câu trả lời cho từng người dùng.

## Tính năng chính

### 1. **Tự động tạo session**

- Khi client không gửi `sessionId`, hệ thống tự động tạo session mới
- Mỗi session có ID duy nhất (UUID)
- Hỗ trợ cả user đã đăng nhập và anonymous user

### 2. **Lưu trữ messages**

- Tự động lưu câu hỏi của user vào `ChatMessage` entity
- Tự động lưu câu trả lời của bot vào `ChatMessage` entity
- Mỗi message có thông tin: sender, content, intent, confidence

### 3. **Quản lý session**

- Theo dõi trạng thái session (active/closed)
- Cập nhật thời gian hoạt động cuối cùng
- Hỗ trợ đóng session

## API Endpoints

### 1. **Chat với AI (có session management)**

```http
POST /chatbot/ask
```

**Request Body:**

```json
{
  "question": "Học phí ngành Kỹ thuật phần mềm là bao nhiêu?",
  "sessionId": "optional-session-id",
  "userId": "optional-user-id",
  "anonymousId": "optional-anonymous-id"
}
```

**Response:**

```json
{
  "answer": "Câu trả lời từ AI...",
  "sessionId": "uuid-session-id",
  "messageId": "uuid-message-id"
}
```

### 2. **Tạo session mới**

```http
POST /chatsession/create
```

**Request Body:**

```json
{
  "userId": "optional-user-id",
  "anonymousId": "optional-anonymous-id"
}
```

### 3. **Lấy thông tin session**

```http
GET /chatsession/{sessionId}
```

### 4. **Lấy messages của session**

```http
GET /chatsession/{sessionId}/messages
```

### 5. **Thêm message vào session**

```http
POST /chatsession/{sessionId}/messages
```

**Request Body:**

```json
{
  "sender": "user|bot|staff",
  "content": "Nội dung message",
  "intent": "optional-intent",
  "confidence": 0.95
}
```

### 6. **Đóng session**

```http
POST /chatsession/{sessionId}/close
```

### 7. **Lấy sessions của user**

```http
GET /chatsession/user/{userId}
```

### 8. **Lấy sessions của anonymous user**

```http
GET /chatsession/anonymous/{anonymousId}
```

## Cách sử dụng

### **Scenario 1: User mới (không có sessionId)**

```javascript
// Client gửi request không có sessionId
const response = await fetch('/chatbot/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: 'Xin chào, tôi muốn tìm hiểu về ngành Kỹ thuật phần mềm',
  }),
});

const result = await response.json();
// result.sessionId sẽ chứa ID session mới được tạo
// Lưu sessionId này để sử dụng cho các câu hỏi tiếp theo
```

### **Scenario 2: User đã có sessionId**

```javascript
// Client gửi request với sessionId đã có
const response = await fetch('/chatbot/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: 'Học phí ngành này là bao nhiêu?',
    sessionId: 'existing-session-id',
  }),
});
```

### **Scenario 3: User đã đăng nhập**

```javascript
// Client gửi request với userId
const response = await fetch('/chatbot/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: 'Tôi muốn biết thêm về cơ hội nghề nghiệp',
    sessionId: 'existing-session-id',
    userId: 'user123',
  }),
});
```

## Database Schema

### **ChatSession Entity**

```typescript
{
  sessionID: string;        // UUID unique
  user?: ObjectId;          // Reference to User (optional)
  anonymousID?: string;     // For anonymous users
  status: 'active' | 'closed';
  startedAt: Date;          // Auto-generated
  lastActivity: Date;       // Auto-updated
}
```

### **ChatMessage Entity**

```typescript
{
  session: string;          // Reference to sessionID
  sender: 'user' | 'bot' | 'staff';
  content: string;
  intent?: string;
  confidence?: number;
  createdAt: Date;          // Auto-generated
}
```

## Lưu ý quan trọng

1. **Session tự động**: Nếu không có `sessionId`, hệ thống tự động tạo session mới
2. **Lưu trữ messages**: Tất cả câu hỏi và câu trả lời đều được lưu vào database
3. **Performance**: Session được index để tìm kiếm nhanh
4. **Security**: Có thể thêm authentication cho các endpoint sensitive
5. **Backward compatibility**: Endpoint cũ `/chatbot/ask-legacy` vẫn hoạt động

## Migration từ hệ thống cũ

Nếu bạn đang sử dụng endpoint cũ, chỉ cần:

1. Thay đổi response handling để nhận thêm `sessionId` và `messageId`
2. Lưu `sessionId` và gửi lại trong các request tiếp theo
3. Hoặc tiếp tục sử dụng `/chatbot/ask-legacy` nếu không cần session management
