
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
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-10">
        <div className="text-center">
          <img src={LOGO_URL} alt="Educater" className="w-48 h-48 mx-auto mb-8" />
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Sales Portal</h1>
          <p className="text-slate-500 mt-2 font-medium italic">Empowering schools through digital communication</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold animate-in fade-in slide-in-from-top-2">
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
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-bold text-slate-900" 
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
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-bold text-slate-900" 
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand hover:bg-brand/90 text-slate-900 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-3 group"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                Access Dashboard
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="pt-8 border-t border-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Lock size={12} />
            Secure Enterprise Encryption
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
