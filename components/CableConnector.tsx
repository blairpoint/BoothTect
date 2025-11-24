import React from 'react';
import { THEME_COLORS } from '../constants';

interface CableConnectorProps {
  type: 'power' | 'audio' | 'data' | 'ground';
  gender: 'male' | 'female'; // 'male' = pins, 'female' = holes
  label?: string;
  className?: string;
}

export const CableConnector: React.FC<CableConnectorProps> = ({ type, gender, label, className }) => {
  const stroke = THEME_COLORS.line;
  const fill = THEME_COLORS.fill;
  
  // Logic to potentially switch colors if needed, but keeping consistent for now
  
  const renderShape = () => {
    switch (type) {
      case 'audio': 
        return (
          <g>
            {/* Outer Shell */}
            <circle cx="0" cy="0" r="25" stroke={stroke} strokeWidth="2" fill={fill} />
            <circle cx="0" cy="0" r="22" stroke={stroke} strokeWidth="1" strokeDasharray="2 2" fill="none" />
            
            {/* Pins/Holes */}
            <g transform="translate(0, 2)">
              {gender === 'male' ? (
                <>
                  <circle cx="0" cy="12" r="3" fill={stroke} />
                  <circle cx="-10" cy="-5" r="3" fill={stroke} />
                  <circle cx="10" cy="-5" r="3" fill={stroke} />
                </>
              ) : (
                <>
                  <circle cx="0" cy="12" r="3" stroke={stroke} fill="black" />
                  <circle cx="-10" cy="-5" r="3" stroke={stroke} fill="black" />
                  <circle cx="10" cy="-5" r="3" stroke={stroke} fill="black" />
                </>
              )}
            </g>
            {/* Tab/Latch */}
            <rect x="-4" y="-29" width="8" height="6" fill={stroke} />
          </g>
        );
      
      case 'power': 
        return (
          <g>
            {/* IEC C13 Shape */}
            <path 
              d="M -15 -10 L 15 -10 L 20 5 L 10 15 L -10 15 L -20 5 Z" 
              stroke={stroke} strokeWidth="2" fill={fill} 
            />
            {/* Holes */}
            <rect x="-12" y="-2" width="6" height="10" fill="none" stroke={stroke} />
            <rect x="6" y="-2" width="6" height="10" fill="none" stroke={stroke} />
            <rect x="-3" y="5" width="6" height="6" fill="none" stroke={stroke} transform="translate(0, -10)" />
          </g>
        );

      case 'data': // USB
      case 'ground':
        return (
           <g>
             <rect x="-15" y="-20" width="30" height="40" stroke={stroke} fill={fill} rx="2" />
             <rect x="-10" y="-10" width="8" height="10" stroke={stroke} fill="none" />
             <rect x="2" y="-10" width="8" height="10" stroke={stroke} fill="none" />
           </g>
        );
        
      default: 
        return <circle r="10" fill="red"/>;
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <span className="mb-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
        {gender}
      </span>
      
      <div className="bg-slate-900 border border-slate-600 p-2 rounded-lg shadow-2xl flex flex-col items-center relative z-10">
        <svg width="60" height="60" viewBox="-30 -30 60 60">
          {renderShape()}
        </svg>
        <div className="mt-1 px-2 py-0.5 bg-slate-800 rounded text-[10px] font-mono text-slate-300 border border-slate-700 whitespace-nowrap">
          {label || type.toUpperCase()}
        </div>
      </div>
    </div>
  );
};