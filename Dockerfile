# Multi-stage Dockerfile for TalkMateAI
# Builds both Frontend (Next.js) and Backend (FastAPI)

# ============================================================================
# Stage 1: Python Backend Builder
# ============================================================================
FROM nvidia/cuda:12.4.0-devel-ubuntu24.04 AS backend-builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.10 \
    python3.10-venv \
    python3.10-dev \
    build-essential \
    git \
    libsndfile1 \
    libsndfile1-dev \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install UV (Python package manager)
RUN pip install --upgrade pip && \
    pip install uv

WORKDIR /app

# Copy pyproject.toml and related files
COPY apps/server/pyproject.toml apps/server/README.md ./server/

# Create virtual environment and install Python dependencies
RUN cd server && \
    uv sync --python python3.10

# ============================================================================
# Stage 2: Node.js Frontend Builder
# ============================================================================
FROM node:20-alpine AS frontend-builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy client app
COPY apps/client ./apps/client

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build Next.js application
RUN cd apps/client && pnpm build

# ============================================================================
# Stage 3: Runtime Backend
# ============================================================================
FROM nvidia/cuda:12.4.0-runtime-ubuntu24.04 AS backend-runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/server/.venv/bin:$PATH" \
    PYTHONPATH="/app/server:$PYTHONPATH"

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.10 \
    libsndfile1 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy virtual environment from builder
COPY --from=backend-builder /app/server/.venv ./server/.venv

# Copy server application code
COPY apps/server ./server

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose backend port
EXPOSE 8000

# Run FastAPI backend
CMD ["sh", "-c", "cd /app/server && uv run uvicorn main:app --host 0.0.0.0 --port 8000"]

# ============================================================================
# Stage 4: Runtime Frontend
# ============================================================================
FROM node:20-alpine AS frontend-runtime

ENV NODE_ENV=production

WORKDIR /app

# Copy built Next.js app from builder
COPY --from=frontend-builder /app/apps/client/.next ./apps/client/.next
COPY --from=frontend-builder /app/apps/client/public ./apps/client/public
COPY --from=frontend-builder /app/apps/client/package.json ./apps/client/package.json
COPY --from=frontend-builder /app/apps/client/node_modules ./apps/client/node_modules

# Copy workspace files for server reference
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Expose frontend port
EXPOSE 3000

# Start Next.js in production mode
CMD ["sh", "-c", "cd /app/apps/client && npm start"]

# ============================================================================
# Stage 5: Combined Runtime (Optional - for single container deployment)
# ============================================================================
FROM nvidia/cuda:12.4.0-runtime-ubuntu24.04 AS production

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    NODE_ENV=production \
    PATH="/app/server/.venv/bin:/usr/local/bin:$PATH" \
    PYTHONPATH="/app/server:$PYTHONPATH"

# Install system dependencies for both Python and Node
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.10 \
    nodejs \
    npm \
    libsndfile1 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app

# Copy Python environment from backend builder
COPY --from=backend-builder /app/server/.venv ./server/.venv

# Copy server code
COPY apps/server ./server

# Copy frontend built assets
COPY --from=frontend-builder /app/apps/client/.next ./apps/client/.next
COPY --from=frontend-builder /app/apps/client/public ./apps/client/public
COPY --from=frontend-builder /app/apps/client/package.json ./apps/client/package.json
COPY --from=frontend-builder /app/apps/client/node_modules ./apps/client/node_modules

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Health checks
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 3000 8000

# Start both services with a simple shell script
CMD ["sh", "-c", "cd /app/server && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 & cd /app/apps/client && npm start"]
