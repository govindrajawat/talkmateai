'use client';

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo
} from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWebSocketContext } from '@/contexts/WebSocketContext';

interface VoiceVisualizerProps {
  className?: string;
  cameraStream?: MediaStream | null;
}

const StatusIndicator: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig: { [key: string]: { color: string; text: string } } =
    useMemo(
      () => ({
        idle: { color: 'bg-gray-400', text: 'Idle' },
        listening: { color: 'bg-green-500', text: 'Listening' },
        recording: { color: 'bg-red-500', text: 'Recording' },
        processing: { color: 'bg-yellow-500', text: 'Processing' }
      }),
      []
    );

  const config = statusConfig[status] || statusConfig.idle;

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`h-3 w-3 rounded-full transition-colors ${config.color}`}
      ></div>
      <span className="text-sm text-gray-600">{config.text}</span>
    </div>
  );
};

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  className,
  cameraStream
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState<string | null>(null);

  const { sendAudioSegment } = useWebSocketContext();

  // Draw visualization
  const draw = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current) return;

    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');

    if (!canvasCtx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const drawFrame = () => {
      animationFrameRef.current = requestAnimationFrame(drawFrame);
      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = 'rgb(243 244 246)';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'rgb(31 41 55)';
      canvasCtx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    drawFrame();
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      source.connect(analyserRef.current);

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setStatus('recording');
      draw();
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  }, [draw]);

  // Toggle recording state
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Function to capture a frame from the camera stream
  const captureFrame = useCallback(async (): Promise<string | null> => {
    if (!cameraStream) return null;

    const videoTrack = cameraStream.getVideoTracks()[0];
    if (!videoTrack) return null;

    try {
      const imageCapture = new ImageCapture(videoTrack);
      const blob = await imageCapture.grabFrame();

      // Convert blob to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            // Remove the data URL prefix
            resolve(reader.result.split(',')[1]);
          } else {
            reject(new Error('Failed to read blob as base64 string.'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    }
  }, [cameraStream]);

  // Handle stop recording
  const handleStopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording')
      return;

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/pcm' });

      // Capture a frame if the camera is streaming
      const imageBase64 = await captureFrame();

      // Convert audio blob to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = (reader.result as string).split(',')[1];

        // Send audio and optional image to WebSocket
        sendAudioSegment(base64Audio, imageBase64 || undefined);
        if (imageBase64) {
          console.log('Sent audio with a camera frame.');
        }
      };
      reader.readAsDataURL(audioBlob);

      // Clean up
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioContextRef.current?.close();
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setStatus('processing');
  }, [captureFrame, sendAudioSegment]);

  // Stop recording
  const stopRecording = useCallback(() => {
    handleStopRecording();
  }, [handleStopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }, [isRecording, stopRecording]);

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle>Voice Input</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <canvas ref={canvasRef} className="h-24 w-full rounded-lg bg-gray-200" />
        <Button onClick={toggleRecording} size="lg" className="w-full">
          {isRecording ? <MicOff className="mr-2" /> : <Mic className="mr-2" />}
          {isRecording ? 'Stop Listening' : 'Start Listening'}
        </Button>
        <StatusIndicator status={status} />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </CardContent>
    </Card>
  );
};

export default VoiceVisualizer;