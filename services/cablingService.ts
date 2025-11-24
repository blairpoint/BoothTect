import { BoothItem, Cable, DeviceType, ManifestItem, SetupAnalysis } from '../types';
import { DEVICES } from '../data/equipment';

export const analyzeSetup = (items: BoothItem[]): SetupAnalysis => {
    if (items.length === 0) {
        return {
            status: 'empty',
            message: 'Booth is empty.',
            capabilities: [],
            missing: ['Equipment']
        };
    }

    const counts = {
        players: 0,
        mixers: 0,
        allInOnes: 0,
        controllers: 0,
        turntables: 0,
        speakers: 0,
        subs: 0
    };

    items.forEach(i => {
        const def = DEVICES.find(d => d.id === i.deviceId);
        if (def) {
            if (def.type === DeviceType.PLAYER) counts.players++;
            if (def.type === DeviceType.MIXER) counts.mixers++;
            if (def.type === DeviceType.ALL_IN_ONE) counts.allInOnes++;
            if (def.type === DeviceType.CONTROLLER) counts.controllers++;
            if (def.model.includes('SL-12')) counts.turntables++;
            
            if (def.type === DeviceType.SPEAKER) {
                // Determine if sub by checking boolean or model name heuristics if prop not available
                if (def.description.toLowerCase().includes('sub')) counts.subs++;
                else counts.speakers++;
            }
        }
    });

    const capabilities: string[] = [];
    const missing: string[] = [];
    let status: SetupAnalysis['status'] = 'ready';
    let message = 'Setup Ready';

    // Capabilities
    if (counts.turntables > 0) capabilities.push('Vinyl Playback');
    if (counts.allInOnes > 0) capabilities.push('Standalone Mode');
    if (counts.controllers > 0) capabilities.push('Laptop Control');
    if (counts.players > 0) capabilities.push('Digital Playback');
    
    if (counts.speakers > 0 || counts.subs > 0) {
        capabilities.push(`PA System (${counts.speakers} Tops, ${counts.subs} Subs)`);
    }

    // Missing Accessory Logic
    const accessories = items.filter(i => {
        const d = DEVICES.find(dev => dev.id === i.deviceId);
        return d?.type === DeviceType.ACCESSORY;
    });
    
    // Check for Headphones
    const hasHeadphones = accessories.some(i => i.deviceId.includes('hd25') || i.deviceId.toLowerCase().includes('phone'));
    if (!hasHeadphones && (counts.mixers > 0 || counts.controllers > 0 || counts.allInOnes > 0)) {
        missing.push('Headphones');
    }

    // Check for Power
    const hasPower = accessories.some(i => i.deviceId.includes('pwr') || i.deviceId.includes('strip'));
    if (!hasPower && items.length > 3) {
         missing.push('Power Extension / Distro');
    }

    // Validation
    const hasCentralHub = counts.mixers > 0 || counts.allInOnes > 0 || counts.controllers > 0;
    
    if (!hasCentralHub) {
        status = 'incomplete';
        message = 'No Audio Mixer/Hub';
        missing.push('Mixer or All-In-One unit');
    } else {
        if (counts.mixers > 0 && counts.players === 0 && counts.allInOnes === 0 && counts.controllers === 0) {
            status = 'incomplete';
            message = 'No Audio Sources';
            missing.push('CDJs or Turntables');
        }
        
        const xz = items.find(i => i.deviceId === 'xdj-xz');
        if (xz) {
            capabilities.push('4-Deck Support (2 External)');
            if (counts.players > 2) {
                status = 'warning';
                message = 'XDJ-XZ limited to 2 ext decks';
            }
        }
    }

    // Override message if specific suggestions exist but setup is technically "complete"
    if (status === 'ready' && missing.length > 0) {
        status = 'warning';
        message = `Missing: ${missing[0]}`;
    }

    return { status, message, capabilities, missing };
};

