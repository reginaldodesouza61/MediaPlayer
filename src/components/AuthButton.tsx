import React, { useState } from 'react';
import { LogIn, LogOut, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthButtonProps {
  isAuthenticated: boolean;
  onAuthChange: () => void;
}

const AuthButton: React.FC<AuthButtonProps> = ({ isAuthenticated, onAuthChange }) => {
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async () => {
    if (isAuthenticated) {
      await supabase.auth.signOut();
      setShowEmailInput(false);
      setMessage('');
    } else {
      setShowEmailInput(true);
    }
    onAuthChange();
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        setMessage('Error: ' + error.message);
      } else {
        setMessage('Verifique seu email para o link de login!');
        setShowEmailInput(false);
      }
    } catch (error) {
      setMessage('Ocorreu um erro inesperado');
    }
  };

  if (showEmailInput && !isAuthenticated) {
    return (
      <div className="relative">
        <form onSubmit={handleEmailSignIn} className="flex items-center gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite seu email"
            className="px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
            required
          />
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Mail size={18} />
            <span>Entrar</span>
          </button>
        </form>
        {message && (
          <p className={`mt-2 text-sm ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleAuth}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity"
    >
      {isAuthenticated ? (
        <>
          <LogOut size={18} />
          <span>Sair</span>
        </>
      ) : (
        <>
          <LogIn size={18} />
          <span>Entrar</span>
        </>
      )}
    </button>
  );
};

export default AuthButton;