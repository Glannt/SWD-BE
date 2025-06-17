# 🚀 FPT University Chatbot - Deployment Guide

## 📋 **OVERVIEW**

Hệ thống chatbot hỗ trợ **2 modes deployment**:
- **Simple Server:** Tối ưu cho development, frontend compatibility
- **NestJS Server:** Tối ưu cho production, full architecture

---

## ⚡ **QUICK START**

### **Kill & Restart (One Command)**
```bash
pnpm run restart
```

### **Development Mode (Recommended)**
```bash
pnpm run chatbot:dev
```

### **Production Mode**
```bash
pnpm run chatbot:prod
```

---

## 🎯 **DEPLOYMENT MODES**

### **1. Simple Server Mode**
```bash
# Start
pnpm run chatbot
# or
node start-chatbot.js simple
```

**✅ Pros:**
- Frontend compatible (`/ask` endpoint)
- Fast startup
- Simple debugging
- Direct environment variable handling

**📍 Endpoints:**
- `GET /` - Chat interface
- `POST /ask` - Chat API (frontend compatible)
- `GET /health` - Health check

---

### **2. NestJS Mode**
```bash
# Start
pnpm run chatbot:prod
# or  
node start-chatbot.js nestjs
```

**✅ Pros:**
- Production-ready architecture
- API documentation (Swagger)
- Validation & middleware
- Modular design
- Both `/ask` (compatibility) and `/api/chatbot/ask` (main)

**📍 Endpoints:**
- `GET /` - Chat interface
- `POST /ask` - Compatibility route
- `POST /api/chatbot/ask` - Main chatbot API
- `GET /health` - Health check
- `GET /api/docs` - Swagger documentation

---

## 🔧 **ENVIRONMENT CONFIGURATION**

### **Automatic Setup (Built-in)**
Script tự động set environment variables:
```javascript
GEMINI_API_KEY=AIzaSyBxHKg6EIKdQeLRa0sPEQNdvc2GDR5duaE
PINECONE_API_KEY=pcsk_7ACs6N_L5KeAoJhycf6J67t7VkKiukQNQPg8kaF48FS1dVFjswwwUMfg25ETYSKJdroLLw
PINECONE_INDEX_NAME=fpt-university-768d
PORT=3000
```

### **Manual Setup (If needed)**
```bash
# PowerShell
$env:GEMINI_API_KEY="AIzaSyBxHKg6EIKdQeLRa0sPEQNdvc2GDR5duaE"
$env:PINECONE_API_KEY="pcsk_7ACs6N_L5KeAoJhycf6J67t7VkKiukQNQPg8kaF48FS1dVFjswwwUMfg25ETYSKJdroLLw"
$env:PINECONE_INDEX_NAME="fpt-university-768d"
```

---

## 🌐 **FRONTEND INTEGRATION**

### **Current Frontend (No Changes Needed)**
Frontend gọi `/ask` sẽ hoạt động với **cả 2 modes**:

```javascript
// This works with both modes!
fetch('/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question: "Học phí FPT là bao nhiêu?" })
})
```

### **Advanced Frontend (Optional)**
```javascript
// For production NestJS
fetch('/api/chatbot/ask', {
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question: "Thông tin học bổng" })
})
```

---

## 🐳 **DOCKER DEPLOYMENT (Future)**

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "chatbot:prod"]
```

---

## 📊 **MONITORING**

### **Health Check**
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-06-17T08:50:00.000Z",
  "service": "FPT University Chatbot",
  "endpoints": {
    "chat": "/ask (compatibility)",
    "chatbot": "/api/chatbot/ask (main)",
    "docs": "/api/docs"
  }
}
```

### **Test Chat API**
```bash
curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"Xin chào"}'
```

---

## 🛠️ **USEFUL COMMANDS**

```bash
# Kill all Node processes
pnpm run kill

# Test configuration
pnpm run test-config  

# Import data to Pinecone
pnpm run ingest

# Build for production
pnpm run build

# Full deployment workflow
pnpm run deploy
```

---

## 🎯 **RECOMMENDED WORKFLOWS**

### **Development:**
1. `pnpm run restart` - Kill & start development server
2. Open: `http://localhost:3000`
3. Test chat interface

### **Production:**
1. `pnpm run kill` - Clean slate
2. `pnpm run chatbot:prod` - Start NestJS production
3. Monitor: `http://localhost:3000/health`
4. API docs: `http://localhost:3000/api/docs`

### **Deployment to Cloud:**
1. Set environment variables in cloud platform
2. `pnpm run build` 
3. `pnpm run chatbot:prod`
4. Configure reverse proxy/load balancer

---

## 🔥 **TROUBLESHOOTING**

### **Port 3000 Busy:**
```bash
pnpm run kill
```

### **Environment Variables Not Loading:**
Use the universal launcher script - it handles env vars automatically.

### **Frontend "Not Found" Error:**
- Simple Mode: ✅ Should work immediately
- NestJS Mode: ✅ Has compatibility route

### **Pinecone/Gemini API Errors:**
Check API keys in script or set manually with PowerShell commands above.

---

## 🚀 **QUICK COMMANDS CHEAT SHEET**

```bash
# Development (Frontend Compatible)
pnpm run chatbot

# Production (Full Features)  
pnpm run chatbot:prod

# Kill & Restart
pnpm run restart

# Health Check
curl http://localhost:3000/health

# Test Chat
curl -X POST http://localhost:3000/ask -H "Content-Type: application/json" -d '{"question":"Test"}'
```

---

**🎊 Ready for deployment! Choose your mode and launch! 🚀** 