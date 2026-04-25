import React, { useState } from 'react';
import { Store, Lock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function AuthView() {
  const { login, settings } = useAppContext();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(pin)) {
      setError(false);
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl border-2 border-slate-200 p-8 flex flex-col items-center">
        <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold mb-6 shadow-md shadow-emerald-200">
          <Store className="w-10 h-10" />
        </div>
        
        <h1 className="text-2xl font-black text-slate-800 text-center mb-2">{settings.storeName}</h1>
        <p className="text-slate-500 text-sm mb-8 text-center font-medium">Masukkan PIN kasir untuk mengakses sistem</p>

        <form onSubmit={handleLogin} className="w-full space-y-6">
          <div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
                className={`w-full bg-slate-50 border-2 rounded-xl py-4 pl-12 pr-4 text-center tracking-[0.5em] text-2xl font-black focus:outline-none focus:bg-white transition-all ${
                  error ? 'border-red-500 text-red-600' : 'border-slate-100 focus:border-emerald-500 text-slate-800'
                }`}
                placeholder="••••••"
                maxLength={6}
                required
                autoFocus
              />
            </div>
            {error && (
              <p className="text-red-500 text-xs font-bold text-center mt-2 uppercase tracking-wide">PIN yang Anda masukkan salah</p>
            )}
          </div>
          
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 uppercase tracking-widest text-sm transition-all"
          >
            Masuk Kasir
          </button>
        </form>
        
        <p className="text-slate-400 text-xs text-center mt-8 font-medium">
          Note: PIN default adalah <strong>123456</strong>
        </p>
      </div>
    </div>
  );
}
