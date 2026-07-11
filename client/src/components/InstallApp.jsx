import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

const InstallApp = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // 1. Check if the app is already installed and running standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return; 
    }

    // 2. Catch the browser's hidden install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Stop Chrome from automatically showing its default prompt
      setDeferredPrompt(e); // Save it so we can trigger it with our custom button
      setIsInstallable(true);
    };

    // 3. Guarantee cleanup if installation completes (even from browser menu)
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      console.log('Yenuvia successfully installed!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // 🔥 THE FIX: Hide the UI button immediately before opening the browser prompt!
    setIsInstallable(false);

    // Show the official browser install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt!');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear the saved prompt since browsers only allow it to be called once
    setDeferredPrompt(null);
  };

  if (!isInstallable) return null; // Stay invisible if not ready

  return (
    <button 
      onClick={handleInstallClick}
      className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-yellow-400 active:scale-95 transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)]"
    >
      <Download size={16} />
      Install Yenuvia App
    </button>
  );
};

export default InstallApp;