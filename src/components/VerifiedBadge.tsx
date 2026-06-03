import React from "react";

interface VerifiedBadgeProps {
  className?: string;
  size?: number | string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ className, size }) => {
  const sizeStyle = size ? { width: size, height: size } : undefined;
  
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={sizeStyle}
    >
      {/* Background 8-lobed wavy/scalloped star badge (exactly matching uploaded image) */}
      <g fill="#9A3EF8">
        <rect x="86" y="86" width="340" height="340" rx="105" ry="105" />
        <rect x="86" y="86" width="340" height="340" rx="105" ry="105" transform="rotate(45 256 256)" />
      </g>
      {/* Centered bold rounded white checkmark */}
      <path
        d="M185 260 L235 310 L330 205"
        stroke="white"
        strokeWidth="44"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
