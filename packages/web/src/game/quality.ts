export type Quality = 'high' | 'medium' | 'low';

export type QualityConfig = {
  label: string;
  dpr: [number, number];
  shadowMap: number;
  softShadows: boolean;
  contactShadows: boolean;
  sparkles: boolean;
  outlines: boolean;
};

export const QUALITY: Record<Quality, QualityConfig> = {
  high: {
    label: '高',
    dpr: [2.5, 3],
    shadowMap: 4096,
    softShadows: true,
    contactShadows: true,
    sparkles: true,
    outlines: true,
  },
  medium: {
    label: '中',
    dpr: [1.5, 2],
    shadowMap: 2048,
    softShadows: true,
    contactShadows: false,
    sparkles: false,
    outlines: true,
  },
  low: {
    label: '低',
    dpr: [1, 1.5],
    shadowMap: 1024,
    softShadows: false,
    contactShadows: false,
    sparkles: false,
    outlines: false,
  },
};

const KEY = 'dsh-quality';

export function readQuality(): Quality {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'high' || v === 'medium' || v === 'low') return v;
  } catch {
    // ignore
  }
  return 'high';
}

export function writeQuality(q: Quality): void {
  try {
    localStorage.setItem(KEY, q);
  } catch {
    // ignore
  }
}
