import React, { useId } from 'react';

/** Four-point Gemini-style sparkle filled with the brand gradient. */
export const Sparkle: React.FC<{ className?: string; spin?: boolean }> = ({
  className = 'h-6 w-6',
  spin = false,
}) => {
  const id = useId();
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`${className} ${spin ? 'animate-gemini-spin' : ''}`}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#4285f4" />
          <stop offset="0.5" stopColor="#9b72cb" />
          <stop offset="1" stopColor="#d96570" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id})`}
        d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z"
      />
    </svg>
  );
};