export const generateCables = (items: BoothItem[]): Cable[] => {
  const cables: Cable[] = [];
  
  const addCable = (fromItem: BoothItem, fromPortId: string, type: Cable['type'], toItem?: BoothItem, toPortId?: string) => {
    cables.push({
      id: `cab-${Date.now()}-${Math.random()}`,
      fromInstanceId: fromItem.instanceId,
      fromPortId: fromPortId,
      toInstanceId: toItem?.instanceId,
      toPortId: toPortId,
      type
    });
  };

  const hub = items.find(i => {
    const d = DEVICES.find(dev => dev.id === i.deviceId);
    return d && (d.type === DeviceType.MIXER || d.type === DeviceType.ALL_IN_ONE || d.type === DeviceType.CONTROLLER);
  });

  const players = items.filter(i => {
    const d = DEVICES.find(dev => dev.id === i.deviceId);
    return d?.type === DeviceType.PLAYER;
  }).sort((a, b) => a.x - b.x); 

  const speakers = items.filter(i => {
      const d = DEVICES.find(dev => dev.id === i.deviceId);
      return d?.type === DeviceType.SPEAKER;
  }).sort((a, b) => a.x - b.x);

  const pwrStrip = items.find(i => i.deviceId === 'pwr-strip');

  // Power Logic
  let pwrStripIdx = 0;
  items.forEach(item => {
    if (item.deviceId === 'pwr-strip') return; // Strip plugs into wall, not itself

    const def = DEVICES.find(d => d.id === item.deviceId);
    if (!def) return;
    const pwr = def.backControls.find(c => c.type === 'port-power' || c.id.includes('ac') || c.id.includes('pwr'));
    
    if (pwr) {
        // If power strip exists and has slots, connect to it
        if (pwrStrip && pwrStripIdx < 6) {
             pwrStripIdx++;
             addCable(item, pwr.id, 'power', pwrStrip, `ac-${pwrStripIdx}`);
        } else {
             // Connect to floor/snake
             addCable(item, pwr.id, 'power');
        }
    }
  });
  
  if (pwrStrip) {
      // Strip main power
      addCable(pwrStrip, 'ac-in', 'power');
  }

  // Audio Routing
  if (hub) {
    const hubDef = DEVICES.find(d => d.id === hub.deviceId);
    
    if (hubDef) {
      // 1. Sources -> Hub
      players.forEach((player, idx) => {
        const playerDef = DEVICES.find(d => d.id === player.deviceId);
        if (!playerDef) return;
        const rcaOut = playerDef.backControls.find(c => c.type === 'port-rca' && (c.id.includes('out') || c.id === 'rca'));
        
        let hubInId: string | undefined;
        if (hubDef.type === DeviceType.MIXER) {
             const channelNum = idx + 1;
             const input = hubDef.backControls.find(c => c.label?.includes(`CH${channelNum}`) && c.type === 'port-rca');
             if (input) hubInId = input.id;
        } else if (hubDef.id === 'xdj-xz') {
             if (idx === 0) hubInId = 'rca-in-3';
             else if (idx === 1) hubInId = 'rca-in-4';
        } else if (hubDef.id === 'traktor-s4') {
             const inputs = ['rca-in-1', 'rca-in-2', 'rca-in-3', 'rca-in-4'];
             if (idx < 4) hubInId = inputs[idx];
        } else if (hubDef.id === 'xdj-rx3') {
             if (idx === 0) hubInId = 'rca-in-1';
             if (idx === 1) hubInId = 'rca-in-2';
        }

        if (rcaOut && hubInId) {
          addCable(player, rcaOut.id, 'audio', hub, hubInId);
        }
        if (playerDef.id === 'sl-1200') {
           const gnd = playerDef.backControls.find(c => c.id === 'gnd');
           if (gnd) addCable(player, gnd.id, 'ground'); 
        }
      });

      // 2. Hub -> PA System
      const masterL = hubDef.backControls.find(c => c.label?.includes('MASTER L') || c.label?.includes('MAIN L'));
      const masterR = hubDef.backControls.find(c => c.label?.includes('MASTER R') || c.label?.includes('MAIN R'));

      const tops = speakers.filter(s => !DEVICES.find(d => d.id === s.deviceId)?.description.toLowerCase().includes('sub'));
      const subs = speakers.filter(s => DEVICES.find(d => d.id === s.deviceId)?.description.toLowerCase().includes('sub'));

      if (subs.length > 0) {
          // Hub -> Subs
          subs.forEach((sub, i) => {
              if (i % 2 === 0 && masterL) addCable(hub, masterL.id, 'audio', sub, 'xlr-in-l');
              if (i % 2 === 1 && masterR) addCable(hub, masterR.id, 'audio', sub, 'xlr-in-r');
              if (subs.length === 1 && masterR) addCable(hub, masterR.id, 'audio', sub, 'xlr-in-r');
          });

          // Subs -> Tops (Daisy Chain)
          tops.forEach((top, i) => {
              const sourceSub = subs[i % subs.length]; 
              const outPort = (i % 2 === 0) ? 'xlr-out-l' : 'xlr-out-r';
              addCable(sourceSub, outPort, 'audio', top, 'xlr-in-1');
          });

      } else {
          // Hub -> Tops direct
          tops.forEach((top, i) => {
               if (i % 2 === 0 && masterL) addCable(hub, masterL.id, 'audio', top, 'xlr-in-1');
               if (i % 2 === 1 && masterR) addCable(hub, masterR.id, 'audio', top, 'xlr-in-1');
          });
      }

      // Dangle cables if no speakers attached to master
      if (speakers.length === 0) {
          if (masterL) addCable(hub, masterL.id, 'audio'); 
          if (masterR) addCable(hub, masterR.id, 'audio'); 
      }

      // USB for Controllers
      if (hubDef.type === DeviceType.CONTROLLER) {
          const usb = hubDef.backControls.find(c => c.label === 'USB');
          if (usb) addCable(hub, usb.id, 'data'); 
      }
    }
  }

  return cables;
};

