import React, { useState } from 'react';
import { LogIn, LogOut, Mail } from 'lucide-react';
import { auth } from '../lib/firebase';
import { sendSignInLinkToEmail, signOut, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

interface AuthButtonProps {
  isAuthenticated: boolean;
  onAuthChange: () => void;
}

const actionCodeSettings = {
  url: window.location.origin,
  handleCodeInApp: true,
};

const AuthButton: React.FC<AuthButtonProps> = ({ isAuthenticated, onAuthChange }) => {
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async () => {
    if (isAuthenticated) {
      await signOut(auth);
      setShowEmailInput(false);
      setMessage('');
      onAuthChange();
    } else {
      setShowEmailInput(true);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setMessage('Verifique seu email para o link de login!');
      setShowEmailInput(false);
    } catch (error: any) {
      setMessage('Erro: ' + (error.message || 'Ocorreu um erro inesperado'));
    }
  };

  // Checa se está acessando pelo link mágico do e-mail
  React.useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn') || '';
      if (!email) {
        email = window.prompt('Digite seu e-mail para login:') || '';
      }
      signInWithEmailLink(auth, email, window.location.href)
        .then(() => {
          window.localStorage.removeItem('emailForSignIn');
          onAuthChange();
        })
        .catch(() => {});
    }
    // eslint-disable-next-line
  }, []);

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
          <p className={`mt-2 text-sm ${message.includes('Erro') ? 'text-red-400' : 'text-green-400'}`}>
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