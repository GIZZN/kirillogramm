import React from 'react';

interface SoupIconProps {
  size?: number;
  className?: string;
}

export default function SoupIcon({ size = 16, className }: SoupIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M20 8H4c-1.1 0-2 .9-2 2v8c0 2.2 1.8 4 4 4h12c2.2 0 4-1.8 4-4v-8c0-1.1-.9-2-2-2z"
        fill="currentColor"
        opacity="0.8"
      />
      <circle cx="8" cy="5" r="1" fill="currentColor" opacity="0.6"/>
      <circle cx="12" cy="3" r="1" fill="currentColor" opacity="0.6"/>
      <circle cx="16" cy="5" r="1" fill="currentColor" opacity="0.6"/>
      <path
        d="M6 12c1 0 2 1 3 1s2-1 3-1 2 1 3 1 2-1 3-1"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
}
