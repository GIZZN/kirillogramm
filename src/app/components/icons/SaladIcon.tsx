import React from 'react';

interface SaladIconProps {
  size?: number;
  className?: string;
}

export default function SaladIcon({ size = 16, className }: SaladIconProps) {
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
        d="M3 18h18c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2z"
        fill="currentColor"
        opacity="0.8"
      />
      <circle cx="8" cy="12" r="2" fill="currentColor" opacity="0.7"/>
      <circle cx="16" cy="10" r="1.5" fill="currentColor" opacity="0.6"/>
      <circle cx="12" cy="8" r="1" fill="currentColor" opacity="0.5"/>
      <path
        d="M6 14c2-1 4 0 6-1s4 1 6 0"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M5 16c3-1 6 0 9-1s5 1 5 1"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}