export const generateManifest = (items: BoothItem[], cables: Cable[]): ManifestItem[] => {
  const manifest: ManifestItem[] = [];

  const deviceCounts = new Map<string, number>();
  items.forEach(item => {
    const model = DEVICES.find(d => d.id === item.deviceId)?.model || item.deviceId;
    deviceCounts.set(model, (deviceCounts.get(model) || 0) + 1);
  });

  deviceCounts.forEach((count, name) => {
    manifest.push({ name, quantity: count, category: 'device' });
  });

  const powerCount = cables.filter(c => c.type === 'power').length;
  if (powerCount > 0) manifest.push({ name: 'IEC Power Cable', quantity: powerCount, category: 'cable' });
  
  const usbCount = cables.filter(c => c.type === 'data').length;
  if (usbCount > 0) manifest.push({ name: 'USB A-to-B Cable', quantity: usbCount, category: 'cable' });

  const audioCount = cables.filter(c => c.type === 'audio').length;
  
  let xlrCount = 0;
  let rcaCount = 0;

  cables.filter(c => c.type === 'audio').forEach(c => {
      const fromItem = items.find(i => i.instanceId === c.fromInstanceId);
      const def = DEVICES.find(d => d.id === fromItem?.deviceId);
      if (def) {
          const port = def.backControls.find(p => p.id === c.fromPortId) || def.frontControls.find(p => p.id === c.fromPortId);
          if (port?.type === 'port-xlr') xlrCount++;
          else rcaCount++;
      } else {
          rcaCount++;
      }
  });

  if (rcaCount > 0) manifest.push({ name: 'RCA Audio Stereo Pair', quantity: rcaCount, category: 'cable' });
  if (xlrCount > 0) manifest.push({ name: 'XLR Cable', quantity: xlrCount, category: 'cable' });

  const groundCount = cables.filter(c => c.type === 'ground').length;
  if (groundCount > 0) manifest.push({ name: 'Ground Wire', quantity: groundCount, category: 'cable' });

  return manifest;
};