export const PRESETS = [15, 30, 45, 60] as const;
export type Preset = (typeof PRESETS)[number];

export const isPreset = (v: number): v is Preset =>
  (PRESETS as readonly number[]).includes(v);

export const clampPeriod = (v: number): number =>
  Math.min(180, Math.max(5, v));

export const nearestPreset = (v: number): Preset =>
  PRESETS.reduce((prev, curr) =>
    Math.abs(curr - v) < Math.abs(prev - v) ? curr : prev
  );
