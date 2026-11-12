import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCheck, Send } from 'lucide-react';

interface WhatsAppChatWidgetProps {
  phoneNumber?: string;
  storeName?: string;
  subtitle?: string;
}

export default function WhatsAppChatWidget({
  phoneNumber = '94783724920',
  storeName = 'Tyrelink Store',
  subtitle = 'Typically replies within minutes'
}: WhatsAppChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [customMessage, setCustomMessage] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  // Set formatted current time for the WhatsApp bubble timestamp
  useEffect(() => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    setCurrentTime(`${hours}:${minutes} ${ampm}`);
  }, []);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest('#whatsapp-launcher-btn')) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleOpen = () => {
    setIsOpen(prev => !prev);
    if (hasUnread) {
      setHasUnread(false);
    }
  };

  const handleLaunchWhatsApp = (presetText?: string) => {
    const textToSend = presetText || customMessage || 'Hello! 😊 Need help placing an order on Tyrelink';
    const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(textToSend)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const quickPrompts = [
    '🚗 Need help finding my tyre size',
    '🚚 Ask about delivery & fitment guidance',
    '🛡️ Warranty & verified manufacture dates'
  ];

  return (
    <div
      id="whatsapp-widget-container"
      className="fixed right-4 sm:right-6 z-40 sm:z-50 flex flex-col items-end transition-all duration-300"
      style={{ bottom: 'max(1.25rem, calc(0.85rem + env(safe-area-inset-bottom, 0px)))' }}
    >
      {/* WhatsApp Chat Popup Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="WhatsApp Chat Support"
        className={`mb-4 w-[330px] sm:w-[360px] max-w-[calc(100vw-2rem)] rounded-3xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] border border-slate-200/90 bg-white transition-all duration-300 origin-bottom-right ${isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-90 translate-y-6 pointer-events-none'
          }`}
      >
        {/* 1. Header (Classic WhatsApp Dark Teal) */}
        <div className="bg-[#075E54] text-white p-4 sm:p-4.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            {/* Avatar with Tyrelink branding and active online green dot */}
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-full bg-slate-900 flex items-center justify-center p-1.5 shadow-md border-2 border-white/20 overflow-hidden">
                <img src="/branding/logo-mark.svg" alt="Tyrelink" className="w-full h-full object-contain" />
              </div>
              {/* Online Green Indicator Dot */}
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#25D366] border-2 border-[#075E54] shadow-sm"></span>
            </div>

            {/* Title & Subtitle */}
            <div className="text-left">
              <h3 className="font-bold text-white text-base leading-tight font-display tracking-tight">
                {storeName}
              </h3>
              <p className="text-[11px] text-emerald-100/90 font-medium leading-tight mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Close 'X' Button */}
          <button
            onClick={() => setIsOpen(false)}
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close WhatsApp chat"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* 2. WhatsApp Chat Wallpaper & Message Stage */}
        <div
          className="relative p-4 sm:p-5 min-h-[220px] flex flex-col justify-between bg-[#EFEAE2]"
          style={{
            backgroundImage: `radial-gradient(#0000000d 1px, transparent 1px), radial-gradient(#0000000d 1px, #EFEAE2 1px)`,
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px'
          }}
        >
          {/* Incoming WhatsApp Speech Bubble */}
          <div className="relative max-w-[88%] bg-[#DCF8C6] text-slate-800 rounded-2xl rounded-tl-sm p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.12)] border border-[#C5E99B]/60 text-left animate-slide-up">
            {/* SVG Chat Bubble Tail (Top-Left) */}
            <div className="absolute -left-2 top-0 w-2.5 h-3 overflow-hidden pointer-events-none">
              <svg viewBox="0 0 10 12" className="w-full h-full fill-[#DCF8C6]">
                <path d="M10 0 C6 0 0 3 0 8 C2 4 6 1 10 0 Z" />
              </svg>
            </div>

            <p className="text-[13px] sm:text-sm font-medium leading-snug text-slate-900">
              Hello! 😊 Need help placing an order?
            </p>
            <p className="text-[11px] text-slate-600 font-sinhala mt-1 leading-snug">
              ඔබට කිසියම් භාණ්ඩයක් පිළිබඳ විමසීමට හෝ ඇණවුම් කිරීමට සහාය අවශ්‍යද?
            </p>

            {/* Bubble Timestamp & WhatsApp Blue Double Ticks */}
            <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-500 font-medium">
              <span>{currentTime || 'Just now'}</span>
              <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1] stroke-[2.5]" />
            </div>
          </div>

          {/* Quick Choice Question Chips */}
          <div className="mt-4 space-y-1.5 text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">Quick Inquiries:</p>
            <div className="flex flex-col gap-1.5">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleLaunchWhatsApp(prompt)}
                  className="w-full text-left text-xs bg-white/90 hover:bg-white text-slate-700 hover:text-emerald-700 font-medium px-3 py-2 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-400 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between group"
                >
                  <span className="truncate">{prompt}</span>
                  <Send className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Footer CTA Area */}
        <div className="bg-white p-4 border-t border-slate-100 text-center">
          {/* Big Green WhatsApp Us Pill Button */}
          <button
            type="button"
            onClick={() => handleLaunchWhatsApp()}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-sm sm:text-base shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/35 hover:scale-[1.02] active:scale-98 transition-all cursor-pointer"
          >
            {/* WhatsApp Logo Icon */}
            <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
            <span>WhatsApp Us</span>
          </button>

          {/* Status Subtext */}
          <div className="flex items-center justify-center gap-2 mt-2.5 text-[11px] text-slate-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse"></span>
            <span>Online | Privacy policy</span>
          </div>
        </div>
      </div>

      {/* Floating Circular Launcher Button */}
      <button
        id="whatsapp-launcher-btn"
        onClick={toggleOpen}
        type="button"
        aria-label="Open WhatsApp Support Chat"
        className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(37,211,102,0.45)] hover:scale-108 active:scale-95 transition-all duration-300 cursor-pointer group"
      >
        {/* Pulsing Aura Ring when unread */}
        {hasUnread && !isOpen && (
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-35 pointer-events-none"></span>
        )}

        {/* Unread Message Notification Dot */}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 min-w-[20px] min-h-[20px] aspect-square rounded-full bg-red-500 text-white font-black text-[10px] font-sans flex items-center justify-center shadow-md animate-bounce border-2 border-white leading-none pointer-events-none shrink-0">
            1
          </span>
        )}

        {/* WhatsApp Icon */}
        <svg className="w-6 h-6 sm:w-7 sm:h-7 fill-current transition-transform duration-300 group-hover:rotate-6" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      </button>
    </div>
  );
}
