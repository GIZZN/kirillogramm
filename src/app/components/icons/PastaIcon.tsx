import React from 'react';

interface PastaIconProps {
  size?: number;
  className?: string;
}

export default function PastaIcon({ size = 16, className }: PastaIconProps) {
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
        d="M12 2L3 7v10c0 5.55 3.84 5 9 5s9 .55 9-5V7l-9-5z"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        opacity="0.8"
      />
      <path
        d="M12 7c-2.5 0-4.5 1-4.5 2.5S9.5 12 12 12s4.5-1 4.5-2.5S14.5 7 12 7z"
        fill="currentColor"
        opacity="0.6"
      />
    </svg>
  );
}
