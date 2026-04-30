/**
 * Stylized brand silhouette — retro-futuristic film aesthetic.
 * Scanline-filled geometric mark, surrounded by film sprocket holes.
 * Replace this component with your own logo/illustration when you're
 * ready to brand the template.
 */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Scanline pattern */}
        <pattern
          id="scanlines"
          patternUnits="userSpaceOnUse"
          width="200"
          height="4"
        >
          <rect width="200" height="2" fill="#F5A623" />
          <rect y="2" width="200" height="2" fill="#F5A62360" />
        </pattern>
        {/* Glow filter */}
        <filter id="brand-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Stacked frame — 5 horizontal bars, scanline-filled, evokes a film strip cell */}
      <g filter="url(#brand-glow)">
        {[60, 78, 96, 114, 132].map((y, i) => {
          const inset = Math.abs(i - 2) * 14;
          return (
            <rect
              key={y}
              x={50 + inset}
              y={y}
              width={100 - inset * 2}
              height="10"
              rx="2"
              fill="url(#scanlines)"
              opacity={0.85 - Math.abs(i - 2) * 0.1}
            />
          );
        })}
      </g>

      {/* Film sprocket holes — left */}
      {[30, 60, 90, 120, 150].map((y) => (
        <rect
          key={`l${y}`}
          x="8"
          y={y}
          width="8"
          height="12"
          rx="2"
          fill="#F5A62320"
        />
      ))}

      {/* Film sprocket holes — right */}
      {[30, 60, 90, 120, 150].map((y) => (
        <rect
          key={`r${y}`}
          x="184"
          y={y}
          width="8"
          height="12"
          rx="2"
          fill="#F5A62320"
        />
      ))}

      {/* Film border lines */}
      <rect x="20" y="10" width="1" height="180" fill="#F5A62315" />
      <rect x="179" y="10" width="1" height="180" fill="#F5A62315" />
    </svg>
  );
}
