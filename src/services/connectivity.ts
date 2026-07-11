import { useState, useEffect } from 'react';

export function getIsOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

export function useConnectivity() {
  const [isOnline, setIsOnline] = useState<boolean>(getIsOnline());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
