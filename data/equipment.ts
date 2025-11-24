import { DeviceDefinition, DeviceType } from '../types';

// --- HELPER FACTORIES ---

const createSpeaker = (
    id: string, 
    model: string, 
    manufacturer: string, 
    size: '8' | '10' | '12' | '15' | '18' | 'column', 
    isSub: boolean = false
): DeviceDefinition => {
    let width = 350;
    let height = 600;
    let driverRadius = 0;
    
    // Approximate dimensions and driver size (inches to pixels approx, scaled)
    if (isSub) {
        switch(size) {
            case '12': width = 400; height = 450; driverRadius = 140; break;
            case '15': width = 500; height = 550; driverRadius = 180; break;
            case '18': width = 600; height = 650; driverRadius = 220; break;
        }
    } else {
        switch(size) {
            case '8': width = 250; height = 400; driverRadius = 80; break;
            case '10': width = 300; height = 500; driverRadius = 100; break;
            case '12': width = 360; height = 600; driverRadius = 130; break;
            case '15': width = 430; height = 700; driverRadius = 160; break;
            case 'column': width = 350; height = 800; driverRadius = 40; break; // Array logic handled differently usually
        }
    }

    const frontControls: any[] = [];

    // Add Drivers
    if (size === 'column') {
        // Line Array visual
        for(let i=0; i<6; i++) {
            frontControls.push({ 
                id: `driver-${i}`, type: 'driver', 
                x: width/2, y: 100 + (i * 90), 
                radius: 35, variant: 'outline' 
            });
        }
        // Sub base for column
        frontControls.push({ 
            id: 'sub-base', type: 'driver', 
            x: width/2, y: height - 150, 
            radius: 100, variant: 'filled' 
        });
    } else {
        // Main Woofer
        frontControls.push({ 
            id: 'woofer', type: 'driver', 
            x: width/2, y: isSub ? height/2 : height - (width/2) - 20, 
            radius: driverRadius, 
            label: isSub ? `${size}" SUB` : '' 
        });

        // Tweeter (if not sub)
        if (!isSub) {
             frontControls.push({ 
                id: 'tweeter', type: 'driver', 
                x: width/2, y: height/4, 
                radius: driverRadius * 0.3, 
                variant: 'outline' // HF Horn look
            });
        }
    }

    const backControls: any[] = [
        { id: 'ac', type: 'port-power', x: width/2 - 20, y: height - 50, width: 40, height: 30, label: 'AC IN' },
        { id: 'vol', type: 'knob', x: width - 60, y: 100, radius: 15, label: 'GAIN' }
    ];

    if (isSub) {
        // Subs usually have stereo pass-thru
        backControls.push(
            { id: 'xlr-in-l', type: 'port-xlr', x: 60, y: 100, radius: 15, label: 'IN L' },
            { id: 'xlr-in-r', type: 'port-xlr', x: 110, y: 100, radius: 15, label: 'IN R' },
            { id: 'xlr-out-l', type: 'port-xlr', x: 60, y: 160, radius: 15, label: 'OUT L' },
            { id: 'xlr-out-r', type: 'port-xlr', x: 110, y: 160, radius: 15, label: 'OUT R' }
        );
    } else {
        // Tops usually have Mix inputs and Thru
        backControls.push(
            { id: 'xlr-in-1', type: 'port-xlr', x: 60, y: 100, radius: 15, label: 'IN 1' },
            { id: 'xlr-in-2', type: 'port-xlr', x: 60, y: 150, radius: 15, label: 'IN 2' },
            { id: 'xlr-out', type: 'port-xlr', x: 60, y: 200, radius: 15, label: 'THRU' }
        );
    }

    return {
        id, model, manufacturer, type: DeviceType.SPEAKER, width, height, rearHeight: height,
        description: isSub ? `${size}-inch Active Subwoofer.` : `${size}-inch Powered PA Speaker.`,
        frontControls,
        backControls
    };
};

// --- EXISTING EQUIPMENT ---

