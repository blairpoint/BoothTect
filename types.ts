export enum DeviceType {
  PLAYER = 'PLAYER', // CDJs, Turntables
  MIXER = 'MIXER',
  ALL_IN_ONE = 'ALL_IN_ONE',
  FX = 'FX',
  CONTROLLER = 'CONTROLLER',
  SPEAKER = 'SPEAKER',
  ACCESSORY = 'ACCESSORY'
}

export interface Point {
  x: number;
  y: number;
}

export interface ControlFeature {
  id: string;
  type: 'knob' | 'fader' | 'button-round' | 'button-rect' | 'jog-wheel' | 'screen' | 'pad-grid' | 'label' | 'port-xlr' | 'port-rca' | 'port-usb' | 'port-power' | 'driver';
  x: number;
  y: number;
  width?: number; // For rects, screens, pads
  height?: number;
  radius?: number; // For knobs, buttons, jog wheels, drivers
  label?: string;
  subLabel?: string;
  rotation?: number; // Visual rotation for knobs
  variant?: 'filled' | 'outline' | 'accent';
}

export interface DeviceDefinition {
  id: string;
  model: string;
  manufacturer: string;
  type: DeviceType;
  width: number; // In mm or relative units
  height: number; // Front/Top view height (Depth)
  rearHeight?: number; // Rear view height (Height of back panel). Defaults to height if undefined.
  frontControls: ControlFeature[];
  backControls: ControlFeature[];
  description: string;
}

export interface BoothItem {
  instanceId: string;
  deviceId: string;
  x: number; // For potential future drag/drop
  y: number;
  view: 'front' | 'back';
}

export interface Cable {
  id: string;
  fromInstanceId: string;
  fromPortId: string;
  toInstanceId?: string; // If undefined, goes to floor/snake
  toPortId?: string;
  type: 'power' | 'audio' | 'data' | 'ground';
}

export interface ManifestItem {
  name: string;
  quantity: number;
  category: 'device' | 'cable';
  details?: string;
}

export interface SetupAnalysis {
  status: 'empty' | 'incomplete' | 'ready' | 'warning';
  message: string;
  capabilities: string[];
  missing: string[];
}