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
- **🔧 Processing:** PyTorch (CPU/GPU), Transformers, SDPA attention (CPU) / Flash Attention 2 (GPU)
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

### System Requirements
- **OS:** Linux (Ubuntu 24.04 recommended), Windows 11, macOS
- **CPU:** Multi-core processor recommended (GPU optional, CPU-only deployment supported)
- **RAM:** 8GB minimum, 16GB recommended
- **Storage:** 20GB+ free space for models and dependencies

## 🚀 Quick Start

### Option 1: Docker (Recommended)

The easiest way to run the application. Works on Linux, Windows, and macOS.

**Prerequisites:**
- Docker and Docker Compose installed

**Steps:**

1. Build and start services:
```bash
docker-compose up -d --build
```

2. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Health Check: http://localhost:8000/health

3. View logs:
```bash
docker-compose logs -f
```

4. Stop services:
```bash
docker-compose down
```

**Note:** The Docker setup is configured for CPU-only deployment. No GPU or NVIDIA Container Toolkit is required. The application automatically detects CPU-only mode and configures itself accordingly.

### Option 2: Local Development

For development without Docker, you'll need the following prerequisites:

- Node.js 20+
- PNPM
- Python 3.10
- UV (Python package manager)

**Setup monorepo dependencies from root:**
```bash
pnpm run monorepo-setup
```

Then run the frontend and backend separately:

**Frontend:**
```bash
cd apps/client
pnpm install
pnpm dev
```

**Backend:**
```bash
cd apps/server
uv sync
uv run uvicorn main:app --reload
```

## Notes & Requirements

- **CPU Deployment:** The application is configured for CPU-only deployment by default. All Docker images use standard Ubuntu base images without GPU dependencies.
- **GPU Support:** If you have an NVIDIA GPU and want to use it, you'll need to modify the Dockerfiles to use CUDA base images and install the NVIDIA Container Toolkit. The code automatically detects and uses GPU when available.
- **Model Downloads:** The first run will download model files (Whisper, SmolVLM2, Kokoro). Expect several gigabytes of downloads and allow time for the initial setup.
- **Caching:** Models and caches are stored in a Docker volume named `huggingface-cache` and will be reused between runs.
- **Performance:** CPU-only mode will be slower than GPU-accelerated mode, but fully functional. For best performance, consider using a GPU-enabled server.

Estimated initial download size: ~12–16 GB (Docker base images, Python packages, and model files). Allow ~30–60 minutes on a typical broadband connection for the first build.

## Project layout

- apps/client — Next.js frontend (TypeScript)
- apps/server — FastAPI backend (Python)
- Dockerfile, Dockerfile.backend, Dockerfile.frontend — build targets
- docker-compose.yml — compose file for local development with model caching

## Contact & Source

Repo: https://github.com/govindrajawat

Made with ❤️ by Govind Rajawat
