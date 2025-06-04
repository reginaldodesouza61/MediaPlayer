import React, { useState } from 'react';
import { Youtube } from 'lucide-react';

interface YoutubeInputProps {
  onYoutubeAdded: (url: string, title: string) => boolean;
}

const YoutubeInput: React.FC<YoutubeInputProps> = ({ onYoutubeAdded }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!url) {
      setError('Por favor, insira uma URL do YouTube');
      return;
    }

    const success = onYoutubeAdded(url, title || 'YouTube Video');
    
    if (success) {
      setUrl('');
      setTitle('');
    } else {
      setError('URL do YouTube inválida. Por favor, insira uma URL de vídeo do YouTube válida.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-grow">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="YouTube URL"
            className="w-full px-4 py-2 pl-10 bg-gray-700 bg-opacity-50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Youtube 
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500"
          />
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Video Titulo (opcional)"
          className="px-4 py-2 bg-gray-700 bg-opacity-50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          Adicionar Vídeo
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </form>
  );
};

export default YoutubeInput;