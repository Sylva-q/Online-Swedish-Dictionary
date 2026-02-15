
import React, { useState } from 'react';
import { X, Mail, Lock, Chrome, Loader2, ArrowRight } from 'lucide-react';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(isLogin ? 'Authenticating...' : 'Creating profile...');
    
    // Simulate API network latency
    setTimeout(() => {
      onLogin({
        id: `user_${Math.random().toString(36).substr(2, 9)}`,
        email: email || 'demo@svenskalar.com',
        // Simulate "retrieving" a name from the email
        name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`
      });
      setLoading(false);
      onClose();
    }, 1500);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setStatusMessage('Connecting to Google...');
    setTimeout(() => {
      setStatusMessage('Retrieving cloud profile...');
      setTimeout(() => {
        onLogin({
          id: 'google_123',
          email: 'user@gmail.com',
          name: 'Svenska Pro',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
        });
        setLoading(false);
        onClose();
      }, 800);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        <div className="p-8 sm:p-10">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rivstart-green rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg rotate-3">
                <span>Sv</span>
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 leading-tight">SvenskaLär</h2>
                <p className="text-[10px] text-rivstart-green font-bold uppercase tracking-widest">Sandbox Auth</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <X size={24} />
            </button>
          </div>

          <div className="mb-8">
            <h3 className="text-3xl font-black text-slate-900 mb-2 font-serif">
              {isLogin ? 'Välkommen åter!' : 'Bli medlem'}
            </h3>
            <p className="text-slate-500 leading-relaxed text-sm">
              {isLogin 
                ? 'Sign in to access your synced wordbook and study history (Local Simulation).' 
                : 'Create a local account to save your progress in this browser.'}
            </p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center gap-3 font-bold text-slate-700 hover:border-rivstart-green/30 hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm relative overflow-hidden"
            >
              {loading && statusMessage.includes('Google') ? (
                <div className="flex items-center gap-3">
                   <Loader2 className="w-5 h-5 animate-spin text-rivstart-green" />
                   <span className="text-rivstart-green">{statusMessage}</span>
                </div>
              ) : (
                <>
                  <Chrome className="w-5 h-5 text-blue-500" />
                  Continue with Google
                </>
              )}
            </button>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">eller e-post</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-postadress</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-rivstart-green focus:bg-white rounded-2xl outline-none transition-all font-medium"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lösenord</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-rivstart-green focus:bg-white rounded-2xl outline-none transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-slate-900 text-white rounded-[1.25rem] font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 mt-2 active:scale-95 disabled:opacity-50"
              >
                {loading && !statusMessage.includes('Google') ? (
                   <div className="flex items-center gap-2">
                     <Loader2 className="w-6 h-6 animate-spin" />
                     <span>{statusMessage}</span>
                   </div>
                ) : (
                  <>
                    <span>{isLogin ? 'Logga in' : 'Skapa konto'}</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-bold text-rivstart-green hover:text-teal-800 transition-colors"
            >
              {isLogin ? "Inget konto? Registrera dig här" : "Har du redan ett konto? Logga in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
