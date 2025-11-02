import React, { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface AuthProps {
  user: any;
}

const Auth: React.FC<AuthProps> = ({ user }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Erreur de connexion Google:', error);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
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
      <div className="flex items-center gap-4">
        <span className="text-sm">Bonjour, {user.displayName || user.email}</span>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Déconnexion
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-raisin-black rounded-xl shadow-xl p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isSignUp ? 'Créer un compte' : 'Se connecter'}
      </h2>

      <button
        onClick={handleGoogleSignIn}
        className="w-full mb-4 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
        Continuer avec Google
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-raisin-black text-gray-500">Ou</span>
        </div>
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold"
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold"
          required
        />
        <button
          type="submit"
          className="w-full px-4 py-3 bg-gold text-onyx rounded-lg hover:bg-gold-dark transition font-semibold"
        >
          {isSignUp ? 'Créer un compte' : 'Se connecter'}
        </button>
      </form>

      <button
        onClick={() => setIsSignUp(!isSignUp)}
        className="w-full mt-4 text-sm text-gray-500 hover:text-gold transition"
      >
        {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\'inscrire'}
      </button>
    </div>
  );
};

export default Auth;
