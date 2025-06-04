import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioElement, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!audioElement) return;

    // Create audio context and analyzer
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      // Connect audio element to analyzer
      const source = audioContextRef.current.createMediaElementSource(audioElement);
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      // Create data array
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
    }

    const draw = () => {
      if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Match canvas size to its display size
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      // Get frequency data
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / dataArrayRef.current.length) * 2.5;
      let x = 0;
      
      // Draw bars
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        const barHeight = (dataArrayRef.current[i] / 255) * canvas.height;
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, 'rgba(138, 43, 226, 0.8)'); // Violet
        gradient.addColorStop(0.5, 'rgba(123, 104, 238, 0.8)'); // Medium Slate Blue
        gradient.addColorStop(1, 'rgba(65, 105, 225, 0.8)'); // Royal Blue
        
        ctx.fillStyle = gradient;
        
        // Draw rounded rectangle
        const radius = barWidth / 2;
        ctx.beginPath();
        ctx.moveTo(x + radius, canvas.height);
        ctx.lineTo(x + barWidth - radius, canvas.height);
        ctx.quadraticCurveTo(x + barWidth, canvas.height, x + barWidth, canvas.height - radius);
        ctx.lineTo(x + barWidth, canvas.height - barHeight + radius);
        ctx.quadraticCurveTo(x + barWidth, canvas.height - barHeight, x + barWidth - radius, canvas.height - barHeight);
        ctx.lineTo(x + radius, canvas.height - barHeight);
        ctx.quadraticCurveTo(x, canvas.height - barHeight, x, canvas.height - barHeight + radius);
        ctx.lineTo(x, canvas.height - radius);
        ctx.quadraticCurveTo(x, canvas.height, x + radius, canvas.height);
        ctx.closePath();
        ctx.fill();
        
        x += barWidth + 1;
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(draw);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioElement, isPlaying]);

  return (
    <div className="w-full h-36 bg-gray-900 bg-opacity-30 rounded-lg overflow-hidden backdrop-blur-sm">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default AudioVisualizer;