import React, { useState } from 'react';
import {
  FileAudio,
  FolderOpen,
  Moon,
  Sun,
  Music,
  ListMusic
} from 'lucide-react';
import { useMediaLibrary } from './hooks/useMediaLibrary';
import { useAuth } from './hooks/useAuth';
import FileSelector from './components/FileSelector';
import YoutubeInput from './components/YoutubeInput';
import Playlist from './components/Playlist';
import MediaPlayer from './components/MediaPlayer';
import AuthButton from './components/AuthButton';

function App() {
  const {
    currentPlaylist,
    currentMedia,
    isPlaying,
    loading,
    addLocalMedia,
    addYoutubeVideo,
    removeMediaItem,
    playMedia,
    togglePlayPause,
    playNext,
    playPrevious,
    setIsPlaying
  } = useMediaLibrary();

  const { isAuthenticated, loading: authLoading } = useAuth();
  const [darkMode, setDarkMode] = useState(true);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-indigo-950">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gradient-to-br from-gray-900 to-indigo-950' : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
              <FileAudio size={24} />
            </div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Media Player
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <AuthButton 
              isAuthenticated={isAuthenticated} 
              onAuthChange={() => {}} 
            />
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition-colors ${
                darkMode ? 'bg-gray-800 text-yellow-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Media player section */}
          <div className="lg:col-span-7 space-y-6">
            <div className={`p-6 rounded-lg shadow-lg ${
              darkMode ? 'bg-gray-800 bg-opacity-50 backdrop-blur-sm' : 'bg-white'
            }`}>
              <MediaPlayer
                mediaItem={currentMedia}
                isPlaying={isPlaying}
                onPlayPauseChange={(playing) => setIsPlaying(playing)}
                onNextTrack={playNext}
                onPreviousTrack={playPrevious}
              />
            </div>

            <div className={`p-6 rounded-lg shadow-lg ${
              darkMode ? 'bg-gray-800 bg-opacity-50 backdrop-blur-sm' : 'bg-white'
            }`}>
              <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>
                <FolderOpen size={20} className={darkMode ? 'text-purple-400' : 'text-purple-500'} />
                Adicionar mídia Local
              </h2>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <FileSelector onFilesSelected={addLocalMedia} />
                </div>
                <div className="my-4">
                  <h3 className={`text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Adicionar video do YouTube
                  </h3>
                  <YoutubeInput onYoutubeAdded={addYoutubeVideo} />
                </div>
              </div>
            </div>
          </div>

          {/* Playlist section */}
          <div className="lg:col-span-5">
            <div className={`p-6 rounded-lg shadow-lg h-full ${
              darkMode ? 'bg-gray-800 bg-opacity-50 backdrop-blur-sm' : 'bg-white'
            }`}>
              <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>
                <ListMusic size={20} className={darkMode ? 'text-purple-400' : 'text-purple-500'} />
                {currentPlaylist.name}
              </h2>

              <Playlist
                items={currentPlaylist.items}
                currentItemId={currentMedia?.id}
                onItemSelect={(id) => playMedia(id)}
                onItemRemove={(id) => removeMediaItem(id)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Media Player Web App &copy; {new Date().getFullYear()}
          </p>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Desenvolvido por Reginaldo de Souza
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;