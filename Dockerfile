FROM ubuntu:24.04 AS backend-builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.10 \
    python3.10-venv \
    python3.10-dev \
    python3-pip \
    build-essential \
    git \
    libsndfile1 \
    libsndfile1-dev \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --upgrade pip && \
    pip3 install uv

WORKDIR /app

COPY apps/server/pyproject.toml apps/server/uv.lock apps/server/README.md ./server/

RUN cd server && \
    uv sync --python python3.10

FROM node:20-alpine AS frontend-builder

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY apps/client ./apps/client

RUN pnpm install --frozen-lockfile

RUN cd apps/client && pnpm build

FROM ubuntu:24.04 AS backend-runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/server/.venv/bin:$PATH" \
    PYTHONPATH="/app/server:$PYTHONPATH"

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.10 \
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

CMD ["sh", "-c", "cd /app/server && uv run uvicorn main:app --host 0.0.0.0 --port 8000"]

FROM node:20-alpine AS frontend-runtime

ENV NODE_ENV=production

RUN apk add --no-cache wget

WORKDIR /app

COPY --from=frontend-builder /app/apps/client/.next ./apps/client/.next
COPY --from=frontend-builder /app/apps/client/public ./apps/client/public
COPY --from=frontend-builder /app/apps/client/package.json ./apps/client/package.json
COPY --from=frontend-builder /app/apps/client/node_modules ./apps/client/node_modules

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

EXPOSE 3000

CMD ["sh", "-c", "cd /app/apps/client && npm start"]

FROM ubuntu:24.04 AS production

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    NODE_ENV=production \
    PATH="/app/server/.venv/bin:/usr/local/bin:$PATH" \
    PYTHONPATH="/app/server:$PYTHONPATH"

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.10 \
    python3-pip \
    nodejs \
    npm \
    libsndfile1 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install uv && \
    npm install -g pnpm

WORKDIR /app

COPY --from=backend-builder /app/server/.venv ./server/.venv

COPY apps/server ./server

COPY --from=frontend-builder /app/apps/client/.next ./apps/client/.next
COPY --from=frontend-builder /app/apps/client/public ./apps/client/public
COPY --from=frontend-builder /app/apps/client/package.json ./apps/client/package.json
COPY --from=frontend-builder /app/apps/client/node_modules ./apps/client/node_modules

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 3000 8000

CMD ["sh", "-c", "cd /app/server && uv run uvicorn main:app --host 0.0.0.0 --port 8000 & cd /app/apps/client && npm start"]
