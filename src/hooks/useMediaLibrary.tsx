import { useState, useEffect } from 'react';
import { MediaItem, Playlist } from '../types';
import { auth, db } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDoc,
} from 'firebase/firestore';

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

  // Carregar playlists do Firestore ao autenticar
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setPlaylists([DEFAULT_PLAYLIST]);
        setCurrentPlaylist(DEFAULT_PLAYLIST);
        setCurrentMedia(null);
        setIsPlaying(false);
        setLoading(false);
        return;
      }

      // Busca playlists do usuário
      const playlistsRef = collection(db, 'playlists');
      const q = query(playlistsRef, where('user_id', '==', user.uid));
      const querySnapshot = await getDocs(q);

      const playlistsWithItems: Playlist[] = [];
      for (const docSnap of querySnapshot.docs) {
        const playlistData = docSnap.data() as Playlist;
        // Busca os itens da playlist
        const itemsRef = collection(db, 'playlists', docSnap.id, 'items');
        const itemsSnap = await getDocs(itemsRef);
        const items: MediaItem[] = itemsSnap.docs.map(d => d.data() as MediaItem);
        playlistsWithItems.push({
          ...playlistData,
          id: docSnap.id,
          items,
        });
      }

      if (playlistsWithItems.length > 0) {
        setPlaylists(playlistsWithItems);
        setCurrentPlaylist(playlistsWithItems[0]);
        if (playlistsWithItems[0].items.length > 0) {
          setCurrentMedia(playlistsWithItems[0].items[0]);
          setIsPlaying(true);
        }
      } else {
        setPlaylists([DEFAULT_PLAYLIST]);
        setCurrentPlaylist(DEFAULT_PLAYLIST);
        setCurrentMedia(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Salvar playlist no Firestore
  const savePlaylist = async (playlist: Playlist) => {
    if (!playlist.user_id || !isUuid(playlist.id)) {
      console.warn('Playlist sem user_id ou id inválido:', playlist);
      return;
    }

    // Salva playlist
    await setDoc(doc(db, 'playlists', playlist.id), {
      id: playlist.id,
      name: playlist.name,
      user_id: playlist.user_id,
    });

    // Salva itens da playlist (subcoleção)
    const itemsRef = collection(db, 'playlists', playlist.id, 'items');
    // Remove todos os itens antigos antes de salvar os novos
    const oldItemsSnap = await getDocs(itemsRef);
    for (const itemDoc of oldItemsSnap.docs) {
      await deleteDoc(itemDoc.ref);
    }
    for (const item of playlist.items) {
      await setDoc(doc(itemsRef, item.id), item);
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
        const user = auth.currentUser;
        if (!user) {
          alert('Usuário não autenticado');
          return;
        }
        updatedPlaylist = {
          id: crypto.randomUUID(),
          name: 'Minha Playlist',
          items: [],
          user_id: user.uid
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

      // Salva playlist no Firestore
      await savePlaylist(updatedPlaylist);
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

    // Remove do Firestore
    const user = auth.currentUser;
    if (user && currentPlaylist.id !== 'default') {
      await deleteDoc(doc(db, 'playlists', currentPlaylist.id, 'items', itemId));
      await savePlaylist(updatedPlaylist);
    }
  };

  // Criar nova playlist
  const createPlaylist = async (name: string) => {
    const user = auth.currentUser;
    if (!user) {
      alert('Usuário não autenticado');
      return;
    }

    const newPlaylist: Playlist = {
      id: crypto.randomUUID(),
      name,
      items: [],
      user_id: user.uid
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

  return {
    playlists,
    currentPlaylist,
    currentMedia,
    isPlaying,
    loading,
    savePlaylist,
    addLocalMedia,
    addYoutubeVideo,
    removeMediaItem,
    createPlaylist,
    changePlaylist,
    playMedia,
    togglePlayPause,
  };
};