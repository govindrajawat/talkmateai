FROM ubuntu:22.04 AS backend-builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-venv \
    python3-dev \
    python3-pip \
    git \
    libsndfile1 \
    libsndfile1-dev \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir --upgrade pip uv

WORKDIR /app

COPY apps/server/pyproject.toml apps/server/uv.lock ./server/

RUN cd server && \
    uv sync --python python3

FROM node:20-alpine AS frontend-builder

RUN npm install -g pnpm

WORKDIR /app

# Copy all package manifests first to leverage Docker cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/client/package.json ./apps/client/
COPY apps/server/package.json ./apps/server/

RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code and build the client app
COPY . .
RUN pnpm --filter @talkmateai/client build

FROM ubuntu:22.04 AS backend-runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/server/.venv/bin:$PATH" \
    PYTHONPATH="/app/server:$PYTHONPATH"

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    libsndfile1 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=backend-builder /app/server/.venv ./server/.venv

COPY apps/server ./server

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM node:20-alpine AS frontend-runtime

ENV NODE_ENV=production

RUN apk add --no-cache wget && npm install -g pnpm

WORKDIR /app

COPY --from=frontend-builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=frontend-builder /app/node_modules ./node_modules
COPY --from=frontend-builder /app/apps/client ./apps/client

COPY --from=frontend-builder /app/apps/client/.next ./apps/client/.next
COPY --from=frontend-builder /app/apps/client/public ./apps/client/public

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

EXPOSE 3000

CMD ["sh", "-c", "pnpm --filter @talkmateai/client start"]

FROM ubuntu:22.04 AS production

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    NODE_ENV=production \
    PATH="/app/server/.venv/bin:/usr/local/bin:$PATH" \
    PYTHONPATH="/app/server:$PYTHONPATH"
    
RUN apt-get update && apt-get install -y --no-install-recommends curl libsndfile1 ffmpeg nodejs npm && \
    npm install -g pnpm && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend from its runtime stage
COPY --from=backend-builder /app/server/.venv ./server/.venv
COPY apps/server ./server

# Copy frontend from its builder stage
COPY --from=frontend-builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=frontend-builder /app/node_modules ./node_modules
COPY --from=frontend-builder /app/apps/client ./apps/client

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 3000 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port 8000 & pnpm --filter @talkmateai/client start"]
