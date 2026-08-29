import { Icon } from './Icon';
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export type ToastType = 'welcome' | 'success' | 'info' | 'error' | 'warning';

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastNotificationProps {
  toast: ToastOptions | null;
  onClose: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toast,
  onClose,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast?.duration || 6000; // 6 seconds default for optimal readability
  const startTimeRef = useRef<number | null>(null);
  const remainingTimeRef = useRef<number>(duration);

  useEffect(() => {
    if (!toast) return;

    remainingTimeRef.current = duration;
    startTimeRef.current = Date.now();
    const frameId = requestAnimationFrame(() => {
      setProgress(100);
    });

    const interval = setInterval(() => {
      if (!isPaused && startTimeRef.current !== null) {
        const elapsed = Date.now() - startTimeRef.current;
        const currentProgress = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(currentProgress);

        if (elapsed >= duration) {
          clearInterval(interval);
          onClose();
        }
      }
    }, 50);

    return () => {
      cancelAnimationFrame(frameId);
      clearInterval(interval);
    };
  }, [toast, duration, isPaused, onClose]);

  if (!toast) return null;

  const type = toast.type || (toast.message.toLowerCase().includes('bem-vindo') ? 'welcome' : 'info');

  const getThemeConfig = () => {
    switch (type) {
      case 'welcome':
        return {
          icon: 'auto_awesome',
          iconColor: 'text-amber-400',
          iconBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
          borderColor: 'border-blue-500/40',
          progressGradient: 'from-amber-400 via-blue-400 to-indigo-500',
          badgeText: 'Boas-vindas',
        };
      case 'success':
        return {
          icon: 'check_circle',
          iconColor: 'text-emerald-400',
          iconBg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
          borderColor: 'border-emerald-500/40',
          progressGradient: 'from-emerald-400 to-teal-500',
          badgeText: 'Sucesso',
        };
      case 'error':
        return {
          icon: 'error',
          iconColor: 'text-rose-400',
          iconBg: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
          borderColor: 'border-rose-500/40',
          progressGradient: 'from-rose-400 to-red-600',
          badgeText: 'Aviso',
        };
      case 'warning':
        return {
          icon: 'warning',
          iconColor: 'text-amber-400',
          iconBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
          borderColor: 'border-amber-500/40',
          progressGradient: 'from-amber-400 to-orange-500',
          badgeText: 'Atenção',
        };
      case 'info':
      default:
        return {
          icon: 'info',
          iconColor: 'text-sky-400',
          iconBg: 'bg-sky-500/20 border-sky-500/40 text-sky-300',
          borderColor: 'border-sky-500/40',
          progressGradient: 'from-sky-400 to-blue-600',
          badgeText: 'Informação',
        };
    }
  };

  const theme = getThemeConfig();

  return (
    <AnimatePresence>
      <motion.div
        key={toast.message + (toast.title || '')}
        initial={{ opacity: 0, y: -24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.96 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          setIsPaused(false);
          startTimeRef.current = Date.now() - (100 - progress) * (duration / 100);
        }}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => {
          setIsPaused(false);
          startTimeRef.current = Date.now() - (100 - progress) * (duration / 100);
        }}
        role="alert"
        aria-live="polite"
        id="global-toast-notification"
        className="fixed top-4 inset-x-3 mx-auto w-[calc(100vw-24px)] max-w-sm sm:max-w-md sm:inset-x-auto sm:right-6 sm:top-5 z-[9999] bg-slate-900/98 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden select-none"
      >
        <div className="p-3.5 sm:p-4 flex items-start gap-3">
          {/* Icon Badge */}
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border ${theme.iconBg} shadow-inner`}
          >
            <Icon name={theme.icon} className="text-[20px] sm:text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }} />
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pr-1">
            {toast.title ? (
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-white font-display tracking-tight leading-tight">
                  {toast.title}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {theme.badgeText}
                </span>
              </div>
            ) : null}
            <p className="text-xs sm:text-[13px] text-slate-200 leading-relaxed font-normal break-words">
              {toast.message}
            </p>

            {/* Action button if any */}
            {toast.actionLabel && toast.onAction && (
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    toast.onAction?.();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                >
                  <span>{toast.actionLabel}</span>
                  <Icon name="arrow_forward" className="text-[14px]" />
                </button>
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar notificação"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0 cursor-pointer -mr-1 -mt-1 active:scale-90"
          >
            <Icon name="close" className="text-[18px]" />
          </button>
        </div>

        {/* Progress Bar Timer */}
        <div className="w-full bg-slate-800/80 h-1">
          <div
            className={`h-full bg-gradient-to-r ${theme.progressGradient} transition-all duration-75`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
