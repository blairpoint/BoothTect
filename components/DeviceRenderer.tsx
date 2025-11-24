import React from 'react';
import { DeviceDefinition, ControlFeature, BoothItem } from '../types';
import { THEME_COLORS } from '../constants';

interface DeviceRendererProps {
  device: DeviceDefinition;
  view: 'front' | 'back';
  onClick?: () => void;
  selected?: boolean;
}

const ControlShape: React.FC<{ control: ControlFeature }> = ({ control }) => {
  const { type, x, y, width = 10, height = 10, radius = 5, label, rotation, variant } = control;

  const stroke = variant === 'accent' ? THEME_COLORS.accent : THEME_COLORS.line;
  const fill = variant === 'filled' ? 'rgba(56, 189, 248, 0.1)' : 'transparent';
  const textStyle = { fontSize: '8px', fill: THEME_COLORS.text, fontFamily: 'Space Mono', textAnchor: 'middle' as const };

  switch (type) {
    case 'knob':
      return (
        <g transform={`translate(${x}, ${y})`}>
          <circle r={radius} stroke={stroke} fill={fill} strokeWidth="1.5" />
          <line x1="0" y1={-radius + 2} x2="0" y2={-radius + 8} stroke={stroke} strokeWidth="2" transform={`rotate(${rotation || 0})`} />
          {label && <text y={radius + 12} style={textStyle}>{label}</text>}
        </g>
      );
    case 'fader':
      return (
        <g transform={`translate(${x}, ${y})`}>
            {/* Slot */}
            <rect x={-width/2} y={0} width={width} height={height} stroke={THEME_COLORS.grid} fill="transparent" strokeWidth="1" rx="2" />
            <line x1="0" y1="5" x2="0" y2={height - 5} stroke={stroke} strokeWidth="1" opacity="0.5" />
            {/* Handle - visually rotate if needed, but usually faders are vertical unless specified */}
            <rect 
                x={-(width + 10)/2} 
                y={height/2 - 5} 
                width={width + 10} 
                height={15} 
                stroke={stroke} 
                fill={THEME_COLORS.fill} 
                strokeWidth="2" 
                rx="2"
                transform={rotation ? `rotate(${rotation})` : undefined}
            />
            {label && <text y={height + 12} style={textStyle}>{label}</text>}
        </g>
      );
    case 'button-round':
      return (
        <g transform={`translate(${x}, ${y})`}>
          <circle r={radius} stroke={stroke} fill={fill} strokeWidth="2" />
          {label && <text y={4} style={{...textStyle, fontSize: '6px', fill: stroke}}>{label}</text>}
        </g>
      );
    case 'button-rect':
      return (
        <g transform={`translate(${x}, ${y})`}>
          <rect width={width} height={height} stroke={stroke} fill={fill} strokeWidth="1.5" rx="2" />
          {label && <text x={width/2} y={height/2 + 3} style={{...textStyle, fontSize: '6px'}}>{label}</text>}
        </g>
      );
    case 'jog-wheel':
      return (
        <g transform={`translate(${x}, ${y})`}>
          <circle r={radius} stroke={THEME_COLORS.line} strokeWidth="1" fill={THEME_COLORS.fill} />
          <circle r={radius - 5} stroke={THEME_COLORS.line} strokeWidth="2" fill="transparent" strokeDasharray="4 4" opacity="0.6"/>
          <circle r={radius * 0.3} stroke={THEME_COLORS.accent} strokeWidth="1" fill="transparent" />
          {label && <text y={0} style={{...textStyle, fill: THEME_COLORS.accent, fontSize: '10px'}}>{label}</text>}
        </g>
      );
    case 'driver':
      return (
        <g transform={`translate(${x}, ${y})`}>
           {/* Driver Frame */}
          <circle r={radius} stroke={THEME_COLORS.line} strokeWidth="3" fill="#1e293b" />
          {/* Cone */}
          <circle r={radius * 0.8} stroke="#334155" strokeWidth="1" fill="#0f172a" />
          {/* Dust Cap */}
          <circle r={radius * 0.25} fill="#334155" />
          {/* Grid pattern overlay (optional styling) */}
          <path d={`M -${radius*0.5} 0 L ${radius*0.5} 0 M 0 -${radius*0.5} L 0 ${radius*0.5}`} stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
          
          {label && (
              <rect x={-20} y={-10} width={40} height={20} fill="rgba(0,0,0,0.8)" rx="4" />
          )}
          {label && <text y={4} style={{...textStyle, fill: '#fff', fontSize: '10px', fontWeight: 'bold'}}>{label}</text>}
        </g>
      );
    case 'screen':
      return (
        <g transform={`translate(${x}, ${y})`}>
           <rect width={width} height={height} stroke={THEME_COLORS.line} fill="rgba(0,0,0,0.3)" strokeWidth="1" />
           {/* Waveform representation */}
           <path d={`M 10 ${height/2} Q ${width/4} ${height/2 - 20} ${width/2} ${height/2} T ${width-10} ${height/2}`} stroke={THEME_COLORS.accent} fill="none" strokeWidth="2" />
           {label && <text x={width/2} y={height/2 + 20} style={textStyle}>{label}</text>}
        </g>
      );
    case 'pad-grid':
      return (
        <g transform={`translate(${x}, ${y})`}>
            {/* Simple 4x1 or 4x2 grid simulation based on width */}
            <rect width={width/4 - 2} height={height} x={0} stroke={stroke} fill="transparent" rx="2" />
            <rect width={width/4 - 2} height={height} x={width/4} stroke={stroke} fill="transparent" rx="2" />
            <rect width={width/4 - 2} height={height} x={width/2} stroke={stroke} fill="transparent" rx="2" />
            <rect width={width/4 - 2} height={height} x={width*0.75} stroke={stroke} fill="transparent" rx="2" />
        </g>
      );
    case 'port-xlr':
      return (
        <g transform={`translate(${x}, ${y})`}>
            <circle r={radius} stroke={THEME_COLORS.line} fill="transparent" strokeWidth="2" />
            <circle r={2} cx={-4} cy={-4} fill={THEME_COLORS.text} />
            <circle r={2} cx={4} cy={-4} fill={THEME_COLORS.text} />
            <circle r={2} cx={0} cy={5} fill={THEME_COLORS.text} />
            {label && <text y={radius + 12} style={textStyle}>{label}</text>}
        </g>
      );
    case 'port-rca':
      return (
        <g transform={`translate(${x}, ${y})`}>
            <circle r={radius} stroke={THEME_COLORS.line} fill={THEME_COLORS.fill} strokeWidth="2" />
            <circle r={radius/2} fill={THEME_COLORS.accent} />
            {label && <text y={radius + 12} style={textStyle}>{label}</text>}
        </g>
      );
    case 'port-power':
      return (
        <g transform={`translate(${x}, ${y})`}>
             <rect width={width} height={height} stroke={THEME_COLORS.text} fill="transparent" />
             <line x1={width/3} y1={5} x2={width/3} y2={height-5} stroke={THEME_COLORS.text} />
             <line x1={width*0.66} y1={5} x2={width*0.66} y2={height-5} stroke={THEME_COLORS.text} />
             {label && <text x={width/2} y={height+10} style={textStyle}>{label}</text>}
        </g>
      );
    case 'port-usb':
        return (
            <g transform={`translate(${x}, ${y})`}>
                <rect width={width} height={height} stroke={THEME_COLORS.line} fill="transparent" />
                <rect x={2} y={2} width={width-4} height={height/2} fill={THEME_COLORS.line} opacity="0.5"/>
                {label && <text x={width/2} y={-5} style={textStyle}>{label}</text>}
            </g>
        );
    default:
      return null;
  }
};

