'use client';

import { useState } from 'react';
import VoiceActivityDetector from '@/components/VoiceActivityDetector';
import TalkingHead from '@/components/TalkingHead';
import { CameraToggleButton } from '@/components/CameraStream';

export default function Home() {
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3">
            <h1 className="mb-2 text-4xl font-bold text-gray-900">TalkMateAI</h1>
            <a
              href="https://github.com/govindrajawat"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-md bg-gray-800 px-3 py-1 text-sm font-medium text-white hover:bg-gray-700"
            >
              GitHub
            </a>
          </div>
          <p className="text-lg text-gray-600">
            Voice-controlled avatar with real-time responses
          </p>
        </div>

        {/* Main Content Layout */}
        <div className="mb-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
          {/* TalkingHead Component */}
          <div className="order-1">
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <TalkingHead cameraStream={cameraStream} />
            </div>
          </div>

          {/* Voice Activity Detector */}
          <div className="order-2">
            <VoiceActivityDetector cameraStream={cameraStream} />
          </div>
        </div>
      </div>

      {/* Floating Camera Component */}
      <CameraToggleButton onStreamChange={setCameraStream} />
    </main>
  );
}
