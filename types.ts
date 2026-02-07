export type Theme = 'green' | 'amber' | 'magenta' | 'cyan' | 'bw';

export interface ParsedExifData {
  id: string; // Unique ID
  filename: string;
  fileSize: string;
  mimeType: string;
  dimensions?: string;
  make?: string;
  model?: string;
  lens?: string;
  fNumber?: string;
  exposureTime?: string;
  iso?: string;
  focalLength?: string;
  dateTimeOriginal?: string;
  gps?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  thumbnailUrl?: string;
  software?: string;
  colorSpace?: string;
  flash?: string;
  whiteBalance?: string;
  orientation?: string;
  allTags: Record<string, string>;
  checksum?: string; // SHA-256
  blob?: Blob; // For download/processing (transient)
}

export enum AppState {
  BOOTING,
  IDLE,
  PROCESSING,
  VIEWING_SINGLE,
  VIEWING_BATCH,
  COMPARE,
  HISTORY,
  ERROR
}

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  unlocked: boolean;
  icon: string;
}

export interface SoundContextType {
  playSound: (type: 'click' | 'success' | 'error' | 'typing') => void;
  isMuted: boolean;
  toggleMute: () => void;
}
