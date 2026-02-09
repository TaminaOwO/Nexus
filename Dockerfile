# ===========================================
# Nexus Production Dockerfile
# Multi-stage build: Frontend + Backend
# ===========================================

# Stage 1: Build Frontend (React/Vite)
FROM node:22-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source files
COPY . .

# Build the React app
RUN npm run build

# Stage 2: Build Backend (Go)
FROM golang:1.25-alpine AS backend-builder

WORKDIR /app

# Copy Go files
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build the Go binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o server ./cmd/server

# Stage 3: Final Production Image
FROM alpine:3.21

WORKDIR /app

# Install ca-certificates for HTTPS requests + tzdata for timezone support
RUN apk --no-cache add ca-certificates tzdata

# Create data directory for future database persistence
RUN mkdir -p /app/data

# Copy the Go binary from backend builder
COPY --from=backend-builder /app/server .

# Copy the React build from frontend builder
COPY --from=frontend-builder /app/dist ./dist

# Environment variables
ENV GIN_MODE=release
ENV DATABASE_PATH=/app/data/nexus.db

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/kite/ping || exit 1

# Run the server
CMD ["./server"]
