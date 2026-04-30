// ─── Static geometry ──────────────────────────────────────────
export const BIRD_X = -1.5;
export const BIRD_RADIUS = 0.28;
export const BIRD_START_Y = 0;
export const GROUND_Y = -3.8;
export const CEILING_Y = 5.5;
export const MAX_FALL_SPEED = -13;

export const PIPE_RADIUS = 0.4;
export const PIPE_CAP_RADIUS = 0.52;
export const PIPE_CAP_HEIGHT = 0.3;
export const PIPE_SPAWN_X = 10;
export const PIPE_DESPAWN_X = -8;

export const SCENE_CHANGE_INTERVAL = 20;

// ─── Difficulty ──────────────────────────────────────────────
export type Difficulty = "rookie" | "normal" | "master";

export interface DifficultyConfig {
  label: string;
  pipeGap: number;
  pipeSpeed: number;
  pipeSpacing: number;
  gravity: number;
  flapForce: number;
  color: string;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  rookie: {
    label: "Rookie",
    pipeGap: 3.0,
    pipeSpeed: 3.2,
    pipeSpacing: 4.5,
    gravity: -22,
    flapForce: 7.8,
    color: "#4ade80",
  },
  normal: {
    label: "Normal",
    pipeGap: 2.4,
    pipeSpeed: 4.0,
    pipeSpacing: 3.8,
    gravity: -25,
    flapForce: 8.1,
    color: "#facc15",
  },
  master: {
    label: "Master",
    pipeGap: 1.8,
    pipeSpeed: 5.5,
    pipeSpacing: 3.0,
    gravity: -28,
    flapForce: 8.5,
    color: "#ef4444",
  },
};

export const DIFFICULTY_KEYS: Difficulty[] = ["rookie", "normal", "master"];

// ─── Scene Themes ────────────────────────────────────────────
export interface SceneTheme {
  name: string;
  skyTop: number;
  skyBottom: number;
  fogColor: number;
  groundColor: number;
  dirtColor: number;
  pipeColor: number;
  pipeCapColor: number;
  pipeEmissive: number;
  pipeEmissiveIntensity: number;
  hillColor1: number;
  hillColor2: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  dirColor: number;
  dirIntensity: number;
  fillColor: number;
  fillIntensity: number;
  cloudOpacity: number;
  showSun: boolean;
  showStars: boolean;
  showMoon: boolean;
  showGrid: boolean;
}

export const THEMES: SceneTheme[] = [
  {
    name: "Meadow",
    skyTop: 0x5ba3d9,
    skyBottom: 0xd4eaf7,
    fogColor: 0xc8e6ff,
    groundColor: 0x8bc34a,
    dirtColor: 0x795548,
    pipeColor: 0x4caf50,
    pipeCapColor: 0x388e3c,
    pipeEmissive: 0x000000,
    pipeEmissiveIntensity: 0,
    hillColor1: 0x66bb6a,
    hillColor2: 0x558b2f,
    hemiSky: 0x87ceeb,
    hemiGround: 0x8bc34a,
    hemiIntensity: 0.6,
    dirColor: 0xffffff,
    dirIntensity: 1.0,
    fillColor: 0xffe4c4,
    fillIntensity: 0.3,
    cloudOpacity: 0.85,
    showSun: true,
    showStars: false,
    showMoon: false,
    showGrid: false,
  },
  {
    name: "Sunset",
    skyTop: 0x2d1b69,
    skyBottom: 0xff7e5f,
    fogColor: 0xd4a076,
    groundColor: 0xc8a951,
    dirtColor: 0x8d6e2f,
    pipeColor: 0xd4a017,
    pipeCapColor: 0xb8860b,
    pipeEmissive: 0x000000,
    pipeEmissiveIntensity: 0,
    hillColor1: 0x9b7a3a,
    hillColor2: 0x7a5c1f,
    hemiSky: 0xff6347,
    hemiGround: 0xc8a951,
    hemiIntensity: 0.5,
    dirColor: 0xffa040,
    dirIntensity: 1.2,
    fillColor: 0xff6b35,
    fillIntensity: 0.4,
    cloudOpacity: 0.65,
    showSun: true,
    showStars: false,
    showMoon: false,
    showGrid: false,
  },
  {
    name: "Night",
    skyTop: 0x0a0e27,
    skyBottom: 0x1a2040,
    fogColor: 0x0f1535,
    groundColor: 0x2e4a2e,
    dirtColor: 0x3e2723,
    pipeColor: 0x546e7a,
    pipeCapColor: 0x37474f,
    pipeEmissive: 0x223355,
    pipeEmissiveIntensity: 0.15,
    hillColor1: 0x1b5e20,
    hillColor2: 0x194d19,
    hemiSky: 0x223366,
    hemiGround: 0x2e4a2e,
    hemiIntensity: 0.3,
    dirColor: 0xaaccff,
    dirIntensity: 0.6,
    fillColor: 0x4466aa,
    fillIntensity: 0.2,
    cloudOpacity: 0.25,
    showSun: false,
    showStars: true,
    showMoon: true,
    showGrid: false,
  },
  {
    name: "Neon",
    skyTop: 0x0d0221,
    skyBottom: 0x150734,
    fogColor: 0x0d0221,
    groundColor: 0x1a1a2e,
    dirtColor: 0x16213e,
    pipeColor: 0x00e5ff,
    pipeCapColor: 0xe040fb,
    pipeEmissive: 0x00e5ff,
    pipeEmissiveIntensity: 0.5,
    hillColor1: 0x1a1a2e,
    hillColor2: 0x0f0f23,
    hemiSky: 0x4a148c,
    hemiGround: 0x1a1a2e,
    hemiIntensity: 0.35,
    dirColor: 0xe040fb,
    dirIntensity: 0.8,
    fillColor: 0x00e5ff,
    fillIntensity: 0.5,
    cloudOpacity: 0.12,
    showSun: false,
    showStars: true,
    showMoon: false,
    showGrid: true,
  },
];
