import React from 'react';
import { X, CheckCircle, FileText, Zap, Music, Anchor } from 'lucide-react';
import { ManifestItem } from '../types';

interface ManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: () => void;
  manifest: ManifestItem[];
}

export const ManifestModal: React.FC<ManifestModalProps> = ({ isOpen, onClose, onAcknowledge, manifest }) => {
  if (!isOpen) return null;

  const devices = manifest.filter(m => m.category === 'device');
  const cables = manifest.filter(m => m.category === 'cable');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <h2 className="font-bold text-slate-100 text-lg">Setup Complete</h2>
                    <p className="text-xs text-slate-400">Equipment & Cabling Manifest</p>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition">
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
            
            {/* Devices Section */}
            <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Music className="w-3 h-3" /> Hardware
                </h3>
                <div className="space-y-2">
                    {devices.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                            <span className="text-slate-200 font-medium">{item.name}</span>
                            <span className="bg-slate-700 text-white text-xs font-mono py-1 px-2 rounded">x{item.quantity}</span>
                        </div>
                    ))}
                    {devices.length === 0 && <p className="text-sm text-slate-600 italic">No equipment selected.</p>}
                </div>
            </div>

            {/* Cables Section */}
            <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Zap className="w-3 h-3" /> Cabling Required
                </h3>
                <div className="space-y-2">
                    {cables.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                            <span className="text-slate-300 text-sm">{item.name}</span>
                            <span className="text-emerald-400 text-xs font-mono font-bold">x{item.quantity}</span>
                        </div>
                    ))}
                     {cables.length === 0 && <p className="text-sm text-slate-600 italic">No cables generated.</p>}
                </div>
            </div>

        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
            <button 
                onClick={onAcknowledge}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition shadow-lg shadow-emerald-900/20"
            >
                ACKNOWLEDGE
            </button>
        </div>

      </div>
    </div>
  );
};