const CDJ_3000: DeviceDefinition = {
  id: 'cdj-3000',
  model: 'CDJ-3000',
  manufacturer: 'Pioneer DJ',
  type: DeviceType.PLAYER,
  width: 329,
  height: 453,
  rearHeight: 120, // Rear Panel Height
  description: 'Professional DJ Multi Player with 9-inch touch screen.',
  frontControls: [
    { id: 'screen', type: 'screen', x: 20, y: 20, width: 289, height: 150, label: 'TOUCH DISPLAY' },
    { id: 'jog', type: 'jog-wheel', x: 164.5, y: 280, radius: 100, label: 'VINYL MODE' },
    { id: 'play', type: 'button-round', x: 40, y: 400, radius: 25, label: 'PLAY', variant: 'accent' },
    { id: 'cue', type: 'button-round', x: 40, y: 340, radius: 25, label: 'CUE' },
    { id: 'pitch', type: 'fader', x: 290, y: 250, width: 20, height: 150, label: 'TEMPO' },
    { id: 'hotcue-grid', type: 'pad-grid', x: 20, y: 190, width: 200, height: 40, label: 'HOT CUE' },
    { id: 'usb', type: 'port-usb', x: 280, y: 30, width: 20, height: 10, label: 'USB' }
  ],
  backControls: [
    // Repositioned for Rear Panel (y relative to rearHeight 120)
    { id: 'pwr', type: 'port-power', x: 20, y: 60, width: 40, height: 30, label: 'AC IN' },
    { id: 'rca', type: 'port-rca', x: 100, y: 60, radius: 5, label: 'AUDIO OUT' },
    { id: 'digital', type: 'port-rca', x: 140, y: 60, radius: 5, label: 'DIGITAL' },
    { id: 'link', type: 'port-usb', x: 200, y: 60, width: 30, height: 30, label: 'LINK' }
  ]
};

const DJM_900: DeviceDefinition = {
  id: 'djm-900',
  model: 'DJM-900NXS2',
  manufacturer: 'Pioneer DJ',
  type: DeviceType.MIXER,
  width: 333,
  height: 414,
  rearHeight: 120,
  description: '4-channel professional mixer with 64-bit mixing processor.',
  frontControls: [
    { id: 'trim1', type: 'knob', x: 45, y: 40, radius: 10, label: 'TRIM' },
    { id: 'fader1', type: 'fader', x: 45, y: 280, width: 15, height: 80, label: 'CH1' },
    { id: 'trim2', type: 'knob', x: 105, y: 40, radius: 10 },
    { id: 'fader2', type: 'fader', x: 105, y: 280, width: 15, height: 80, label: 'CH2' },
    { id: 'trim3', type: 'knob', x: 165, y: 40, radius: 10 },
    { id: 'fader3', type: 'fader', x: 165, y: 280, width: 15, height: 80, label: 'CH3' },
    { id: 'trim4', type: 'knob', x: 225, y: 40, radius: 10 },
    { id: 'fader4', type: 'fader', x: 225, y: 280, width: 15, height: 80, label: 'CH4' },
    { id: 'xfader', type: 'fader', x: 135, y: 380, width: 60, height: 15, label: 'X-FADER', rotation: 90 }
  ],
  backControls: [
    { id: 'xlr-out-l', type: 'port-xlr', x: 40, y: 70, radius: 15, label: 'MAIN L' },
    { id: 'xlr-out-r', type: 'port-xlr', x: 80, y: 70, radius: 15, label: 'MAIN R' },
    { id: 'ac-in', type: 'port-power', x: 280, y: 70, width: 40, height: 30, label: 'AC' },
    { id: 'rca-in-1', type: 'port-rca', x: 40, y: 30, radius: 5, label: 'CH1' },
    { id: 'rca-in-2', type: 'port-rca', x: 100, y: 30, radius: 5, label: 'CH2' },
    { id: 'rca-in-3', type: 'port-rca', x: 160, y: 30, radius: 5, label: 'CH3' },
    { id: 'rca-in-4', type: 'port-rca', x: 220, y: 30, radius: 5, label: 'CH4' },
  ]
};

const TECH_1200: DeviceDefinition = {
  id: 'sl-1200', model: 'SL-1210MK7', manufacturer: 'Technics', type: DeviceType.PLAYER, width: 453, height: 353, rearHeight: 100, description: 'Direct Drive Turntable.',
  frontControls: [
    { id: 'platter', type: 'jog-wheel', x: 226, y: 176, radius: 130, label: 'PLATTER', variant: 'filled' },
    { id: 'start', type: 'button-rect', x: 40, y: 280, width: 40, height: 30, label: 'START' }
  ],
  backControls: [
     { id: 'rca-out', type: 'port-rca', x: 200, y: 50, radius: 5, label: 'PHONO' },
     { id: 'gnd', type: 'port-power', x: 230, y: 50, width: 10, height: 10, label: 'GND' },
     { id: 'ac', type: 'port-power', x: 50, y: 50, width: 40, height: 20, label: 'AC' }
  ]
};

