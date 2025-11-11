# 🎭 TalkMateAI

[![GitHub stars](https://img.shields.io/badge/github-govindrajawat-blue)](https://github.com/govindrajawat)

**Real-time Voice-Controlled 3D Avatar with Multimodal AI**

> Your 3D AI companion that never stops listening, never stops caring. 

> Transform conversations into immersive experiences with AI-powered 3D avatars that see, hear, and respond naturally.


### 🎯 **Core Capabilities**
- **🎤 Real-time Voice Activity Detection** - Advanced VAD with configurable sensitivity
- **🗣️ Speech-to-Text** - Powered by OpenAI Whisper (tiny model) for instant transcription
- **👁️ Vision Understanding** - SmolVLM2-256M-Video-Instruct for multimodal comprehension
- **🔊 Natural Text-to-Speech** - Kokoro TTS with native word-level timing
- **🎭 3D Avatar Animation** - Lip-sync and emotion-driven animations using [TalkingHead](https://github.com/met4citizen/TalkingHead)

### 🚀 **Advanced Features**
- **📹 Camera Integration** - Real-time image capture with voice commands
- **⚡ Streaming Responses** - Chunked audio generation for minimal latency
- **🎬 Native Timing Sync** - Perfect lip-sync using Kokoro's native timing data
- **🎨 Draggable Camera View** - Floating, resizable camera interface
- **📊 Real-time Analytics** - Voice energy visualization and transmission tracking
- **🔄 WebSocket Communication** - Low-latency bidirectional data flow

## 🏗️ Architecture
![System Architecture](./images/architecture.svg)


## 🛠️ Technology Stack

### Backend (Python)
- **🧠 AI Models from HuggingFace🤗:**
  - `openai/whisper-tiny` - Speech recognition
  - `HuggingFaceTB/SmolVLM2-256M-Video-Instruct` - Vision-language understanding
  - `Kokoro TTS` - High-quality voice synthesis
- **⚡ Framework:** FastAPI with WebSocket support
- **🔧 Processing:** PyTorch, Transformers, Flash Attention 2
- **🎵 Audio:** SoundFile, NumPy for real-time processing

### Frontend (TypeScript/React)
- **🖼️ Framework:** Next.js 15 with TypeScript
- **🎨 UI:** Tailwind CSS + shadcn/ui components
- **🎭 3D Rendering:** [TalkingHead](https://github.com/met4citizen/TalkingHead) library
- **🎙️ Audio:** Web Audio API with AudioWorklet
- **📡 Communication:** Native WebSocket with React Context

### 🔧 **Development Tools**
- **📦 Package Management:** UV (Python) + PNPM (Node.js)
- **🎨 Code Formatting:** 
  - **Backend:** Black (Python)
  - **Frontend:** Prettier (TypeScript/React)
- **🔍 Quality Control:** Husky for pre-commit hooks

## 📋 Requirements

### System Tested on
- **OS:** Windows 11 (Linux/macOS support coming soon, will create a docker image)
- **GPU:** NVIDIA RTX 3070 (8GB VRAM)

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 20+
- PNPM
- Python 3.10
- UV (Python package manager)


### 2. **Setup monorepo dependencies from root**
```bash
# will setup both frontend and backend but require the prerequisites
pnpm run monorepo-setup
```

# TalkMateAI

A simple local demo that connects a Next.js frontend to a FastAPI backend for realtime, voice-controlled 3D avatar interactions. This repository contains a monorepo with the frontend app in `apps/client` and the backend server in `apps/server`.

Owner: Govind Rajawat — https://github.com/govindrajawat

Quick, minimal instructions are below so you can run the app locally with Docker. For development you can still run the frontend and backend separately using `pnpm` and `uv`.

## Quick Start (Docker)

These steps run both frontend and backend in Docker containers. This is the simplest way to get the app running locally.

1) Build images:

```powershell
docker-compose build
```

2) Start services:

```powershell
docker-compose up -d
```

3) Open the app:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

Stop services:

```powershell
docker-compose down
```

## Prerequisites (only if you run locally without Docker)

- Node.js 20+
- pnpm
- Python 3.10
- uv (Python runner)

## Notes & Requirements

- The backend uses PyTorch with CUDA (tested with CUDA 12.4 and an NVIDIA RTX 3070). To use GPU acceleration in Docker, ensure the NVIDIA Container Toolkit is installed.
- The first run will download model files (Whisper, SmolVLM2, Kokoro). Expect several gigabytes of downloads and allow time for the initial setup.
- Models and caches are stored in a Docker volume named `huggingface-cache` and will be reused between runs.

Estimated initial download size: ~12–16 GB (Docker base images, Python packages, and model files). Allow ~30–60 minutes on a typical broadband connection for the first build.

## Development (optional)

Frontend (dev):

```bash
cd apps/client
pnpm install
pnpm dev
```

Backend (dev):

```bash
cd apps/server
# Ensure uv/uvicorn is installed and configured
pnpm --filter @talkmateai/server exec uv sync  # (or follow server README)
uv run uvicorn main:app --reload
```

## Project layout

- apps/client — Next.js frontend (TypeScript)
- apps/server — FastAPI backend (Python)
- Dockerfile, Dockerfile.backend, Dockerfile.frontend — build targets
- docker-compose.yml — compose file for local dev with GPU volume

## Contact & Source

Repo: https://github.com/govindrajawat

Made with ❤️ by Govind Rajawat
