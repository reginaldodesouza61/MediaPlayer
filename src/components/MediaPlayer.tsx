import React, { useRef, useState, useEffect } from 'react';
import { MediaItem } from '../types';
import MediaControls from './MediaControls';
import AudioVisualizer from './AudioVisualizer';
import { Music, Video } from 'lucide-react';

interface MediaPlayerProps {
  mediaItem: MediaItem | null;
  isPlaying: boolean;
  onPlayPauseChange: (isPlaying: boolean) => void;
  onNextTrack: () => void;
  onPreviousTrack: () => void;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({
  mediaItem,
  isPlaying,
  onPlayPauseChange,
  onNextTrack,
  onPreviousTrack
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);

  // Fullscreen handler
  const handleFullscreen = () => {
    if (videoContainerRef.current) {
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen();
      } else if ((videoContainerRef.current as any).webkitRequestFullscreen) {
        (videoContainerRef.current as any).webkitRequestFullscreen();
      } else if ((videoContainerRef.current as any).msRequestFullscreen) {
        (videoContainerRef.current as any).msRequestFullscreen();
      }
    }
  };

  // Get the active media element
  const getMediaElement = () => {
    if (!mediaItem) return null;
    if (mediaItem.type === 'audio') return audioRef.current;
    if (mediaItem.type === 'video') return videoRef.current;
    return null;
  };

  // Handle media loading
  useEffect(() => {
    setIsMediaLoaded(false);

    if (!mediaItem) return;

    const mediaElement = getMediaElement();

    if (mediaElement) {
      mediaElement.src = mediaItem.url;
      mediaElement.load();
    }

    if (isPlaying) {
      onPlayPauseChange(false);
    }

    setCurrentTime(0);
  }, [mediaItem]);

  // Handle play/pause
  useEffect(() => {
    const mediaElement = getMediaElement();

    if (!mediaElement || !isMediaLoaded) return;

    if (isPlaying) {
      mediaElement.play().catch(() => {
        onPlayPauseChange(false);
      });
    } else {
      mediaElement.pause();
    }
  }, [isPlaying, isMediaLoaded, mediaItem]);

  // Handle YouTube iframe API
  useEffect(() => {
    if (mediaItem?.type === 'youtube') {
      if (iframeRef.current) {
        try {
          const message = isPlaying
            ? '{"event":"command","func":"playVideo","args":""}'
            : '{"event":"command","func":"pauseVideo","args":""}';
          iframeRef.current.contentWindow?.postMessage(message, '*');
        } catch (error) {
          console.error('Failed to control YouTube iframe:', error);
        }
      }
    }
  }, [isPlaying, mediaItem]);

  // Handle media events
  const handleLoadedMetadata = () => {
    const mediaElement = getMediaElement();
    if (mediaElement) {
      setDuration(mediaElement.duration);
      setIsMediaLoaded(true);
      // Força o play se já deveria estar tocando
      if (isPlaying) {
        mediaElement.play().catch(() => {
          onPlayPauseChange(false);
        });
      }
    }
  };

  const handleTimeUpdate = () => {
    const mediaElement = getMediaElement();
    if (mediaElement) {
      setCurrentTime(mediaElement.currentTime);
    }
  };

  const handleEnded = () => {
    onPlayPauseChange(false);
    onNextTrack();
  };

  const handleSeek = (time: number) => {
    const mediaElement = getMediaElement();
    if (mediaElement) {
      mediaElement.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Render empty state
  if (!mediaItem) {
    return (
      <div className="w-full h-64 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="flex justify-center mb-4">
            <Music size={48} className="opacity-30" />
          </div>
          <p>No media selected</p>
          <p className="text-sm mt-2">Select a file from your playlist to start playing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {mediaItem.type === 'audio' && (
        <div className="w-full">
          <audio
            ref={audioRef}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            className="hidden"
          />
          <div className="w-full rounded-lg overflow-hidden">
            <div className="flex items-center justify-center h-12 bg-gradient-to-r from-indigo-900 to-purple-900 rounded-t-lg">
              <h3 className="text-white font-medium truncate px-4">
                {mediaItem.name}
              </h3>
            </div>
            <AudioVisualizer audioElement={audioRef.current} isPlaying={isPlaying} />
          </div>
        </div>
      )}

      {mediaItem.type === 'video' && (
        <div ref={videoContainerRef} className="w-full rounded-lg overflow-hidden relative">
          <video
            ref={videoRef}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            className="w-full h-auto"
          />
          <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent flex justify-between items-center">
            <h3 className="text-white font-medium truncate">
              {mediaItem.name}
            </h3>
            <button
              onClick={handleFullscreen}
              className="ml-2 p-2 rounded bg-gray-800 bg-opacity-60 text-white hover:bg-opacity-90"
              title="Tela cheia"
            >
              ⛶
            </button>
          </div>
        </div>
      )}

      {mediaItem.type === 'youtube' && (
        <div className="w-full rounded-lg overflow-hidden relative aspect-video">
          <iframe
            ref={iframeRef}
            src={`${mediaItem.url}?enablejsapi=1&autoplay=${isPlaying ? 1 : 0}&origin=${window.location.origin}`}
            title={mediaItem.name}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          ></iframe>
        </div>
      )}

      {mediaItem.type !== 'youtube' && (
        <div className="mt-4">
          <MediaControls
            isPlaying={isPlaying}
            onPlayPause={() => onPlayPauseChange(!isPlaying)}
            onNext={onNextTrack}
            onPrevious={onPreviousTrack}
            duration={duration}
            currentTime={currentTime}
            onSeek={handleSeek}
            isVideo={mediaItem.type === 'video'}
          />
        </div>
      )}
    </div>
  );
};

export default MediaPlayer;