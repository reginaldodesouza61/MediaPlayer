import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

interface FileSelectorProps {
  onFilesSelected: (files: FileList) => void;
}

const FileSelector: React.FC<FileSelectorProps> = ({ onFilesSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelected(files);
      // Reset the input value to allow selecting the same file again.
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="audio/*,video/*"
        multiple
      />
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
      >
        <Upload size={18} />
        <span>Adicionar mídia local</span>
      </button>
    </div>
  );
};

export default FileSelector;