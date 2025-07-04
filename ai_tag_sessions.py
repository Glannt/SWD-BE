# AI Tag Sessions Script
# Đọc cấu hình từ biến môi trường để dễ deploy/Docker
# Ví dụ chạy:
#   BACKEND_API=http://backend:3000/api/v1/admin/dashboard/sessions-messages \
#   UPDATE_TAG_API=http://backend:3000/api/v1/admin/dashboard/update-session-tag \
#   GEMINI_API_KEY=xxx \
#   python ai_tag_sessions.py
#
# Khi dùng Docker Compose, thêm vào phần environment:
#   - BACKEND_API=...
#   - UPDATE_TAG_API=...
#   - GEMINI_API_KEY=...

import requests
import google.generativeai as genai
import time
import os
from dotenv import load_dotenv
import sys

# ==== CONFIG ====
load_dotenv(dotenv_path=".env")
BACKEND_API = os.getenv("BACKEND_API", "http://localhost:3000/api/v1/admin/dashboard/sessions-messages")  # Sửa lại nếu backend chạy port khác
UPDATE_TAG_API = os.getenv("UPDATE_TAG_API", "http://localhost:3000/api/v1/admin/dashboard/update-session-tag")  # API cập nhật tag
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDDE3qZQpFeI60H51ivhX8Y54q1oaU3O3Q")  # <-- Đặt API key Gemini tại đây
FEW_SHOT_EXAMPLES = [
    {
        "text": "User: Em muốn tìm hiểu học phí ngành CNTT\nBot: Học phí ngành CNTT là ...",
        "tag": "tiềm năng"
    },
    {
        "text": "User: Học phí bao nhiêu vậy, giỡn thôi chứ em không học đâu\nBot: ...",
        "tag": "giỡn"
    },
    # Thêm ví dụ mẫu nếu muốn few-shot
]

# ==== INIT GEMINI ====
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def build_prompt(messages, examples=None):
    prompt = "Dưới đây là nội dung một phiên chat giữa user và chatbot. Hãy phân loại phiên chat này vào một trong các nhóm: 'tiềm năng', 'không tiềm năng', 'giỡn', 'khác'.\n"
    if examples:
        prompt += "Ví dụ:\n"
        for ex in examples:
            prompt += f"---\nHội thoại:\n{ex['text']}\nTag: {ex['tag']}\n"
    prompt += "---\nHội thoại:\n"
    for m in messages:
        prompt += f"{m['sender']}: {m['content']}\n"
    prompt += "Tag:"
    return prompt

def classify_session(messages, examples=None):
    prompt = build_prompt(messages, examples)
    response = model.generate_content(prompt)
    tag = response.text.strip().split('\n')[0].lower()
    tag = tag.replace("tag:", "").strip()
    return tag

def update_tag(session_id, tag):
    payload = {"sessionId": session_id, "tag": tag}
    try:
        res = requests.post(UPDATE_TAG_API, json=payload)
        if res.status_code == 200:
            print(f"    [OK] Updated tag for session {session_id}")
        else:
            print(f"    [FAIL] Update tag for session {session_id}: {res.text}")
    except Exception as e:
        print(f"    [ERROR] Exception updating tag: {e}")

def main():
    print("Fetching session data from backend...")
    res = requests.get(BACKEND_API)
    res.raise_for_status()
    raw = res.json()
    # Nếu response có key 'data', lấy data = raw['data'], nếu không thì lấy raw
    if isinstance(raw, dict) and 'data' in raw:
        data = raw['data']
    else:
        data = raw
    print(f"[DEBUG] Số user: {len(data)}")
    for user in data:
        if not isinstance(user, dict) or 'email' not in user:
            print(f"[DEBUG] user object không hợp lệ: {user}")
            continue
        print(f"\nUser: {user['email']} ({user['user_id']})")
        for session in user['sessions']:
            print(f"  Session: {session['sessionId']}")
            messages = session['messages']
            if not messages:
                print("    (No messages, skip)")
                continue
            tag = classify_session(messages, FEW_SHOT_EXAMPLES)
            print(f"    -> Tag: {tag}")
            update_tag(session['sessionId'], tag)
            time.sleep(1)  # Tránh spam API Gemini

if __name__ == "__main__":
    main()
