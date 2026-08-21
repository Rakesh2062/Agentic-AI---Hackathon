import React from "react";

export function NagarSetuLogo({ className = "w-6 h-6", ...props }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="nsSkyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="nsEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="nsBridgeGrad" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>

      {/* City Skyline Buildings (Nagar) */}
      {/* Left Tower */}
      <rect x="11" y="19" width="6.5" height="18" rx="1" fill="url(#nsSkyGrad)" fillOpacity="0.75" />
      {/* Right Tower */}
      <rect x="30.5" y="21" width="6.5" height="16" rx="1" fill="url(#nsSkyGrad)" fillOpacity="0.75" />
      {/* Center Civic Tower */}
      <rect x="20.5" y="13" width="7" height="24" rx="1" fill="url(#nsSkyGrad)" />

      {/* Location Beacon & Spire Apex */}
      <path d="M24 5.5L28.5 13H19.5L24 5.5Z" fill="url(#nsBridgeGrad)" />
      <circle cx="24" cy="5" r="1.75" fill="#38bdf8" />

      {/* Modern Architectural Window Cutouts */}
      <rect x="13" y="22" width="2.5" height="2" rx="0.5" fill="#ffffff" fillOpacity="0.85" />
      <rect x="13" y="26" width="2.5" height="2" rx="0.5" fill="#ffffff" fillOpacity="0.6" />
      <rect x="22.75" y="16" width="2.5" height="2.5" rx="0.5" fill="#ffffff" fillOpacity="0.95" />
      <rect x="22.75" y="21" width="2.5" height="2.5" rx="0.5" fill="#ffffff" fillOpacity="0.8" />
      <rect x="22.75" y="26" width="2.5" height="2.5" rx="0.5" fill="#ffffff" fillOpacity="0.6" />
      <rect x="32.5" y="24" width="2.5" height="2" rx="0.5" fill="#ffffff" fillOpacity="0.85" />
      <rect x="32.5" y="28" width="2.5" height="2" rx="0.5" fill="#ffffff" fillOpacity="0.6" />

      {/* Setu Suspension Stay Lines */}
      <path d="M24 14L9 38M24 14L39 38" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.45" strokeLinecap="round" />
      <path d="M24 19L14 38M24 19L34 38" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.35" strokeLinecap="round" />

      {/* Sweeping Bridge Arch (Setu) */}
      <path
        d="M5 38.5C14.5 28.5 33.5 28.5 43 38.5"
        stroke="url(#nsBridgeGrad)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />

      {/* Base Civic Foundation Deck */}
      <path
        d="M4.5 41H43.5"
        stroke="url(#nsEmeraldGrad)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Community Connection Nodes */}
      <circle cx="9" cy="38" r="1.5" fill="#38bdf8" />
      <circle cx="24" cy="33.5" r="1.75" fill="#67e8f9" />
      <circle cx="39" cy="38" r="1.5" fill="#34d399" />
    </svg>
  );
}

export default NagarSetuLogo;
