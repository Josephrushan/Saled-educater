
import React, { useState } from 'react';
import { LOGO_URL } from '../constants';
import { SalesRep } from '../types';
import { Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { loginSalesRep } from '../services/firebase';

interface LoginProps {
  onLogin: (rep: SalesRep) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const user = await loginSalesRep(email, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('Authentication failed. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        input::placeholder {
          color: #374151 !important;
          opacity: 1;
        }
      `}</style>
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-6" style={{ backgroundColor: '#080a16' }}>
      <div className="w-full max-w-md space-y-0 max-h-screen overflow-hidden flex flex-col">
        <div className="text-center flex-shrink-0">
          <img src={LOGO_URL} alt="Educater" className="w-32 sm:w-56 h-32 sm:h-56 mx-auto -mb-6 sm:-mb-12 object-contain" />
          <img src="https://firebasestorage.googleapis.com/v0/b/websitey-9f8e4.firebasestorage.app/o/edu%20sales%2Fedu%20coins.jpg?alt=media&token=a0e36c71-5e2c-4fc0-9b3b-d4b2884b4f99" alt="Edu Coins" className="w-64 sm:w-80 h-64 sm:h-80 mx-auto object-contain" />
        </div>

        <form onSubmit={handleLogin} className="space-y-3 sm:space-y-6 flex-1 flex flex-col justify-center px-4 sm:px-0">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-rose-50 text-rose-600 rounded-full text-xs font-bold animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@educater.app"
                className="w-full pl-12 pr-4 py-2 sm:py-4 rounded-full focus:ring-4 focus:ring-brand/5 outline-none transition-all font-bold text-slate-400 text-sm"
                style={{ 
                  backgroundColor: '#0f0f19',
                  color: '#cbd5e1'
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••••••"
                className="w-full pl-12 pr-4 py-2 sm:py-4 rounded-full focus:ring-4 focus:ring-brand/5 outline-none transition-all font-bold text-slate-400 text-sm"
                style={{
                  backgroundColor: '#0f0f19',
                  color: '#cbd5e1'
                }}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 sm:mt-0 bg-brand hover:bg-brand/90 text-slate-900 py-2 sm:py-5 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 sm:gap-3 group"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                Access Dashboard
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="hidden sm:flex pt-4 flex-col items-center justify-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest flex-shrink-0">
          <div className="flex items-center gap-2">
            <Lock size={12} />
            Secure Enterprise Encryption
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Login;
