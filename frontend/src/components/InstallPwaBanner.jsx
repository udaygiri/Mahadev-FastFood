import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export default function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent browser's default automatic prompt
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted PWA installation');
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 bg-dark-slate text-white p-4 rounded-2xl shadow-2xl border border-gray-800 flex items-center justify-between gap-3 animate-in fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-primary text-white rounded-xl flex items-center justify-center font-bold flex-shrink-0">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-extrabold text-xs text-white">Install Mahadev App</h4>
          <p className="text-[11px] text-gray-300">Add to Home Screen for fast 1-tap access!</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 bg-brand-primary hover:bg-red-700 text-white rounded-xl text-xs font-extrabold shadow-xs transition-all cursor-pointer flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>

        <button
          onClick={() => setShowBanner(false)}
          className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
