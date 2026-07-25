import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, Language } from '../i18n/LanguageContext';
import { Globe, Check } from 'lucide-react';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { code: Language; label: string; flag: string; nativeName: string }[] = [
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳', nativeName: 'Tiếng Việt' },
    { code: 'en', label: 'English', flag: '🇬🇧', nativeName: 'English' },
  ];

  const currentOption = options.find(o => o.code === language) || options[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        id="btn-language-selector"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-200/80 shadow-xs"
        title="Đổi ngôn ngữ / Switch Language"
      >
        <span className="text-base leading-none">{currentOption.flag}</span>
        <span className="font-sans font-bold uppercase text-[11px] text-slate-700">{currentOption.code}</span>
        <Globe className="w-3.5 h-3.5 text-slate-500 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 font-sans uppercase tracking-wider border-b border-slate-100 mb-1">
            Ngôn ngữ / Language
          </div>
          {options.map((option) => {
            const isSelected = option.code === language;
            return (
              <button
                key={option.code}
                onClick={() => {
                  setLanguage(option.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-sans rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-100 font-medium'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{option.flag}</span>
                  <span>{option.nativeName}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