export const DeviceRenderer: React.FC<DeviceRendererProps> = ({ device, view, onClick, selected }) => {
  const controls = view === 'front' ? device.frontControls : device.backControls;
  // Use rearHeight if in back view and it exists, otherwise use standard height
  const currentHeight = (view === 'back' && device.rearHeight) ? device.rearHeight : device.height;
  
  return (
    <div 
        className={`relative inline-block transition-transform duration-200 ${selected ? 'scale-[1.02]' : ''}`}
        onClick={onClick}
    >
      <svg 
        width={device.width} 
        height={currentHeight} 
        viewBox={`0 0 ${device.width} ${currentHeight}`}
        className="overflow-visible drop-shadow-2xl"
      >
        <defs>
            <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        
        {/* Chassis */}
        <rect 
            x="0" y="0" 
            width={device.width} 
            height={currentHeight} 
            fill={THEME_COLORS.fill} 
            stroke={selected ? THEME_COLORS.accent : THEME_COLORS.line}
            strokeWidth={selected ? "3" : "2"}
            rx="8"
            className="transition-colors duration-300"
        />

        {/* Branding - Only show on front/top view for cleaners rear view */}
        {view === 'front' && (
            <text 
                x={device.width - 15} 
                y={20} 
                textAnchor="end" 
                fill={THEME_COLORS.text} 
                fontFamily="Space Mono" 
                fontSize="12"
                fontWeight="bold"
                opacity="0.5"
            >
                {device.manufacturer} {device.model}
            </text>
        )}

        {/* Controls */}
        {controls.map((control, idx) => (
          <ControlShape key={`${control.id}-${idx}`} control={control} />
        ))}

        {/* Status Light overlay */}
        {selected && (
             <circle cx={15} cy={15} r={4} fill={THEME_COLORS.accent} filter="url(#glow)">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
             </circle>
        )}
      </svg>
      
      {/* Label Tooltip styled overlay */}
      <div className="absolute -bottom-8 left-0 w-full text-center">
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded">
              {view === 'back' ? 'REAR VIEW' : 'TOP VIEW'}
          </span>
      </div>
    </div>
  );
};