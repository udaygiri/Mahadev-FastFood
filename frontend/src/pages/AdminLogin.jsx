import React, { useState } from 'react';
import { Lock, Mail, Utensils, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError('Please enter admin email.');
    if (!password.trim()) return setError('Please enter admin password.');

    setIsSubmitting(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) {
        throw new Error(authError.message);
      }

      onLoginSuccess(data.session);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-slate flex items-center justify-center p-4 font-sans text-white">
      <div className="bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-800 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-brand-primary/20 text-brand-primary rounded-2xl flex items-center justify-center mx-auto border border-brand-primary/30">
            <Utensils className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Kitchen Admin Portal
          </h1>
          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/20">
            <ShieldCheck className="w-3 h-3" /> RESTRICTED ACCESS
          </span>
          <p className="text-xs text-gray-400 pt-1">
            Authorized staff only. Sign in to manage live kitchen orders.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-brand-primary" /> Staff Email
            </label>
            <input 
              type="email" 
              placeholder="udaygiri.aparnathi5@gmail.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:border-brand-primary outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-brand-primary" /> Password
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:border-brand-primary outline-none transition-all"
            />
          </div>

          {error && (
            <div className="text-xs font-bold text-red-400 bg-red-950/50 p-2.5 rounded-xl border border-red-800/60 text-center">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-primary hover:bg-red-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-red-900/30 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
