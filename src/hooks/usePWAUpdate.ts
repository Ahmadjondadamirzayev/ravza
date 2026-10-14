import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateSW, setUpdateSW] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    try {
      const updateFunction = registerSW({
        immediate: true,
        onNeedRefresh() {
          console.log('PWA: Yangi yangilanish mavjud');
          setNeedRefresh(true);
        },
        onOfflineReady() {
          console.log('PWA: Oflayn rejimda ishlashga tayyor');
          setOfflineReady(true);
        },
        onRegisteredSW(swUrl, r) {
          console.log('PWA Service worker ro\'yxatdan o\'tdi:', swUrl);
          // Periodically check for updates (every 30 minutes)
          if (r) {
            setInterval(() => {
              r.update().catch(console.error);
            }, 30 * 60 * 1000);
          }
        },
        onRegisterError(error) {
          console.warn('PWA Service worker ro\'yxatdan o\'tishda xatolik:', error);
        },
      });

      setUpdateSW(() => updateFunction);
    } catch (e) {
      console.warn('PWA registration skipped or unsupported:', e);
    }
  }, []);

  const reloadApp = async () => {
    if (updateSW) {
      await updateSW(true);
    } else {
      window.location.reload();
    }
  };

  return {
    needRefresh,
    offlineReady,
    reloadApp,
    dismissUpdate: () => setNeedRefresh(false),
  };
}
