import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

const InstallApp = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // 1. Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return; 
    }

    // 2. Catch the browser's hidden install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Stop Chrome from automatically showing its ugly default prompt
      setDeferredPrompt(e); // Save it so we can trigger it with our custom button
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the official browser install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User installed Yenuvia!');
      setIsInstallable(false); // Hide the button forever
    }
    
    // Clear the saved prompt since it can't be used again
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