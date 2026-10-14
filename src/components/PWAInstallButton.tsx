import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Share, PlusSquare, CheckCircle } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running as an installed PWA on device home screen, hide
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      await install();
      setIsInstalling(false);
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Browser didn't fire beforeinstallprompt yet or manual instructions
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {variant === 'header' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          disabled={isInstalling}
          title="Telefon yoki kompyuterga ilova qilib o'rnatish"
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:text-emerald-900 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-emerald-700" />
          <span className="hidden sm:inline">Ilova qilib yuklash</span>
          <span className="sm:hidden">Ilova</span>
        </button>
      ) : (
        <div className="bg-emerald-800 text-white p-3 rounded-xl shadow-md border border-emerald-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h4 className="text-sm font-bold leading-tight">
                Ilovani telefonga o'rnating
              </h4>
              <p className="text-xs text-emerald-200 mt-0.5">
                Tez ochiladi, oflayn ishlaydi va doim qo'l ostida bo'ladi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 rounded-lg bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
          >
            Yuklab olish
          </button>
        </div>
      )}

      {/* iOS or Manual Installation Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Ilovani o'rnatish
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs text-slate-700">
              <p className="text-slate-600">
                Ilovani telefoningiz asosiy ekraniga qulay belgi bilan qo'shish uchun:
              </p>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0 text-xs">
                  1
                </div>
                <div>
                  <span className="font-semibold text-slate-900">
                    Brauzer menyusini oching
                  </span>
                  <p className="text-slate-500 mt-0.5">
                    Safari yoki Chrome brauzerida <strong className="text-slate-800">Ulashish (Share)</strong> yoki <strong className="text-slate-800">Menyu (⋮)</strong> tugmasini bosing.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0 text-xs">
                  2
                </div>
                <div>
                  <span className="font-semibold text-slate-900">
                    Bosh ekranga qo'shish
                  </span>
                  <p className="text-slate-500 mt-0.5">
                    Ro'yxatdan <strong className="text-slate-800">"Bosh ekranga qo'shish" (Add to Home Screen)</strong> yoki <strong className="text-slate-800">"Ilovani o'rnatish"</strong> bandini tanlang.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0 text-xs">
                  3
                </div>
                <div>
                  <span className="font-semibold text-slate-900">
                    Tasdiqlang
                  </span>
                  <p className="text-slate-500 mt-0.5">
                    Yuqori o'ng burchakdagi <strong className="text-slate-800">"Qo'shish" (Add)</strong> tugmasini bosing.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Tushundim
            </button>
          </div>
        </div>
      )}
    </>
  );
};
