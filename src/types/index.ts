export interface MediaItem {
  id: string;
  name: string;
  type: 'audio' | 'video' | 'youtube';
  url: string;
  duration?: number;
  thumbnail?: string;
}

export interface Playlist {
  id: string;
  name: string;
  items: MediaItem[];
  user_id: string; // adicione ou torne obrigatório
}