const XDJ_XZ: DeviceDefinition = {
  id: 'xdj-xz', model: 'XDJ-XZ', manufacturer: 'Pioneer DJ', type: DeviceType.ALL_IN_ONE, width: 878, height: 466, rearHeight: 140, description: 'Professional All-in-One.',
  frontControls: [
    { id: 'screen', type: 'screen', x: 439, y: 80, width: 250, height: 100, label: 'TOUCH' },
    { id: 'jog-1', type: 'jog-wheel', x: 180, y: 280, radius: 100, label: 'DECK 1' },
    { id: 'jog-2', type: 'jog-wheel', x: 700, y: 280, radius: 100, label: 'DECK 2' }
  ],
  backControls: [
    { id: 'ac', type: 'port-power', x: 50, y: 80, width: 40, height: 30 },
    { id: 'rca-in-3', type: 'port-rca', x: 300, y: 80, radius: 6, label: 'CH3' },
    { id: 'rca-in-4', type: 'port-rca', x: 350, y: 80, radius: 6, label: 'CH4' },
    { id: 'xlr-out-l', type: 'port-xlr', x: 600, y: 80, radius: 15, label: 'MAIN L' },
    { id: 'xlr-out-r', type: 'port-xlr', x: 640, y: 80, radius: 15, label: 'MAIN R' }
  ]
};

const XDJ_RX3: DeviceDefinition = {
  id: 'xdj-rx3', model: 'XDJ-RX3', manufacturer: 'Pioneer DJ', type: DeviceType.ALL_IN_ONE, width: 728, height: 469, rearHeight: 140, description: '2-Channel All-in-One.',
  frontControls: [
    { id: 'screen', type: 'screen', x: 364, y: 80, width: 300, height: 120 },
    { id: 'jog-1', type: 'jog-wheel', x: 150, y: 300, radius: 80 }
  ],
  backControls: [
    { id: 'ac', type: 'port-power', x: 40, y: 80, width: 40, height: 30 },
    { id: 'rca-in-1', type: 'port-rca', x: 200, y: 80, radius: 6 },
    { id: 'rca-in-2', type: 'port-rca', x: 240, y: 80, radius: 6 },
    { id: 'xlr-out-l', type: 'port-xlr', x: 400, y: 80, radius: 15, label: 'MAIN L' },
    { id: 'xlr-out-r', type: 'port-xlr', x: 440, y: 80, radius: 15, label: 'MAIN R' }
  ]
};

const TRAKTOR_S4: DeviceDefinition = {
  id: 'traktor-s4', model: 'Kontrol S4 MK3', manufacturer: 'Native Instruments', type: DeviceType.CONTROLLER, width: 542, height: 339, rearHeight: 100, description: '4-Channel DJ Controller.',
  frontControls: [
     { id: 'jog-1', type: 'jog-wheel', x: 130, y: 200, radius: 65 },
     { id: 'jog-2', type: 'jog-wheel', x: 412, y: 200, radius: 65 }
  ],
  backControls: [
    { id: 'usb', type: 'port-usb', x: 40, y: 50, width: 20, height: 10, label: 'USB' },
    { id: 'rca-in-1', type: 'port-rca', x: 150, y: 50, radius: 5 },
    { id: 'xlr-out-l', type: 'port-xlr', x: 350, y: 50, radius: 12 },
    { id: 'xlr-out-r', type: 'port-xlr', x: 380, y: 50, radius: 12 },
    { id: 'ac', type: 'port-power', x: 500, y: 50, width: 30, height: 20 }
  ]
};

const HD25: DeviceDefinition = {
    id: 'senn-hd25', model: 'HD-25', manufacturer: 'Sennheiser', type: DeviceType.ACCESSORY,
    width: 180, height: 180, rearHeight: 50,
    description: 'Industry Standard Monitoring Headphones.',
    frontControls: [
        { id: 'cups', type: 'driver', x: 90, y: 90, radius: 70, label: 'PHONES', variant: 'outline' },
        { id: 'band', type: 'button-rect', x: 40, y: 10, width: 100, height: 20, variant: 'filled' }
    ],
    backControls: []
};

