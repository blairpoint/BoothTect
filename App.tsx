import React, { useState, useRef, MouseEvent, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { DeviceRenderer } from './components/DeviceRenderer';
import { ManifestModal } from './components/ManifestModal';
import { SoundCheckModal } from './components/SoundCheckModal';
import { CableConnector } from './components/CableConnector';
import { BoothItem, DeviceDefinition, Cable, ManifestItem, SetupAnalysis } from './types';
import { DEVICES } from './data/equipment';
import { generateCables, generateManifest, analyzeSetup } from './services/cablingService';
import { Trash2, RefreshCw, ZoomIn, ZoomOut, Maximize, Cable as CableIcon, AlertCircle, CheckCircle, Info, Layout, Unlock, FileText } from 'lucide-react';

const App: React.FC = () => {
  const [items, setItems] = useState<BoothItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCableId, setSelectedCableId] = useState<string | null>(null);
  const [isManifestOpen, setIsManifestOpen] = useState(false);
  const [isSoundCheckOpen, setIsSoundCheckOpen] = useState(false);
  const [globalView, setGlobalView] = useState<'front' | 'back'>('front');
  const [scale, setScale] = useState(0.4);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [cables, setCables] = useState<Cable[]>([]);
  const [manifest, setManifest] = useState<ManifestItem[]>([]);
  const [analysis, setAnalysis] = useState<SetupAnalysis>({ 
    status: 'empty', 
    message: 'Start by adding equipment', 
    capabilities: [], 
    missing: [] 
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragItemRef = useRef<{ id: string, startX: number, startY: number, initialX: number, initialY: number } | null>(null);
  const dragPanRef = useRef<{ startX: number, startY: number, initialPanX: number, initialPanY: number } | null>(null);

  // Analysis runs on item change
  useEffect(() => {
    setAnalysis(analyzeSetup(items));
  }, [items]);

  // Sort cables by type so they form clean, color-grouped lanes in the loom
  const sortedCables = useMemo(() => {
    return [...cables].sort((a, b) => {
        // Order: Power -> Audio -> Data -> Ground
        const typeOrder = { power: 0, audio: 1, data: 2, ground: 3 };
        return typeOrder[a.type] - typeOrder[b.type];
    });
  }, [cables]);

  // Helper to get port absolute coordinates regardless of current view
  const getPortPosition = (item: BoothItem, portId: string) => {
      const def = DEVICES.find(d => d.id === item.deviceId);
      if (!def) return { x: 0, y: 0, isOnBack: false, portDef: null };
      
      let control = def.backControls.find(c => c.id === portId);
      
      // Handle Rear/Back Ports
      if (control) {
          if (item.view === 'back') {
              // In Rear View, we see the back panel directly. Use configured coords.
              return { x: item.x + control.x, y: item.y + control.y, isOnBack: true, portDef: control };
          } else {
              // In Front View (Top Down for DJ gear), the ports are physically on the back.
              // We snap them to the top edge (y=0 relative to device) to simulate cabling going "up and out".
              return { x: item.x + control.x, y: item.y, isOnBack: true, portDef: control };
          }
      }

      control = def.frontControls.find(c => c.id === portId);
      
      // Handle Front/Top Ports (e.g., Headphone jack on front)
      if (control) {
          if (item.view === 'back') {
              // In Rear View, front controls are usually hidden or on the "other side".
              // We snap them to the top edge (y=0) to be phantom.
              return { x: item.x + control.x, y: item.y, isOnBack: false, portDef: control };
          } else {
              // Standard Top Down View
              return { x: item.x + control.x, y: item.y + control.y, isOnBack: false, portDef: control };
          }
      }
      
      return { x: item.x, y: item.y, isOnBack: false, portDef: null };
  };

  const handleAddDevice = (device: DeviceDefinition) => {
    // Note: We no longer clear cables here to allow adding items to an existing patch
    const existingCount = items.length;
    const newItem: BoothItem = {
      instanceId: `dev-${Date.now()}`,
      deviceId: device.id,
      x: 100 + (existingCount * 360),
      y: 100,
      view: globalView
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleGenerateCables = () => {
      const newCables = generateCables(items);
      setCables(newCables);
      
      const newManifest = generateManifest(items, newCables);
      setManifest(newManifest);
      setIsManifestOpen(true);
  };

  const handleClearCables = () => {
      setCables([]);
      setSelectedCableId(null);
  };

  const handleFitToScreen = (itemsOverride?: BoothItem[]) => {
      const targetItems = itemsOverride || items;
      if (targetItems.length === 0 || !canvasRef.current) return;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      targetItems.forEach(item => {
          const def = DEVICES.find(d => d.id === item.deviceId);
          if (!def) return;
          minX = Math.min(minX, item.x);
          minY = Math.min(minY, item.y);
          maxX = Math.max(maxX, item.x + def.width);
          const currentHeight = (item.view === 'back' && def.rearHeight) ? def.rearHeight : def.height;
          maxY = Math.max(maxY, item.y + currentHeight);
      });

      const PADDING = 150; // Comfortable padding
      const contentWidth = maxX - minX + (PADDING * 2);
      const contentHeight = maxY - minY + (PADDING * 2);

      if (contentWidth <= 0 || contentHeight <= 0) return;

      const containerW = canvasRef.current.clientWidth;
      const containerH = canvasRef.current.clientHeight;

      const scaleX = containerW / contentWidth;
      const scaleY = containerH / contentHeight;
      
      // Limit scale to reasonable values
      const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.2), 1.0);

      const contentCenterX = (minX + maxX) / 2;
      const contentCenterY = (minY + maxY) / 2;

      const newPanX = (containerW / 2) - (contentCenterX * newScale);
      const newPanY = (containerH / 2) - (contentCenterY * newScale);

      setScale(newScale);
      setPan({ x: newPanX, y: newPanY });
  };

  const handleAcknowledgeManifest = () => {
      setIsManifestOpen(false);
      setTimeout(() => {
          handleFitToScreen();
      }, 100);
  };

  const handleAutoArrange = () => {
    if (items.length === 0) return;
    
    // NOTE: We do NOT clear cables here anymore, to allow re-arranging while patched.
    const CENTER_X = 800;
    const TABLE_Y = 150;
    const FLOOR_Y = 600;
    const SPACING = 20;

    let newItems = [...items];
    const getDeviceDef = (id: string) => DEVICES.find(d => d.id === id);

    // Grouping Logic
    const mixers = items.filter(i => ['MIXER', 'ALL_IN_ONE', 'CONTROLLER'].includes(getDeviceDef(i.deviceId)?.type || ''));
    const players = items.filter(i => getDeviceDef(i.deviceId)?.type === 'PLAYER');
    const speakers = items.filter(i => {
        const d = getDeviceDef(i.deviceId);
        return d?.type === 'SPEAKER' && !d.description.toLowerCase().includes('sub');
    });
    const subs = items.filter(i => {
        const d = getDeviceDef(i.deviceId);
        return d?.type === 'SPEAKER' && d.description.toLowerCase().includes('sub');
    });
    const others = items.filter(i => !mixers.includes(i) && !players.includes(i) && !speakers.includes(i) && !subs.includes(i));

    // Layout Logic
    let leftBound = CENTER_X;
    let rightBound = CENTER_X;

    if (mixers.length > 0) {
        const main = mixers[0];
        const def = getDeviceDef(main.deviceId)!;
        const startX = CENTER_X - (def.width / 2);
        newItems = newItems.map(i => i.instanceId === main.instanceId ? { ...i, x: startX, y: TABLE_Y } : i);
        leftBound = startX - SPACING;
        rightBound = startX + def.width + SPACING;
        for(let j=1; j<mixers.length; j++) {
            const m = mixers[j];
            const d = getDeviceDef(m.deviceId)!;
            newItems = newItems.map(i => i.instanceId === m.instanceId ? { ...i, x: rightBound, y: TABLE_Y } : i);
            rightBound += d.width + SPACING;
        }
    }

    players.forEach((p, idx) => {
        const def = getDeviceDef(p.deviceId)!;
        if (idx % 2 === 0) {
            const x = leftBound - def.width;
            newItems = newItems.map(i => i.instanceId === p.instanceId ? { ...i, x: x, y: TABLE_Y } : i);
            leftBound = x - SPACING;
        } else {
            const x = rightBound;
            newItems = newItems.map(i => i.instanceId === p.instanceId ? { ...i, x: x, y: TABLE_Y } : i);
            rightBound = x + def.width + SPACING;
        }
    });

    const PA_OFFSET = 150;
    let paLeft = leftBound - PA_OFFSET;
    let paRight = rightBound + PA_OFFSET;
    const midTop = Math.ceil(speakers.length / 2);

    speakers.slice(0, midTop).forEach(s => {
        const def = getDeviceDef(s.deviceId)!;
        const x = paLeft - def.width;
        newItems = newItems.map(i => i.instanceId === s.instanceId ? { ...i, x: x, y: TABLE_Y - 50 } : i);
        paLeft = x - SPACING;
    });
    speakers.slice(midTop).forEach(s => {
        const def = getDeviceDef(s.deviceId)!;
        const x = paRight;
        newItems = newItems.map(i => i.instanceId === s.instanceId ? { ...i, x: x, y: TABLE_Y - 50 } : i);
        paRight = x + def.width + SPACING;
    });

    let subLeft = leftBound - PA_OFFSET;
    let subRight = rightBound + PA_OFFSET;
    const midSub = Math.ceil(subs.length / 2);

    subs.slice(0, midSub).forEach(s => {
        const def = getDeviceDef(s.deviceId)!;
        const x = subLeft - def.width;
        newItems = newItems.map(i => i.instanceId === s.instanceId ? { ...i, x: x, y: FLOOR_Y } : i);
        subLeft = x - 5; 
    });
    subs.slice(midSub).forEach(s => {
        const def = getDeviceDef(s.deviceId)!;
        const x = subRight;
        newItems = newItems.map(i => i.instanceId === s.instanceId ? { ...i, x: x, y: FLOOR_Y } : i);
        subRight = x + def.width + 5;
    });

    let otherX = subRight + 100;
    others.forEach(o => {
        const def = getDeviceDef(o.deviceId)!;
        newItems = newItems.map(i => i.instanceId === o.instanceId ? { ...i, x: otherX, y: TABLE_Y } : i);
        otherX += def.width + SPACING;
    });

    setItems(newItems);
    handleFitToScreen(newItems);
  };

  const handleItemMouseDown = (e: MouseEvent, item: BoothItem) => {
    e.stopPropagation();
    
    // Note: We no longer clear cables on drag
    
    setSelectedId(item.instanceId);
    dragItemRef.current = {
      id: item.instanceId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: item.x,
      initialY: item.y
    };
  };

  const handleCanvasMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      
      setSelectedId(null);
      setSelectedCableId(null);
      dragPanRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          initialPanX: pan.x,
          initialPanY: pan.y
      };
  };

  const handleCableClick = (e: MouseEvent, cableId: string) => {
      e.stopPropagation();
      setSelectedCableId(cableId);
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (dragItemRef.current) {
      const deltaX = (e.clientX - dragItemRef.current.startX) / scale;
      const deltaY = (e.clientY - dragItemRef.current.startY) / scale;

      setItems(prev => prev.map(item => {
        if (item.instanceId === dragItemRef.current?.id) {
          return {
            ...item,
            x: dragItemRef.current.initialX + deltaX,
            y: dragItemRef.current.initialY + deltaY
          };
        }
        return item;
      }));
    } 
    else if (dragPanRef.current) {
        const deltaX = e.clientX - dragPanRef.current.startX;
        const deltaY = e.clientY - dragPanRef.current.startY;
        
        setPan({
            x: dragPanRef.current.initialPanX + deltaX,
            y: dragPanRef.current.initialPanY + deltaY
        });
    }
  };

  const handleMouseUp = () => {
    dragItemRef.current = null;
    dragPanRef.current = null;
  };

  const toggleView = () => {
      const newView = globalView === 'front' ? 'back' : 'front';
      setGlobalView(newView);
      setItems(prev => prev.map(i => ({...i, view: newView})));
  };

  const calculateCableGeometry = (start: {x: number, y: number}, end: {x: number, y: number}, index: number) => {
      const isVerticalDrop = Math.abs(start.x - end.x) < 5 && end.y > start.y + 100;

      if (isVerticalDrop) {
           const d = `M ${start.x} ${start.y} L ${start.x} ${end.y}`;
           return { d, labelX: start.x + 8, labelY: start.y + 80, isVertical: true };
      }

      const LANE_HEIGHT = 12;
      const laneOffset = (index % 8) * LANE_HEIGHT;
      const BASE_CLEARANCE = 100;
      const channelY = Math.max(start.y, end.y) + BASE_CLEARANCE + laneOffset;
      const radius = 15;
      const dirX = end.x > start.x ? 1 : -1;
      
      if (Math.abs(end.x - start.x) < radius * 2) {
           const d = `M ${start.x} ${start.y} 
               L ${start.x} ${channelY} 
               L ${end.x} ${channelY} 
               L ${end.x} ${end.y}`;
           return { d, labelX: (start.x + end.x) / 2, labelY: channelY, isVertical: false };
      }

      const d = `
        M ${start.x} ${start.y} 
        L ${start.x} ${channelY - radius}
        Q ${start.x} ${channelY} ${start.x + (radius * dirX)} ${channelY}
        L ${end.x - (radius * dirX)} ${channelY}
        Q ${end.x} ${channelY} ${end.x} ${channelY - radius}
        L ${end.x} ${end.y}
      `;

      const midX = (start.x + end.x) / 2;
      const labelY = channelY;

      return { d, labelX: midX, labelY: labelY, isVertical: false };
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
      <Sidebar onAddDevice={handleAddDevice} />
      
      <main className="flex-1 flex flex-col relative h-full">
        {/* Toolbar */}
        <div className="h-16 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6 z-20 shadow-lg shrink-0">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
                  <button onClick={() => setScale(s => Math.max(0.2, s - 0.1))} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition">
                      <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono w-12 text-center text-slate-400">{Math.round(scale * 100)}%</span>
                  <button onClick={() => setScale(s => Math.min(2.0, s + 0.1))} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition">
                      <ZoomIn className="w-4 h-4" />
                  </button>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={toggleView} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition font-mono text-sm">
                    <RefreshCw className={`w-4 h-4 ${globalView === 'back' ? 'text-sky-400' : ''}`} />
                    {globalView === 'front' ? 'FRONT VIEW' : 'REAR VIEW'}
                </button>
                <button onClick={handleAutoArrange} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg border border-slate-700 transition font-mono text-sm" title="Auto-Arrange Layout">
                    <Layout className="w-4 h-4" />
                    AUTO-ALIGN
                </button>
              </div>
           </div>

           <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-full">
                {analysis.status === 'ready' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : 
                 analysis.status === 'warning' ? <AlertCircle className="w-4 h-4 text-amber-400" /> :
                 analysis.status === 'incomplete' ? <AlertCircle className="w-4 h-4 text-rose-400" /> :
                 <Info className="w-4 h-4 text-slate-400" />}
                
                <span className={`text-xs font-bold ${
                    analysis.status === 'ready' ? 'text-emerald-400' : 
                    analysis.status === 'incomplete' ? 'text-rose-400' :
                    analysis.status === 'warning' ? 'text-amber-400' : 'text-slate-400'
                }`}>
                    {analysis.message.toUpperCase()}
                </span>
           </div>

           <div className="flex items-center gap-4">
               {cables.length === 0 ? (
                   items.length > 0 && (
                       <button
                        onClick={handleGenerateCables}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-800 rounded-lg transition text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                       >
                           <CableIcon className="w-4 h-4" />
                           ACCEPT & CABLE
                       </button>
                   )
               ) : (
                   <>
                       <button
                           onClick={() => setIsSoundCheckOpen(true)}
                           className="flex items-center gap-2 px-4 py-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-800 rounded-lg transition text-sm font-bold"
                       >
                           <FileText className="w-4 h-4" />
                           GENERATE SOUND CHECK
                       </button>

                       <button
                           onClick={handleClearCables}
                           className="flex items-center gap-2 px-4 py-2 bg-amber-900/30 hover:bg-amber-900/50 text-amber-400 border border-amber-800 rounded-lg transition text-sm font-bold"
                       >
                           <Unlock className="w-4 h-4" />
                           UNLOCK
                       </button>
                   </>
               )}

               {selectedId && (
                   <button onClick={() => { if (selectedId) setItems(prev => prev.filter(i => i.instanceId !== selectedId)); setSelectedId(null); }} className="flex items-center gap-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg transition text-sm">
                       <Trash2 className="w-4 h-4" />
                       REMOVE
                   </button>
               )}
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
            {/* Canvas */}
            <div 
                ref={canvasRef}
                className="flex-1 relative overflow-hidden bg-slate-950 cursor-grab active:cursor-grabbing blueprint-grid"
                onMouseDown={handleCanvasMouseDown}
                style={{ 
                    backgroundPosition: `${pan.x}px ${pan.y}px` 
                }}
            >
                <div 
                    className="absolute inset-0 transition-transform duration-75 origin-top-left"
                    style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
                >
                    {items.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20" style={{ transform: `translate(${-pan.x}px, ${-pan.y}px) scale(${1/scale})` }}>
                            <div className="text-center">
                                <Maximize className="w-24 h-24 mx-auto text-slate-600 mb-4" />
                                <h2 className="text-4xl font-black text-slate-700 tracking-tight">EMPTY BOOTH</h2>
                                <p className="text-slate-500 font-mono mt-2">Select equipment to start designing.</p>
                            </div>
                        </div>
                    )}

                    {/* Cable Layer - Only show in Rear View */}
                    {globalView === 'back' && (
                        <svg className="absolute inset-0 overflow-visible" width="100%" height="100%" style={{ zIndex: 20 }}>
                            {sortedCables.map((cable, index) => {
                                const fromItem = items.find(i => i.instanceId === cable.fromInstanceId);
                                if (!fromItem) return null;
                                
                                const startInfo = getPortPosition(fromItem, cable.fromPortId);
                                let endInfo = { x: startInfo.x, y: startInfo.y + 300, isOnBack: false, portDef: null as any };
                                
                                if (cable.toInstanceId) {
                                    const toItem = items.find(i => i.instanceId === cable.toInstanceId);
                                    if (toItem && cable.toPortId) {
                                        endInfo = getPortPosition(toItem, cable.toPortId);
                                    }
                                }

                                let strokeColor = '#64748b'; 
                                if (cable.type === 'power') strokeColor = '#f59e0b'; 
                                if (cable.type === 'audio') strokeColor = '#ef4444'; 
                                if (cable.type === 'ground') strokeColor = '#10b981'; 
                                if (cable.type === 'data') strokeColor = '#3b82f6'; 
                                
                                // Highlight selected cable
                                const isSelected = cable.id === selectedCableId;
                                if (isSelected) strokeColor = '#ffffff';

                                // Since we are inside the conditional {globalView === 'back'}, we know globalView is 'back'.
                                // Therefore, checking (globalView === 'front') is always false and causes TS type error.
                                // We simply check if the port is on the back (which means visible in rear view).
                                const startVisible = startInfo.isOnBack;
                                const endVisible = endInfo.isOnBack;
                                const isPhantom = !startVisible || !endVisible;
                                const dash = isPhantom ? "10,5" : "none";
                                
                                const geom = calculateCableGeometry(startInfo, endInfo, index);

                                return (
                                    <g 
                                        key={cable.id} 
                                        onClick={(e) => handleCableClick(e, cable.id)}
                                        className="cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                        {/* Hitbox area for easier clicking */}
                                        <path 
                                            d={geom.d}
                                            stroke="transparent"
                                            strokeWidth="20"
                                            fill="none"
                                        />
                                        {/* Visual Path */}
                                        <path 
                                            d={geom.d}
                                            stroke={strokeColor}
                                            strokeWidth={isSelected ? "8" : "6"}
                                            fill="none"
                                            strokeDasharray={dash}
                                            strokeLinejoin="round"
                                            strokeLinecap="round"
                                            className="drop-shadow-md"
                                        />
                                        <circle cx={startInfo.x} cy={startInfo.y} r={isSelected ? 8 : 6} fill={strokeColor} />
                                        <circle cx={endInfo.x} cy={endInfo.y} r={isSelected ? 8 : 6} fill={strokeColor} />
                                        
                                        <g transform={`translate(${geom.labelX}, ${geom.labelY})`}>
                                            <rect 
                                                x="-25" y="-10" width="50" height="20" 
                                                fill="#0f172a" stroke={strokeColor} strokeWidth="1" rx="4" 
                                            />
                                            <text 
                                                x="0" y="4" 
                                                textAnchor="middle" 
                                                fill={strokeColor} 
                                                fontSize="10" 
                                                fontWeight="bold" 
                                                fontFamily="Space Mono"
                                            >
                                                {cable.type.toUpperCase()}
                                            </text>
                                        </g>
                                    </g>
                                );
                            })}
                        </svg>
                    )}

                    {/* Connector Popups Layer - Only show in Rear View */}
                    {globalView === 'back' && selectedCableId && (() => {
                        const cable = cables.find(c => c.id === selectedCableId);
                        if (!cable) return null;

                        const fromItem = items.find(i => i.instanceId === cable.fromInstanceId);
                        const toItem = items.find(i => i.instanceId === cable.toInstanceId);
                        if (!fromItem) return null;

                        const startInfo = getPortPosition(fromItem, cable.fromPortId);
                        const endInfo = toItem && cable.toPortId ? getPortPosition(toItem, cable.toPortId) : { x: startInfo.x, y: startInfo.y + 300, isOnBack: false, portDef: null };

                        // Determine Connector Genders explicitly matching SoundCheck logic
                        let startGender: 'male' | 'female' = 'female'; 
                        let endGender: 'male' | 'female' = 'male'; 
                        
                        let startType: any = cable.type;
                        if (cable.type === 'audio') {
                           // SOURCE
                           if (startInfo.portDef?.type === 'port-rca') startGender = 'male'; 
                           else startGender = 'female'; // XLR Output (Male) needs Female Cable

                           // DEST
                           if (endInfo.portDef?.type === 'port-rca') endGender = 'male';
                           else endGender = 'male'; // XLR Input (Female) needs Male Cable
                        }

                        if (cable.type === 'power') {
                            startGender = 'female'; // C13 plugs into device
                            endGender = 'male'; // Wall plug
                        }

                        return (
                            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
                                <div style={{ position: 'absolute', left: startInfo.x, top: startInfo.y, transform: 'translate(-50%, -120%)' }}>
                                    <CableConnector type={startType} gender={startGender} label={startInfo.portDef?.label} />
                                </div>
                                {cable.toInstanceId && (
                                    <div style={{ position: 'absolute', left: endInfo.x, top: endInfo.y, transform: 'translate(-50%, -120%)' }}>
                                        <CableConnector type={startType} gender={endGender} label={endInfo.portDef?.label} />
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Device Layer */}
                    {items.map(item => {
                        const def = DEVICES.find(d => d.id === item.deviceId);
                        if (!def) return null;
                        
                        return (
                            <div
                                key={item.instanceId}
                                style={{ 
                                    position: 'absolute', 
                                    left: item.x, 
                                    top: item.y,
                                    zIndex: item.instanceId === selectedId ? 30 : 10
                                }}
                                onMouseDown={(e) => handleItemMouseDown(e, item)}
                            >
                                <DeviceRenderer 
                                    device={def} 
                                    view={item.view} 
                                    selected={item.instanceId === selectedId}
                                />
                            </div>
                        );
                    })}
                </div>
                
                <div className="absolute bottom-4 right-4 pointer-events-none text-right">
                    <p className="font-mono text-xs text-slate-600">GRID: 20mm</p>
                    <p className="font-mono text-xs text-slate-600">SCALE: 1:{Math.round(1/scale)}</p>
                </div>
            </div>

            {/* Right Sidebar for Cabling */}
            {cables.length > 0 && (
                <div className="w-80 bg-slate-900 border-l border-slate-700 flex flex-col z-20 shadow-2xl h-full shrink-0">
                    <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center gap-3">
                         <div className="p-2 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                            <CableIcon className="w-4 h-4 text-emerald-400" />
                         </div>
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                            Patch List
                        </h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {manifest.filter(m => m.category === 'cable').map((cable, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-800 p-3 rounded border border-slate-700 hover:border-slate-600 transition-colors">
                                <span className="text-slate-300 text-xs font-medium">{cable.name}</span>
                                <span className="font-mono text-emerald-400 text-xs font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                                    x{cable.quantity}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t border-slate-800 bg-slate-950">
                        <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                            This manifest is automatically generated based on the current equipment configuration and available ports.
                        </p>
                    </div>
                </div>
            )}
        </div>
      </main>

      <ManifestModal
        isOpen={isManifestOpen}
        onClose={() => setIsManifestOpen(false)}
        onAcknowledge={handleAcknowledgeManifest}
        manifest={manifest}
      />
