import React, { useState } from 'react';

type SomaticPartDef = {
  id: string;
  label: string;
  shapes: Array<{
    type: 'circle' | 'ellipse' | 'rect';
    cx?: number; cy?: number; r?: number;
    rx?: number; ry?: number;
    x?: number; y?: number; w?: number; h?: number;
    transform?: string;
  }>;
};

const BODY_PARTS: SomaticPartDef[] = [
  { 
    id: 'Head', label: 'Head & Brain',
    shapes: [{ type: 'circle', cx: 50, cy: 20, r: 15 }]
  },
  { 
    id: 'Jaw', label: 'Jaw & Face',
    shapes: [{ type: 'ellipse', cx: 50, cy: 30, rx: 12, ry: 6 }]
  },
  { 
    id: 'Neck', label: 'Neck & Throat',
    shapes: [{ type: 'ellipse', cx: 50, cy: 40, rx: 14, ry: 8 }]
  },
  { 
    id: 'Shoulders', label: 'Shoulders',
    shapes: [{ type: 'ellipse', cx: 50, cy: 48, rx: 32, ry: 10 }]
  },
  { 
    id: 'Chest', label: 'Chest & Heart',
    shapes: [{ type: 'circle', cx: 50, cy: 65, r: 18 }]
  },
  { 
    id: 'Stomach', label: 'Gut & Digestion',
    shapes: [{ type: 'circle', cx: 50, cy: 95, r: 18 }]
  },
  { 
    id: 'Pelvis', label: 'Pelvis & Hips',
    shapes: [{ type: 'ellipse', cx: 50, cy: 115, rx: 22, ry: 12 }]
  },
  { 
    id: 'Arms', label: 'Arms',
    shapes: [
      { type: 'ellipse', cx: 22, cy: 80, rx: 12, ry: 35, transform: "rotate(10 22 80)" },
      { type: 'ellipse', cx: 78, cy: 80, rx: 12, ry: 35, transform: "rotate(-10 78 80)" }
    ]
  },
  { 
    id: 'Hands', label: 'Hands',
    shapes: [
      { type: 'circle', cx: 12, cy: 135, r: 11 },
      { type: 'circle', cx: 88, cy: 135, r: 11 }
    ]
  },
  { 
    id: 'Legs', label: 'Legs',
    shapes: [
      { type: 'ellipse', cx: 38, cy: 150, rx: 12, ry: 40 },
      { type: 'ellipse', cx: 62, cy: 150, rx: 12, ry: 40 },
      { type: 'ellipse', cx: 38, cy: 205, rx: 10, ry: 30 },
      { type: 'ellipse', cx: 62, cy: 205, rx: 10, ry: 30 },
    ]
  },
  { 
    id: 'Feet', label: 'Feet',
    shapes: [
      { type: 'ellipse', cx: 38, cy: 235, rx: 12, ry: 8 },
      { type: 'ellipse', cx: 62, cy: 235, rx: 12, ry: 8 }
    ]
  }
];

export function SomaticBodyMap({ selectedParts, togglePart }: { selectedParts: string[], togglePart: (part: string) => void }) {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  const renderShape = (shape: any, key: string, isSelected: boolean, isHovered: boolean, partId: string) => {
    const color = isSelected ? '#ef4444' : 'transparent';
    const highlightClasses = `transition-all duration-300 ${isSelected ? 'opacity-60' : 'opacity-0'} hover:fill-[#ef4444] cursor-pointer hover:opacity-40`;

    const props = {
      fill: color,
      className: highlightClasses,
      onClick: () => togglePart(partId),
      onMouseEnter: () => setHoveredPart(partId),
      onMouseLeave: () => setHoveredPart(null),
      transform: shape.transform
    };

    if (shape.type === 'circle') {
      return <circle key={key} cx={shape.cx} cy={shape.cy} r={shape.r} {...props} />;
    } else if (shape.type === 'ellipse') {
      return <ellipse key={key} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...props} />;
    } else if (shape.type === 'rect') {
      return <rect key={key} x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.rx} ry={shape.ry} {...props} />;
    }
    return null;
  };

  return (
    <div className="relative w-full max-w-[200px] mx-auto opacity-90 transition-opacity">
      <svg viewBox="0 0 100 250" className="w-full h-auto drop-">
        {/* Base Mannequin Silhouette */}
        <g fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5">
          {/* Head */}
          <circle cx="50" cy="20" r="14" />
          {/* Neck */}
          <rect x="44" y="30" width="12" height="15" rx="4" />
          {/* Shoulders */}
          <rect x="25" y="40" width="50" height="20" rx="10" />
          {/* Chest / Upper Torso */}
          <rect x="30" y="50" width="40" height="40" rx="8" />
          {/* Lower Torso / Stomach */}
          <rect x="32" y="80" width="36" height="35" rx="8" />
          {/* Pelvis */}
          <rect x="30" y="105" width="40" height="20" rx="10" />
          {/* Arms */}
          <rect x="20" y="45" width="14" height="60" rx="7" transform="rotate(10 27 45)" />
          <rect x="66" y="45" width="14" height="60" rx="7" transform="rotate(-10 73 45)" />
          {/* Forearms & Hands */}
          <rect x="10" y="100" width="12" height="45" rx="6" transform="rotate(8 16 100)" />
          <rect x="78" y="100" width="12" height="45" rx="6" transform="rotate(-8 84 100)" />
          {/* Legs */}
          <rect x="31" y="115" width="16" height="70" rx="8" />
          <rect x="53" y="115" width="16" height="70" rx="8" />
          {/* Calves & Feet */}
          <rect x="32" y="180" width="14" height="55" rx="7" />
          <rect x="54" y="180" width="14" height="55" rx="7" />
        </g>

        {/* Interactive Overlay Zones */}
        {BODY_PARTS.map((part) => {
          const isSelected = selectedParts.includes(part.id);
          const isHovered = hoveredPart === part.id;
          
          return (
            <g key={part.id}>
              <title>{part.label}</title>
              {part.shapes.map((shape, idx) => 
                renderShape(shape, `${part.id}-${idx}`, isSelected, isHovered, part.id)
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
