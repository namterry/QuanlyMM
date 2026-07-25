import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Download, X, Smartphone, Share, PlusSquare, MoreVertical, CheckCircle2, Monitor, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  setDeferredPrompt: React.Dispatch<React.SetStateAction<BeforeInstallPromptEvent | null>>;
}

export default function InstallPwaModal({
  isOpen,
  onClose,
  deferredPrompt,
  setDeferredPrompt,
}: InstallPwaModalProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>('ios');
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Auto-detect OS on mount
  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setActiveTab('ios');
    } else if (/android/.test(userAgent)) {
      setActiveTab('android');
    } else {
      setActiveTab('desktop');
    }
  }, []);

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Direct mock installation simulation for environment preview
      setIsInstalling(true);
      setTimeout(() => {
        setIsInstalling(false);
        setIsInstalled(true);
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600/30 border border-blue-400/40 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <Smartphone className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  PWA Mobile & Desktop
                </span>
              </div>
              <h2 className="font-sans font-bold text-lg text-white mt-0.5">{t.installAppTitle}</h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2 font-sans leading-relaxed">
            {t.installAppSubtitle}
          </p>
        </div>

        {/* Dynamic Direct Install Banner (if prompt available) */}
        {isInstalled ? (
          <div className="bg-emerald-50 border-b border-emerald-100 p-4 flex items-center gap-3 text-emerald-800 font-sans text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">{t.installedSuccess}</p>
              <p className="text-[11px] text-emerald-600">
                Bạn có thể mở ứng dụng ngay từ Màn hình chính (Home Screen) của thiết bị.
              </p>
            </div>
          </div>
        ) : deferredPrompt ? (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-blue-900 font-sans">Trình duyệt hỗ trợ Cài đặt 1-Click!</p>
                <p className="text-[11px] text-blue-700 font-sans">Bấm nút bên cạnh để tự động thêm vào thiết bị.</p>
              </div>
            </div>
            <button
              onClick={handleDirectInstall}
              disabled={isInstalling}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isInstalling ? 'Đang cài...' : t.pwaDirectInstallBtn}</span>
            </button>
          </div>
        ) : null}

        {/* Platform Selector Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-sans text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <span> {t.iosTab}</span>
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-sans text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'android'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.androidTab}</span>
          </button>

          <button
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-sans text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'desktop'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.desktopTab}</span>
          </button>
        </div>

        {/* Tab Content - Step by Step Guides */}
        <div className="p-5 overflow-y-auto space-y-4 font-sans text-xs text-slate-700">
          {activeTab === 'ios' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-amber-900 text-[11px] leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Lưu ý: iOS yêu cầu thực hiện thủ công qua trình duyệt <strong>Safari</strong> trên iPhone/iPad.</span>
              </div>

              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  1
                </div>
                <div>
                  <p className="font-bold text-slate-800 mb-0.5">{t.iosStep1}</p>
                  <p className="text-[11px] text-slate-500">Đảm bảo bạn không mở trong các trình duyệt ngoài như Zalo/Messenger/InApp browser.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <span>{t.iosStep2}</span>
                  </p>
                  <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] text-blue-600 font-bold shadow-2xs">
                    <Share className="w-3.5 h-3.5" />
                    <span>Nút Chia sẻ (Share)</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 mb-1">{t.iosStep3}</p>
                  <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] text-slate-800 font-bold shadow-2xs">
                    <PlusSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>Thêm vào Màn hình chính (Add to Home Screen)</span>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  4
                </div>
                <div>
                  <p className="font-bold text-slate-800 mb-0.5">{t.iosStep4}</p>
                  <p className="text-[11px] text-emerald-600 font-medium">Hoàn tất! Biểu tượng app sẽ xuất hiện ngoài màn hình iPhone của bạn.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'android' && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-start gap-2.5 text-emerald-900 text-[11px] leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Android hỗ trợ cài đặt PWA cực kỳ nhanh chóng bằng Chrome.</span>
              </div>

              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  1
                </div>
                <div>
                  <p className="font-bold text-slate-800 mb-0.5">{t.androidStep1}</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 mb-1">{t.androidStep2}</p>
                  <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] text-slate-800 font-bold shadow-2xs">
                    <MoreVertical className="w-3.5 h-3.5 text-slate-700" />
                    <span>Menu 3 chấm góc phải</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 mb-1">{t.androidStep3}</p>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px] text-emerald-800 font-bold shadow-2xs">
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cài đặt ứng dụng / Install app</span>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  4
                </div>
                <div>
                  <p className="font-bold text-slate-800 mb-0.5">{t.androidStep4}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'desktop' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-2xl text-blue-900 text-[11px] leading-relaxed">
                Cài ứng dụng trên Máy tính (Windows / macOS) giúp mở cửa sổ riêng biệt không có thanh địa chỉ web, mượt mà và tiện lợi.
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 bg-slate-800 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  1
                </div>
                <div>
                  <p className="font-bold text-slate-800 mb-0.5">Nhìn lên thanh địa chỉ (Address bar) của trình duyệt Chrome hoặc Edge.</p>
                  <p className="text-[11px] text-slate-500">Tìm biểu tượng màn hình kèm dấu cộng <Download className="w-3 h-3 inline text-blue-600" /> ở góc phải thanh URL.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 bg-slate-800 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  2
                </div>
                <div>
                  <p className="font-bold text-slate-800 mb-0.5">Bấm vào biểu tượng Cài đặt và chọn "Cài đặt Garment Tracker".</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          {!isInstalled && (
            <button
              onClick={handleDirectInstall}
              disabled={isInstalling}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-sans font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isInstalling ? 'Đang mô phỏng cài đặt...' : 'Thử kích hoạt cài đặt'}</span>
            </button>
          )}

          {isInstalled && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 font-sans">
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã hoàn tất cài đặt!</span>
            </span>
          )}

          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 border border-slate-200 hover:bg-slate-200/60 text-slate-700 font-sans font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
