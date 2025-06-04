import React from 'react';
import { Play, Trash2, Music, Video } from 'lucide-react';
import { MediaItem } from '../types';

export interface Playlist {
  id: string;
  name: string;
  items: MediaItem[];
  user_id?: string;
}

interface PlaylistProps {
  items: MediaItem[];
  currentItemId?: string;
  onItemSelect: (id: string) => void;
  onItemRemove: (id: string) => void;
}

const Playlist: React.FC<PlaylistProps> = ({ 
  items, 
  currentItemId, 
  onItemSelect, 
  onItemRemove 
}) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>Playlist is empty.  some files or YouTube videos to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-[calc(100vh-400px)] scrollbar">
      <ul className="space-y-2">
        {items.map((item) => (
          <li 
            key={item.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
              item.id === currentItemId 
                ? 'bg-gradient-to-r from-purple-900 to-indigo-900 shadow-lg' 
                : 'hover:bg-gray-800 bg-gray-800 bg-opacity-40'
            }`}
          >
            <div className="flex-shrink-0">
              {item.type === 'youtube' && item.thumbnail ? (
                <img 
                  src={item.thumbnail} 
                  alt={item.name} 
                  className="w-16 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center rounded bg-gradient-to-br from-gray-700 to-gray-900">
                  {item.type === 'audio' ? (
                    <Music size={24} className="text-indigo-400" />
                  ) : (
                    <Video size={24} className="text-purple-400" />
                  )}
                </div>
              )}
            </div>
            
            <div className="flex-grow min-w-0">
              <p className="text-sm font-medium text-white truncate" title={item.name}>
                {item.name}
              </p>
              <p className="text-xs text-gray-400">
                {item.type === 'youtube' ? 'YouTube' : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </p>
            </div>
            
            <div className="flex-shrink-0 flex gap-2">
              <button
                onClick={() => onItemSelect(item.id)}
                className={`p-1.5 rounded-full ${
                  item.id === currentItemId ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Play"
              >
                <Play size={16} />
              </button>
              <button
                onClick={() => onItemRemove(item.id)}
                className="p-1.5 rounded-full bg-gray-700 text-gray-300 hover:bg-red-500 hover:text-white"
                title="Remove"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Playlist;