import React, { useState } from 'react';
import { DEVICES } from '../data/equipment';
import { DeviceDefinition } from '../types';
import { Plus, Disc, Sliders, Box, Search, Headphones } from 'lucide-react';

interface SidebarProps {
  onAddDevice: (device: DeviceDefinition) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onAddDevice }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDevices = DEVICES.filter(d => 
    d.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIcon = (type: string) => {
    switch(type) {
      case 'PLAYER': return <Disc className="w-5 h-5 text-sky-400" />;
      case 'MIXER': return <Sliders className="w-5 h-5 text-pink-400" />;
      case 'ACCESSORY': return <Headphones className="w-5 h-5 text-emerald-400" />;
      default: return <Box className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="w-80 h-full bg-slate-900 border-r border-slate-700 flex flex-col shadow-2xl z-10">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold font-mono text-white mb-2 tracking-tighter">BOOTH<span className="text-sky-400">ARCHITECT</span></h1>
        <p className="text-xs text-slate-400">Build your dream rider visually.</p>
      </div>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Filter equipment..." 
            className="w-full bg-slate-800 border border-slate-600 rounded-md py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-sky-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredDevices.map(device => (
          <div 
            key={device.id}
            onClick={() => onAddDevice(device)}
            className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-sky-500/50 p-4 rounded-lg cursor-pointer transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 rounded-md">
                    {getIcon(device.type)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-200 group-hover:text-sky-400 transition-colors">{device.model}</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">{device.manufacturer}</p>
                </div>
              </div>
              <Plus className="w-5 h-5 text-slate-600 group-hover:text-white" />
            </div>
            <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                {device.description}
            </p>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-slate-700 text-center">
        <p className="text-[10px] text-slate-600 font-mono">v1.0.0 • BOOTH ARCHITECT</p>
      </div>
    </div>
  );
};