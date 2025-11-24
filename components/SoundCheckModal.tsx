import React, { useMemo, useState } from 'react';
import { X, Printer, CheckCircle, AlertTriangle, Box, Download, Loader2 } from 'lucide-react';
import { Cable, BoothItem } from '../types';
import { DEVICES } from '../data/equipment';
import { CableConnector } from './CableConnector';
import { DeviceRenderer } from './DeviceRenderer';
import { THEME_COLORS } from '../constants';

interface SoundCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  cables: Cable[];
  items: BoothItem[];
}

export const SoundCheckModal: React.FC<SoundCheckModalProps> = ({ isOpen, onClose, cables, items }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const element = document.getElementById('printable-area');
    if (!element) return;
    
    setIsGenerating(true);

    const opt = {
        margin: [0.2, 0.2, 0.2, 0.2], // inch margins
        filename: `Booth_Setup_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            letterRendering: true,
            scrollY: 0
        },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    const w = window as any;
    if (w.html2pdf) {
        w.html2pdf().set(opt).from(element).save().then(() => {
            setIsGenerating(false);
        }).catch((err: any) => {
            console.error('PDF Generation Error:', err);
            setIsGenerating(false);
            alert('Could not generate PDF file. Please use the Print button instead.');
        });
    } else {
        setIsGenerating(false);
        alert("PDF Generator library not loaded. Please use the Print button.");
    }
  };

  // --- Helper Functions for List ---

  const getDeviceAndPort = (instanceId: string, portId: string) => {
    const item = items.find(i => i.instanceId === instanceId);
    if (!item) return { model: 'Unknown Device', manufacturer: 'Unknown', portName: 'Unknown Port', portType: 'generic', portLabel: '' };

    const def = DEVICES.find(d => d.id === item.deviceId);
    if (!def) return { model: 'Unknown Model', manufacturer: 'Unknown', portName: 'Unknown Port', portType: 'generic', portLabel: '' };

    const port = def.backControls.find(p => p.id === portId) || def.frontControls.find(p => p.id === portId);
    return { 
        model: def.model, 
        manufacturer: def.manufacturer,
        portName: port?.label || portId,
        portType: port?.type,
        portLabel: port?.label || ''
    };
  };

  const getPortGender = (portType: string | undefined, label: string): 'male' | 'female' | 'neutral' => {
      if (!portType) return 'neutral';
      const l = label.toUpperCase();
      
      if (portType === 'port-xlr') {
          if (l.includes('IN') || l.includes('RETURN') || l.includes('MIC')) return 'female';
          if (l.includes('OUT') || l.includes('THRU') || l.includes('MASTER') || l.includes('BOOTH') || l.includes('SEND') || l.includes('MAIN')) return 'male';
          return 'male'; 
      }
      if (portType === 'port-rca') return 'female'; 
      if (portType === 'port-power') {
          if (l.includes('IN') || l.includes('MAINS')) return 'male';
          return 'female'; 
      }
      return 'neutral';
  }

  const sortedCables = useMemo(() => {
      // Sort by type, then by instance ID to keep grouped
      return [...cables].sort((a, b) => {
          if (a.type !== b.type) return a.type.localeCompare(b.type);
          return a.fromInstanceId.localeCompare(b.fromInstanceId);
      });
  }, [cables]);

  // --- Equipment Manifest Logic ---
  const equipmentList = useMemo(() => {
      const counts = new Map<string, { count: number, manufacturer: string, model: string, type: string }>();
      
      items.forEach(item => {
          const def = DEVICES.find(d => d.id === item.deviceId);
          if (!def) return;
          
          const key = def.id;
          if (!counts.has(key)) {
              counts.set(key, { count: 0, manufacturer: def.manufacturer, model: def.model, type: def.type });
          }
          counts.get(key)!.count++;
      });
      
      // Sort by Type then Model
      return Array.from(counts.values()).sort((a, b) => a.type.localeCompare(b.type) || a.model.localeCompare(b.model));
  }, [items]);

  // --- Diagram Logic ---

  // Calculate Diagram Bounds
  const { minX, minY, width: contentWidth, height: contentHeight } = useMemo(() => {
      if (items.length === 0) return { minX: 0, minY: 0, width: 800, height: 600 };
      
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      items.forEach(item => {
          const def = DEVICES.find(d => d.id === item.deviceId);
          if (!def) return;
          // Use layout coordinates
          minX = Math.min(minX, item.x);
          minY = Math.min(minY, item.y);
          // Use Dimensions (approximate max extent considering rear/front views)
          maxX = Math.max(maxX, item.x + def.width);
          maxY = Math.max(maxY, item.y + Math.max(def.height, def.rearHeight || 0));
      });

      const PADDING = 100;
      return { 
          minX: minX - PADDING, 
          minY: minY - PADDING, 
          width: (maxX - minX) + (PADDING * 2), 
          height: (maxY - minY) + (PADDING * 2) 
      };
  }, [items]);

  // Calculate Scale to fit in print width (approx 750px)
  const fitScale = items.length > 0 ? Math.min(1, 750 / contentWidth) : 1;

  // Helper to get relative port position for diagram (Shifted by minX/minY)
  const getDiagramPortPos = (instanceId: string, portId: string) => {
      const item = items.find(i => i.instanceId === instanceId);
      if (!item) return { x: 0, y: 0 };

      const def = DEVICES.find(d => d.id === item.deviceId);
      if (!def) return { x: 0, y: 0 };

      // Force Rear View Logic for Diagram
      let control = def.backControls.find(c => c.id === portId);
      let x = 0, y = 0;

      if (control) {
          x = item.x + control.x;
          y = item.y + control.y;
      } else {
          control = def.frontControls.find(c => c.id === portId);
          if (control) {
               x = item.x + control.x;
               y = item.y; // Snap to top edge in rear view
          } else {
               x = item.x;
               y = item.y;
          }
      }
      
      return { x: x - minX, y: y - minY };
  };

  // Geometry Calculator (Mirrors App.tsx)
  const calculatePath = (start: {x: number, y: number}, end: {x: number, y: number}, index: number) => {
      const isVerticalDrop = Math.abs(start.x - end.x) < 5 && end.y > start.y + 100;
      if (isVerticalDrop) return `M ${start.x} ${start.y} L ${start.x} ${end.y}`;

      const LANE_HEIGHT = 12;
      const laneOffset = (index % 8) * LANE_HEIGHT;
      const BASE_CLEARANCE = 80;
      const channelY = Math.max(start.y, end.y) + BASE_CLEARANCE + laneOffset;
      const radius = 15;
      const dirX = end.x > start.x ? 1 : -1;
      
      if (Math.abs(end.x - start.x) < radius * 2) {
           return `M ${start.x} ${start.y} L ${start.x} ${channelY} L ${end.x} ${channelY} L ${end.x} ${end.y}`;
      }

      return `M ${start.x} ${start.y} L ${start.x} ${channelY - radius} Q ${start.x} ${channelY} ${start.x + (radius * dirX)} ${channelY} L ${end.x - (radius * dirX)} ${channelY} Q ${end.x} ${channelY} ${end.x} ${channelY - radius} L ${end.x} ${end.y}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-lg shadow-2xl flex flex-col overflow-hidden relative print:h-auto print:shadow-none print:w-full print:max-w-none print:rounded-none print:overflow-visible">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 print:hidden">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Sound Check & Patch List</h2>
            <p className="text-sm text-gray-500">Review connections and print for the stage crew.</p>
          </div>
          <div className="flex gap-2">
             <button 
                onClick={handleDownloadPdf} 
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition font-medium border border-slate-600 disabled:opacity-50 disabled:cursor-wait"
            >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download PDF
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium shadow-lg shadow-indigo-500/20">
                <Printer className="w-4 h-4" />
                Print / Save as PDF
            </button>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800 transition">
                <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible bg-white" id="printable-area">
            
            <div className="mb-8 border-b-2 border-black pb-4">
                <h1 className="text-3xl font-black uppercase tracking-tight text-black mb-2">Technical Rider & Sound Check</h1>
                <div className="flex justify-between text-sm font-mono text-gray-600">
                    <p>GENERATED BY BOOTH ARCHITECT</p>
                    <p>{new Date().toLocaleDateString()} // {items.length} DEVICES // {cables.length} CABLES</p>
                </div>
            </div>

            {/* Equipment Manifest */}
            <div className="mb-8 break-inside-avoid print:break-inside-avoid">
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-3">
                    Equipment Required
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {equipmentList.map((eq, idx) => (
                         <div key={idx} className="flex items-center justify-between bg-gray-50 print:bg-white border border-gray-200 print:border-gray-300 rounded p-3 shadow-sm print:shadow-none">
                            <div className="flex items-center gap-3">
                                <div className="hidden print:hidden md:block p-2 bg-white rounded border border-gray-200 text-gray-400">
                                    <Box className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-gray-900 leading-tight">{eq.model}</div>
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500">{eq.manufacturer}</div>
                                </div>
                            </div>
                            <div className="text-lg font-bold font-mono text-indigo-600 print:text-black bg-indigo-50 print:bg-gray-100 border border-indigo-100 print:border-gray-200 px-3 py-1 rounded">
                                x{eq.count}
                            </div>
                         </div>
                    ))}
                </div>
            </div>

            {/* Visual Diagram */}
            <div className="mb-10 break-inside-avoid print:break-inside-avoid flex flex-col">
                <div className="flex items-center justify-between mb-4 border-l-4 border-indigo-500 pl-3">
                    <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">
                        System Schematic (Rear View)
                    </h3>
                     <span className="text-xs font-mono text-gray-400 hidden print:inline-block">
                        Scale: {Math.round(fitScale * 100)}%
                    </span>
                </div>
                
                <div className="w-full border border-gray-200 rounded-lg print:border-none print:bg-white overflow-hidden bg-slate-50 flex justify-center py-8 print:py-0">
                    <div style={{ 
                        width: contentWidth * fitScale, 
                        height: contentHeight * fitScale, 
                        position: 'relative',
                     }}>
                        <div 
                            style={{ 
                                transform: `scale(${fitScale})`, 
                                transformOrigin: 'top left',
                                width: contentWidth,
                                height: contentHeight,
                                position: 'absolute',
                                top: 0, left: 0
                            }}
                            className="print:print-color-adjust-exact"
                        >
                            {/* Cables Layer */}
                            <svg width={contentWidth} height={contentHeight} className="absolute inset-0 z-10 pointer-events-none overflow-visible">
                                {sortedCables.map((cable, idx) => {
                                    const start = getDiagramPortPos(cable.fromInstanceId, cable.fromPortId);
                                    let end = { x: start.x, y: start.y + 100 }; // Dangling default
                                    if (cable.toInstanceId) {
                                            end = getDiagramPortPos(cable.toInstanceId, cable.toPortId!);
                                    }
                                    
                                    let color = THEME_COLORS.line;
                                    if (cable.type === 'power') color = '#f59e0b';
                                    if (cable.type === 'audio') color = '#ef4444';
                                    if (cable.type === 'ground') color = '#10b981';
                                    if (cable.type === 'data') color = '#3b82f6';

                                    const d = calculatePath(start, end, idx);

                                    return (
                                        <g key={cable.id}>
                                            <path d={d} stroke="white" strokeWidth="8" fill="none" />
                                            <path d={d} stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
                                            <circle cx={start.x} cy={start.y} r="4" fill={color} stroke="white" strokeWidth="1" />
                                            <circle cx={end.x} cy={end.y} r="4" fill={color} stroke="white" strokeWidth="1" />
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* Devices Layer */}
                            {items.map(item => {
                                const def = DEVICES.find(d => d.id === item.deviceId);
                                if (!def) return null;
                                return (
                                    <div 
                                        key={item.instanceId} 
                                        style={{
                                            position: 'absolute',
                                            left: item.x - minX,
                                            top: item.y - minY
                                        }}
                                    >
                                        <DeviceRenderer device={def} view="back" />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Connection List */}
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-6 border-l-4 border-indigo-500 pl-3">
                Patch List
            </h3>

            <div className="space-y-6">
                {sortedCables.map((cable, idx) => {
                    const fromInfo = getDeviceAndPort(cable.fromInstanceId, cable.fromPortId);
                    const toInfo = cable.toInstanceId && cable.toPortId 
                        ? getDeviceAndPort(cable.toInstanceId, cable.toPortId) 
                        : { model: 'Floor / Snake', manufacturer: 'House', portName: 'Stage Box', portType: 'generic', portLabel: 'Input' };

                    let cableStartGender: 'male' | 'female' = 'female';
                    let cableEndGender: 'male' | 'female' = 'male';
                    let startLabel = 'PLUG';
                    let endLabel = 'PLUG';

                    const fromPortGender = getPortGender(fromInfo.portType, fromInfo.portLabel);
                    const toPortGender = getPortGender(toInfo.portType, toInfo.portLabel);

                    if (cable.type === 'audio') {
                        if (fromInfo.portType === 'port-rca') {
                            cableStartGender = 'male';
                            startLabel = 'RCA MALE';
                        } else {
                            cableStartGender = 'female';
                            startLabel = 'XLR FEMALE';
                        }

                        if (toInfo.portType === 'port-rca') {
                            cableEndGender = 'male';
                            endLabel = 'RCA MALE';
                        } else {
                            cableEndGender = 'male';
                            endLabel = 'XLR MALE';
                        }
                    } else if (cable.type === 'power') {
                        cableStartGender = 'female'; 
                        startLabel = 'IEC C13';
                        cableEndGender = 'male'; 
                        endLabel = 'MAINS PLUG';
                    }

                    const potentialMismatch = (toPortGender === 'male' && cableEndGender === 'male') || 
                                              (toPortGender === 'female' && (cableEndGender as string) === 'female');

                    return (
                        <div key={cable.id} className="break-inside-avoid border border-gray-300 rounded-xl p-6 bg-gray-50 print:bg-white print:border-black print:shadow-none shadow-sm">
                            
                            <div className="flex items-center gap-2 mb-4">
                                <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border ${
                                    cable.type === 'audio' ? 'bg-red-100 text-red-800 border-red-200' :
                                    cable.type === 'power' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                    'bg-blue-100 text-blue-800 border-blue-200'
                                }`}>
                                    {cable.type} CABLE #{idx + 1}
                                </span>
                                <div className="h-px flex-1 bg-gray-300 print:bg-black"></div>
                                {potentialMismatch && cable.type === 'audio' && (
                                     <div className="flex items-center gap-1 text-amber-600 text-xs font-bold px-2 py-1 bg-amber-50 border border-amber-200 rounded">
                                         <AlertTriangle className="w-3 h-3" />
                                         CHECK GENDER
                                     </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                                
                                {/* FROM */}
                                <div className="flex flex-col items-center text-center">
                                    <div className="bg-white print:border-black p-4 rounded-lg border border-gray-200 w-full flex flex-col items-center relative shadow-sm">
                                        <div className="font-bold text-lg text-black">{fromInfo.model}</div>
                                        <div className="text-gray-500 text-sm mb-4">{fromInfo.manufacturer}</div>
                                        
                                        <div className="bg-gray-100 rounded p-2 mb-2 w-full">
                                            <span className="font-mono font-bold text-black">{fromInfo.portName}</span>
                                            {fromPortGender !== 'neutral' && (
                                                <span className="block text-[10px] text-gray-500 uppercase">
                                                    PORT: {fromPortGender === 'male' ? 'PINS' : 'HOLES'}
                                                </span>
                                            )}
                                        </div>

                                        <div className="scale-75 origin-center -my-2 p-2 bg-slate-900 rounded-lg print:bg-slate-900 print:print-color-adjust-exact">
                                            <CableConnector type={cable.type} gender={cableStartGender} label={startLabel} />
                                        </div>
                                    </div>
                                </div>

                                {/* DIRECTION */}
                                <div className="flex flex-col items-center justify-center">
                                    <div className="text-gray-300 print:text-black mb-2 text-2xl">
                                        →
                                    </div>
                                </div>

                                {/* TO */}
                                <div className="flex flex-col items-center text-center">
                                    <div className="bg-white print:border-black p-4 rounded-lg border border-gray-200 w-full flex flex-col items-center relative shadow-sm">
                                        <div className="font-bold text-lg text-black">{toInfo.model}</div>
                                        <div className="text-gray-500 text-sm mb-4">{toInfo.manufacturer}</div>
                                        
                                        <div className={`rounded p-2 mb-2 w-full ${potentialMismatch ? 'bg-amber-100' : 'bg-gray-100'}`}>
                                            <span className="font-mono font-bold text-black">{toInfo.portName}</span>
                                             {toPortGender !== 'neutral' && (
                                                <span className="block text-[10px] text-gray-500 uppercase">
                                                    PORT: {toPortGender === 'male' ? 'PINS' : 'HOLES'}
                                                </span>
                                            )}
                                        </div>

                                        <div className="scale-75 origin-center -my-2 p-2 bg-slate-900 rounded-lg print:bg-slate-900 print:print-color-adjust-exact">
                                            <CableConnector type={cable.type} gender={cableEndGender} label={endLabel} />
                                        </div>
                                        
                                        {potentialMismatch && (
                                            <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md print:hidden">
                                                !
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-12 border-t-2 border-black pt-4 flex items-center gap-4 text-sm text-gray-600">
                <CheckCircle className="w-5 h-5 text-black" />
                <p>Verify all connections are secure and power is OFF before patching.</p>
            </div>
        </div>

        <style>{`
          @media print {
            @page { margin: 0.5cm; size: auto; }
            /* Reset constraints on root containers */
            html, body, #root, main {
                height: auto !important;
                width: auto !important;
                overflow: visible !important;
                position: static !important;
                display: block !important;
            }

            /* Hide everything by default */
            body * {
              visibility: hidden;
            }

            /* Show the modal wrapper and its children */
            #printable-area, #printable-area * {
              visibility: visible;
            }

            /* Position the printable area at the top left of the page */
            #printable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
              background: white;
            }
            
            .print\\:hidden { display: none !important; }
            .print\\:bg-white { background-color: white !important; }
            .print\\:text-black { color: black !important; }
            .print\\:border-black { border-color: black !important; }
            .print\\:print-color-adjust-exact { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print\\:shadow-none { box-shadow: none !important; }
            .print\\:break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
            .print\\:py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
            .print\\:border-none { border: none !important; }
            .print\\:inline-block { display: inline-block !important; }
          }
        `}</style>
      </div>
    </div>
  );
};