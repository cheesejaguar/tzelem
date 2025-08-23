import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'overlay' | 'inline';
  message?: string;
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default', 
  message,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  const spinner = (
    <Loader2 
      className={`${sizeClasses[size]} animate-spin text-[var(--accent-primary)] ${className}`}
    />
  );

  if (variant === 'inline') {
    return (
      <span className="inline-flex items-center gap-2">
        {spinner}
        {message && <span className="text-sm text-[var(--text-secondary)]">{message}</span>}
      </span>
    );
  }

  if (variant === 'overlay') {
    return (
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-3">
          {spinner}
          {message && (
            <p className="text-sm text-[var(--text-secondary)] font-medium">
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      {spinner}
      {message && (
        <p className="text-sm text-[var(--text-secondary)] font-medium">
          {message}
        </p>
      )}
    </div>
  );
}

// Skeleton loading component for better perceived performance
export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-md ${className}`}>
      <div className="h-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite]" />
    </div>
  );
}

// For React Flow nodes loading
export function NodeLoadingSkeleton() {
  return (
    <div className="min-w-[200px] max-w-[300px] p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <LoadingSkeleton className="w-8 h-8 rounded-lg" />
        <div className="flex-1">
          <LoadingSkeleton className="h-4 w-24 mb-2" />
          <LoadingSkeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="space-y-2">
        <LoadingSkeleton className="h-3 w-full" />
        <LoadingSkeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}