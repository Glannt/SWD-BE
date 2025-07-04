# Stage 1: Build dependencies and app
FROM node:22-alpine AS builder
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only package files for install
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (dev + prod)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build app
RUN pnpm build

# Stage 2: Production image
FROM node:22-alpine AS production
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only package files and install only production deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copy built app and necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/ai_tag_sessions.py ./ai_tag_sessions.py

# Install Python 3 and pip for ai_tag_sessions.py
RUN apk add --no-cache python3 py3-pip && \
    ln -sf python3 /usr/bin/python && \
    pip install --break-system-packages requests python-dotenv google-generativeai

# Expose port
EXPOSE 3000

# Default command
CMD ["node", "dist/main"]