const PWR_STRIP: DeviceDefinition = {
    id: 'pwr-strip', model: 'Power Strip', manufacturer: 'Generic', type: DeviceType.ACCESSORY,
    width: 400, height: 60, rearHeight: 60,
    description: '6-Way Power Distribution Unit.',
    frontControls: [
        { id: 'switch', type: 'button-rect', x: 30, y: 20, width: 20, height: 20, label: 'I/O', variant: 'accent' },
        { id: 'led', type: 'button-round', x: 60, y: 30, radius: 3, variant: 'filled' }
    ],
    backControls: [
       { id: 'ac-in', type: 'port-power', x: 380, y: 30, width: 40, height: 20, label: 'MAINS' },
       { id: 'ac-1', type: 'port-power', x: 50, y: 30, width: 30, height: 20 },
       { id: 'ac-2', type: 'port-power', x: 100, y: 30, width: 30, height: 20 },
       { id: 'ac-3', type: 'port-power', x: 150, y: 30, width: 30, height: 20 },
       { id: 'ac-4', type: 'port-power', x: 200, y: 30, width: 30, height: 20 },
       { id: 'ac-5', type: 'port-power', x: 250, y: 30, width: 30, height: 20 },
       { id: 'ac-6', type: 'port-power', x: 300, y: 30, width: 30, height: 20 }
    ]
};

// --- NEW PA SPEAKERS & SUBS ---

// JBL
const JBL_IRX112 = createSpeaker('jbl-irx112', 'IRX112BT', 'JBL', '12');
const JBL_IRX115 = createSpeaker('jbl-irx115', 'IRX115', 'JBL', '15');
const JBL_EON710 = createSpeaker('jbl-eon710', 'EON710', 'JBL', '10');
const JBL_EON715 = createSpeaker('jbl-eon715', 'EON715', 'JBL', '15');
const JBL_PRX815XLF = createSpeaker('jbl-prx815xlf', 'PRX815XLF', 'JBL', '15', true);
const JBL_PRX818XLF = createSpeaker('jbl-prx818xlf', 'PRX818XLF', 'JBL', '18', true);
const JBL_SRX818SP = createSpeaker('jbl-srx818sp', 'SRX818SP', 'JBL', '18', true);
const JBL_PRX908 = createSpeaker('jbl-prx908', 'PRX908', 'JBL', '8');
const JBL_PRX915 = createSpeaker('jbl-prx915', 'PRX915', 'JBL', '15');
const JBL_EON712 = createSpeaker('jbl-eon712', 'EON712', 'JBL', '12');

// QSC
const QSC_CP12 = createSpeaker('qsc-cp12', 'CP12', 'QSC', '12');
const QSC_K12_2 = createSpeaker('qsc-k12-2', 'K12.2', 'QSC', '12');
const QSC_K10_2 = createSpeaker('qsc-k10-2', 'K10.2', 'QSC', '10');
const QSC_CP8 = createSpeaker('qsc-cp8', 'CP8', 'QSC', '8');
const QSC_K8_2 = createSpeaker('qsc-k8-2', 'K8.2', 'QSC', '8');
const QSC_CP15 = createSpeaker('qsc-cp15', 'CP15', 'QSC', '15');
const QSC_KW153 = createSpeaker('qsc-kw153', 'KW153', 'QSC', '15'); // 3-way, approximate as 15
const QSC_KS118 = createSpeaker('qsc-ks118', 'KS118', 'QSC', '18', true);
const QSC_KS112 = createSpeaker('qsc-ks112', 'KS112', 'QSC', '12', true);

// Electro-Voice
const EV_ZLX12P = createSpeaker('ev-zlx12p', 'ZLX-12P', 'Electro-Voice', '12');
const EV_ZLX15P = createSpeaker('ev-zlx15p', 'ZLX-15P', 'Electro-Voice', '15');
const EV_ELX200_12P = createSpeaker('ev-elx200-12p', 'ELX200-12P', 'Electro-Voice', '12');
const EV_ELX200_15P = createSpeaker('ev-elx200-15p', 'ELX200-15P', 'Electro-Voice', '15');
const EV_EKX12P = createSpeaker('ev-ekx12p', 'EKX-12P', 'Electro-Voice', '12');
const EV_EKX15P = createSpeaker('ev-ekx15p', 'EKX-15P', 'Electro-Voice', '15');
const EV_ETX12P = createSpeaker('ev-etx12p', 'ETX-12P', 'Electro-Voice', '12');
const EV_EVOLVE50 = createSpeaker('ev-evolve50', 'Evolve 50', 'Electro-Voice', 'column');
const EV_ELX200_18SP = createSpeaker('ev-elx200-18sp', 'ELX200-18SP', 'Electro-Voice', '18', true);
const EV_ETX18SP = createSpeaker('ev-etx18sp', 'ETX-18SP', 'Electro-Voice', '18', true);

