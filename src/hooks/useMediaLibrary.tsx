import { useState, useEffect } from 'react';
import { MediaItem, Playlist } from '../types';
import { supabase } from '../lib/supabase';

// Função para validar UUID
function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

const DEFAULT_PLAYLIST: Playlist = {
  id: 'default',
  name: 'Default Playlist',
  items: [],
  user_id: 'default'
};

export const useMediaLibrary = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([DEFAULT_PLAYLIST]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist>(DEFAULT_PLAYLIST);
  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carregar playlists do Supabase ao autenticar
  useEffect(() => {
    const loadPlaylists = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        setPlaylists([DEFAULT_PLAYLIST]);
        setCurrentPlaylist(DEFAULT_PLAYLIST);
        setCurrentMedia(null);
        setIsPlaying(false);
        setLoading(false);
        return;
      }

      const { data: playlistsData, error: playlistsError } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (playlistsError) {
        console.error('Error loading playlists:', playlistsError);
        return;
      }

      const playlistsWithItems = await Promise.all(
        (playlistsData || []).map(async (playlist) => {
          const { data: items, error: itemsError } = await supabase
            .from('playlist_items')
            .select('*')
            .eq('playlist_id', playlist.id)
            .order('created_at', { ascending: true });

          if (itemsError) {
            console.error('Error loading playlist items:', itemsError);
            return null;
          }

          return {
            id: playlist.id,
            name: playlist.name,
            items: items || [],
            user_id: playlist.user_id
          };
        })
      );

      const validPlaylists = playlistsWithItems.filter((p): p is Playlist => p !== null);

      if (validPlaylists.length > 0) {
        setPlaylists(validPlaylists);
        setCurrentPlaylist(validPlaylists[0]);
        if (validPlaylists[0].items.length > 0) {
          setCurrentMedia(validPlaylists[0].items[0]);
          setIsPlaying(true);
        }
      } else {
        setPlaylists([DEFAULT_PLAYLIST]);
        setCurrentPlaylist(DEFAULT_PLAYLIST);
        setCurrentMedia(null);
      }

      setLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        loadPlaylists();
      } else if (event === 'SIGNED_OUT') {
        setPlaylists([DEFAULT_PLAYLIST]);
        setCurrentPlaylist(DEFAULT_PLAYLIST);
        setCurrentMedia(null);
        setIsPlaying(false);
      }
    });

    loadPlaylists();

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Salvar playlist no Supabase
  const savePlaylist = async (playlist: Playlist) => {
    if (!playlist.user_id || !isUuid(playlist.id)) {
      console.warn('Playlist sem user_id ou id inválido:', playlist);
      return;
    }

    const { data: playlistData, error: playlistError } = await supabase
      .from('playlists')
      .upsert({
        id: playlist.id,
        name: playlist.name,
        user_id: playlist.user_id
      })
      .select()
      .single();

    if (playlistError) {
      console.error('Error saving playlist:', playlistError);
      alert(playlistError.message);
      return;
    }

    // Salvar itens da playlist
    const { error: itemsError } = await supabase
      .from('playlist_items')
      .upsert(
        playlist.items.map(item => ({
          ...item,
          playlist_id: playlistData.id
        }))
      );

    if (itemsError) {
      console.error('Error saving playlist items:', itemsError);
      alert(itemsError.message);
    }
  };

  // Adicionar arquivos locais (SEM upload, apenas blob local)
  const addLocalMedia = async (files: FileList) => {
    const newItems: MediaItem[] = [];

    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');

      if (isVideo || isAudio) {
        // Cria URL temporária local
        const fileUrl = URL.createObjectURL(file);

        newItems.push({
          id: crypto.randomUUID(),
          name: file.name,
          type: isVideo ? 'video' : 'audio',
          url: fileUrl
        });
      }
    }

    if (newItems.length > 0) {
      let updatedPlaylist = currentPlaylist;

      // Se estiver na playlist padrão, cria uma nova playlist local
      if (currentPlaylist.id === 'default') {
        updatedPlaylist = {
          id: crypto.randomUUID(),
          name: 'Minha Playlist',
          items: [],
          user_id: 'local'
        };
        setPlaylists(prev => [...prev, updatedPlaylist]);
        setCurrentPlaylist(updatedPlaylist);
      }

      updatedPlaylist = {
        ...updatedPlaylist,
        items: [...updatedPlaylist.items, ...newItems]
      };

      setCurrentPlaylist(updatedPlaylist);

      setPlaylists(prevPlaylists =>
        prevPlaylists.map(pl =>
          pl.id === updatedPlaylist.id ? updatedPlaylist : pl
        )
      );

      if (!currentMedia) {
        setCurrentMedia(newItems[0]);
      }
    }
  };

  // Adicionar vídeo do YouTube
  const addYoutubeVideo = async (url: string, title: string = 'YouTube Video') => {
    if (!url.includes('youtube.com/watch?v=') && !url.includes('youtu.be/')) {
      alert('URL do YouTube inválida');
      return false;
    }

    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }

    if (!videoId) {
      alert('Não foi possível extrair o ID do vídeo do YouTube.');
      return false;
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    const thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

    const newItem: MediaItem = {
      id: crypto.randomUUID(),
      name: title,
      type: 'youtube',
      url: embedUrl,
      thumbnail
    };

    const updatedPlaylist = {
      ...currentPlaylist,
      items: [...currentPlaylist.items, newItem]
    };

    setCurrentPlaylist(updatedPlaylist);

    setPlaylists(prevPlaylists =>
      prevPlaylists.map(pl =>
        pl.id === currentPlaylist.id ? updatedPlaylist : pl
      )
    );

    if (!currentMedia) {
      setCurrentMedia(newItem);
    }

    await savePlaylist(updatedPlaylist);

    return true;
  };

  // Remover item da playlist
  const removeMediaItem = async (itemId: string) => {
    const updatedItems = currentPlaylist.items.filter(item => item.id !== itemId);
    const updatedPlaylist = {
      ...currentPlaylist,
      items: updatedItems
    };

    setCurrentPlaylist(updatedPlaylist);

    setPlaylists(prevPlaylists =>
      prevPlaylists.map(pl =>
        pl.id === currentPlaylist.id ? updatedPlaylist : pl
      )
    );

    if (currentMedia && currentMedia.id === itemId) {
      const nextItem = updatedItems[0] || null;
      setCurrentMedia(nextItem);
      setIsPlaying(false);
    }

    await supabase
      .from('playlist_items')
      .delete()
      .eq('id', itemId);

    await savePlaylist(updatedPlaylist);
  };

  // Criar nova playlist
  const createPlaylist = async (name: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      alert('Usuário não autenticado');
      return;
    }

    const newPlaylist: Playlist = {
      id: crypto.randomUUID(),
      name,
      items: [],
      user_id: user.id
    };

    setPlaylists(prev => [...prev, newPlaylist]);
    setCurrentPlaylist(newPlaylist);

    await savePlaylist(newPlaylist);
  };

  // Trocar playlist atual
  const changePlaylist = (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist) {
      setCurrentPlaylist(playlist);
      setCurrentMedia(playlist.items[0] || null);
      setIsPlaying(true);
    }
  };

  // Tocar item específico
  const playMedia = (itemId: string) => {
    const item = currentPlaylist.items.find(item => item.id === itemId);
    if (item) {
      setCurrentMedia(item);
      setIsPlaying(true);
    }
  };

  // Play/pause
  const togglePlayPause = () => {
    if (currentMedia) {
      setIsPlaying(prev => !prev);
    }
  };

  // Próxima mídia
  const playNext = () => {
    if (!currentMedia || currentPlaylist.items.length <= 1) return;

    const currentIndex = currentPlaylist.items.findIndex(item => item.id === currentMedia.id);
    const nextIndex = (currentIndex + 1) % currentPlaylist.items.length;
    setCurrentMedia(currentPlaylist.items[nextIndex]);
  };

  // Mídia anterior
  const playPrevious = () => {
    if (!currentMedia || currentPlaylist.items.length <= 1) return;

    const currentIndex = currentPlaylist.items.findIndex(item => item.id === currentMedia.id);
    const prevIndex = (currentIndex - 1 + currentPlaylist.items.length) % currentPlaylist.items.length;
    setCurrentMedia(currentPlaylist.items[prevIndex]);
  };

  return {
    playlists,
    currentPlaylist,
    currentMedia,
    isPlaying,
    loading,
    addLocalMedia,
    addYoutubeVideo,
    removeMediaItem,
    createPlaylist,
    changePlaylist,
    playMedia,
    togglePlayPause,
    playNext,
    playPrevious,
    setIsPlaying
  };
};