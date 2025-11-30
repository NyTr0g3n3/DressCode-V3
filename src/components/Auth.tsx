import React, { useState, useEffect, useRef } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';

interface AuthProps {
  user: any;
}

const BETA_CODE = 'DRESSMEUP2025'; // Change ce code comme tu veux

const Auth: React.FC<AuthProps> = ({ user }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [betaCode, setBetaCode] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const checkEmailAllowed = async (emailToCheck: string): Promise<boolean> => {
    try {
      // Vérifie dans la collection allowedEmails
      const emailDoc = await getDoc(doc(db, 'allowedEmails', emailToCheck.toLowerCase()));
      return emailDoc.exists();
    } catch (err) {
      console.error('Erreur vérification email:', err);
      return false;
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userEmail = result.user.email;
      
      if (!userEmail) {
        await signOut(auth);
        setError("Impossible de récupérer l'email du compte Google.");
        return;
      }

      const isAllowed = await checkEmailAllowed(userEmail);
      
      if (!isAllowed) {
        await signOut(auth);
        setError("Désolé, cette application est en beta fermée. Votre email n'est pas autorisé.");
        return;
      }
    } catch (err: any) {
      console.error('Erreur de connexion Google:', err);
      setError(err.message || 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Vérifier le code beta
        if (betaCode !== BETA_CODE) {
          setError("Code d'invitation invalide.");
          setIsLoading(false);
          return;
        }

        // Vérifier si l'email est autorisé
        const isAllowed = await checkEmailAllowed(email);
        if (!isAllowed) {
          setError("Votre email n'est pas dans la liste des beta testeurs.");
          setIsLoading(false);
          return;
        }

        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // Connexion
        const isAllowed = await checkEmailAllowed(email);
        if (!isAllowed) {
          setError("Votre email n'est pas autorisé à accéder à la beta.");
          setIsLoading(false);
          return;
        }

        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error('Erreur d\'authentification:', err);
      if (err.code === 'auth/user-not-found') {
        setError("Aucun compte trouvé avec cet email.");
      } else if (err.code === 'auth/wrong-password') {
        setError("Mot de passe incorrect.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("Cet email est déjà utilisé.");
      } else if (err.code === 'auth/weak-password') {
        setError("Le mot de passe doit contenir au moins 6 caractères.");
      } else {
        setError(err.message || 'Erreur d\'authentification');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  if (user) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-3 px-4 py-2 rounded-full bg-gold/10 hover:bg-gold/20 transition-all border border-gold/30"
        >
          <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-onyx font-bold">
            {(user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
          </div>
          <span className="hidden md:block text-sm font-medium">
            {user.displayName || user.email?.split('@')[0]}
          </span>
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-raisin-black rounded-xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden z-50">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium">{user.displayName || 'Utilisateur'}</p>
              <p className="text-xs text-gray-500 mt-1">{user.email}</p>
              <span className="inline-block mt-2 px-2 py-0.5 bg-gold/20 text-gold text-xs font-semibold rounded-full">
                Beta Testeur
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Déconnexion
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-raisin-black rounded-2xl shadow-2xl p-8 max-w-md mx-auto border border-black/5 dark:border-white/10">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif font-bold mb-2">
          Dress <span className="text-gold">Me</span> Up!
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          {isSignUp ? 'Rejoindre la beta' : 'Bienvenue'}
        </p>
        <div className="mt-3 inline-block px-3 py-1 bg-gold/10 border border-gold/30 rounded-full">
          <span className="text-xs font-semibold text-gold">🔒 Beta privée</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full mb-6 px-6 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-gold hover:shadow-lg hover:shadow-gold/20 transition-all duration-300 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <>
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-semibold group-hover:text-gold transition-colors">
              Continuer avec Google
            </span>
          </>
        )}
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white dark:bg-raisin-black text-gray-500">Ou avec email</span>
        </div>
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent bg-white dark:bg-gray-800 transition-all"
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent bg-white dark:bg-gray-800 transition-all"
          required
        />
        
        {isSignUp && (
          <input
            type="text"
            placeholder="Code d'invitation"
            value={betaCode}
            onChange={(e) => setBetaCode(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 border border-gold/50 dark:border-gold/30 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent bg-gold/5 dark:bg-gold/10 transition-all placeholder:text-gold/50"
            required
          />
        )}
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-4 bg-gradient-to-r from-gold to-gold-dark text-onyx rounded-xl hover:shadow-lg hover:shadow-gold/30 transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            isSignUp ? 'Rejoindre la beta' : 'Se connecter'
          )}
        </button>
      </form>

      <button
        onClick={() => {
          setIsSignUp(!isSignUp);
          setError(null);
        }}
        className="w-full mt-6 text-sm text-gray-500 hover:text-gold transition-colors"
      >
        {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas encore de compte ? Rejoindre la beta'}
      </button>
    </div>
  );
};

export default Auth;