// Yamaha
const YAM_DBR12 = createSpeaker('yam-dbr12', 'DBR12', 'Yamaha', '12');
const YAM_DBR10 = createSpeaker('yam-dbr10', 'DBR10', 'Yamaha', '10');
const YAM_DBR15 = createSpeaker('yam-dbr15', 'DBR15', 'Yamaha', '15');
const YAM_DXR12 = createSpeaker('yam-dxr12', 'DXR12mkII', 'Yamaha', '12');
const YAM_DXR10 = createSpeaker('yam-dxr10', 'DXR10mkII', 'Yamaha', '10');
const YAM_DZR12 = createSpeaker('yam-dzr12', 'DZR12', 'Yamaha', '12');
const YAM_DZR10 = createSpeaker('yam-dzr10', 'DZR10', 'Yamaha', '10');
const YAM_DXS18 = createSpeaker('yam-dxs18', 'DXS18', 'Yamaha', '18', true);
const YAM_DXS12 = createSpeaker('yam-dxs12', 'DXS12mkII', 'Yamaha', '12', true);

// RCF
const RCF_ART912 = createSpeaker('rcf-art912', 'ART 912-A', 'RCF', '12');
const RCF_ART915 = createSpeaker('rcf-art915', 'ART 915-A', 'RCF', '15');
const RCF_EVOX12 = createSpeaker('rcf-evox12', 'EVOX 12', 'RCF', 'column');
const RCF_SUB8004 = createSpeaker('rcf-sub8004', 'SUB 8004-AS II', 'RCF', '18', true);

// Wharfedale
const WHARF_DELTA18 = createSpeaker('wharf-delta18', 'Delta 18A', 'Wharfedale', '18', true);
const WHARF_TITAN18 = createSpeaker('wharf-titan18', 'Titan 18A', 'Wharfedale', '18', true);
const WHARF_EVP18S = createSpeaker('wharf-evp18s', 'EVP-18S', 'Wharfedale', '18', true);

// LD Systems & Bose
const LD_SUB18 = createSpeaker('ld-sub18', 'SUB 18DF', 'LD Systems', '18', true);
const LD_MAUI28 = createSpeaker('ld-maui28', 'MAUI 28 G2 Sub', 'LD Systems', '12', true); // Dual 8" but resembles 12 sub size
const BOSE_F1 = createSpeaker('bose-f1', 'F1 Subwoofer', 'Bose', '12', true); // Dual 10
const BOSE_L1 = createSpeaker('bose-l1', 'L1 Pro Sub1', 'Bose', '12', true); // Oval driver

export const DEVICES: DeviceDefinition[] = [
    CDJ_3000, DJM_900, TECH_1200, XDJ_XZ, XDJ_RX3, TRAKTOR_S4,
    HD25, PWR_STRIP,
    JBL_IRX112, JBL_IRX115, JBL_EON710, JBL_EON715, JBL_PRX815XLF, JBL_PRX818XLF, JBL_SRX818SP, JBL_PRX908, JBL_PRX915, JBL_EON712,
    QSC_CP12, QSC_K12_2, QSC_K10_2, QSC_CP8, QSC_K8_2, QSC_CP15, QSC_KW153, QSC_KS118, QSC_KS112,
    EV_ZLX12P, EV_ZLX15P, EV_ELX200_12P, EV_ELX200_15P, EV_EKX12P, EV_EKX15P, EV_ETX12P, EV_EVOLVE50, EV_ELX200_18SP, EV_ETX18SP,
    YAM_DBR12, YAM_DBR10, YAM_DBR15, YAM_DXR12, YAM_DXR10, YAM_DZR12, YAM_DZR10, YAM_DXS18, YAM_DXS12,
    RCF_ART912, RCF_ART915, RCF_EVOX12, RCF_SUB8004,
    WHARF_DELTA18, WHARF_TITAN18, WHARF_EVP18S,
    LD_SUB18, LD_MAUI28, BOSE_F1, BOSE_L1
];