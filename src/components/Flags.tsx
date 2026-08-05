import React from 'react';

export const FlagES = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 18" width="18" height="14" className={className} aria-label="Español">
    <rect width="24" height="18" fill="#C60B1E"/>
    <rect y="4" width="24" height="10" fill="#FFC400"/>
    <g transform="translate(12,9)">
      <path d="M-1.5,-2 Q0,-4 1.5,-2 L1.5,2 Q0,4 -1.5,2 Z" fill="#C60B1E" stroke="#AA151B" strokeWidth="0.3"/>
      <rect x="-1.5" y="-2" width="3" height="4" fill="#AA151B" rx="0.5"/>
      <rect x="-0.5" y="2" width="1" height="2" fill="#C60B1E"/>
    </g>
  </svg>
);

export const FlagPT = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 18" width="18" height="14" className={className} aria-label="Português">
    <rect width="24" height="18" fill="#009739"/>
    <polygon points="12,1 23,9 12,17 1,9" fill="#FFD700"/>
    <circle cx="12" cy="9" r="4.5" fill="#002776"/>
    <path d="M9,9 Q12,11 15,9" stroke="#FFFFFF" strokeWidth="0.8" fill="none"/>
    <circle cx="11" cy="8.5" r="0.4" fill="#FFFFFF"/>
    <circle cx="13" cy="8.5" r="0.4" fill="#FFFFFF"/>
    <circle cx="12" cy="7.5" r="0.35" fill="#FFFFFF"/>
    <circle cx="10.5" cy="9.5" r="0.3" fill="#FFFFFF"/>
    <circle cx="13.5" cy="9.5" r="0.3" fill="#FFFFFF"/>
  </svg>
);

export const FlagEN = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 18" width="18" height="14" className={className} aria-label="English">
    <rect width="24" height="18" fill="#012169"/>
    <path d="M0,0 L24,18 M24,0 L0,18" stroke="#FFFFFF" strokeWidth="2.4"/>
    <path d="M24,0 L0,18" stroke="#C8102E" strokeWidth="0.8"/>
    <path d="M0,18 L24,0 M24,18 L0,0" stroke="#FFFFFF" strokeWidth="2.4"/>
    <path d="M0,18 L24,0" stroke="#C8102E" strokeWidth="0.8"/>
    <rect x="10.5" width="3" height="18" fill="#FFFFFF"/>
    <rect y="7.5" width="24" height="3" fill="#FFFFFF"/>
    <rect x="11.1" width="1.8" height="18" fill="#C8102E"/>
    <rect y="8.1" width="24" height="1.8" fill="#C8102E"/>
  </svg>
);
