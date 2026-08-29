import { Icon } from './Icon';
import React from 'react';

interface LoadingFallbackProps {
  message?: string;
  minHeight?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = 'A carregar...',
  minHeight = 'min-h-[280px]',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${minHeight} w-full`}>
      <div className="relative flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
        <Icon name="auto_awesome" className="absolute text-primary text-[18px]" />
      </div>
      <p className="mt-3 text-xs font-semibold text-on-surface-variant animate-pulse">
        {message}
      </p>
    </div>
  );
};
