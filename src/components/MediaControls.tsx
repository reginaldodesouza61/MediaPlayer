import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, Repeat, Shuffle
} from 'lucide-react';

interface MediaControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  isVideo?: boolean;
}

const MediaControls: React.FC<MediaControlsProps> = ({
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  duration,
  currentTime,
  onSeek,
  isVideo
}) => {
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeControlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volumeControlRef.current && !volumeControlRef.current.contains(event.target as Node)) {
        setShowVolumeSlider(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    // Actual volume change is handled by the parent component via the ref
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Actual mute is handled by the parent component via the ref
  };

  return (
    <div className={`w-full ${isVideo ? 'absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/80 to-transparent' : ''}`}>
      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-700 rounded-full mb-3 relative group">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        ></div>
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="absolute left-0 right-0 h-3 -top-1 bg-transparent opacity-0 group-hover:opacity-100"></div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-300 mr-1 w-10">
            {formatTime(currentTime)}
          </span>
          <span className="text-xs text-gray-500">/</span>
          <span className="text-xs text-gray-400 ml-1 w-10">
            {formatTime(duration)}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsShuffle(!isShuffle)}
            className={`p-2 rounded-full ${isShuffle ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
          >
            <Shuffle size={16} />
          </button>
          
          <button 
            onClick={onPrevious}
            className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <SkipBack size={20} />
          </button>
          
          <button 
            onClick={onPlayPause}
            className="p-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 transition-opacity"
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} />}
          </button>
          
          <button 
            onClick={onNext}
            className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <SkipForward size={20} />
          </button>
          
          <button 
            onClick={() => setIsRepeat(!isRepeat)}
            className={`p-2 rounded-full ${isRepeat ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
          >
            <Repeat size={16} />
          </button>
        </div>
        
        <div className="relative" ref={volumeControlRef}>
          <button 
            onClick={toggleMute}
            onMouseEnter={() => setShowVolumeSlider(true)}
            className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-gray-700"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          
          {showVolumeSlider && (
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg p-2 shadow-lg w-32">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaControls;