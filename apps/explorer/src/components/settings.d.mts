import type { BlackHoleOptions } from "@austindelic/blackhole/react";
export type Settings = {
  camera: "horizon" | "elevated" | "close";
  quality: "mobile-safe" | "ascii-balanced" | "cinematic-ascii";
  ascii: boolean;
  exposure: number;
  bloom: number;
  paused: boolean;
};
export const defaults: Readonly<Settings>;
export const cameras: Record<
  Settings["camera"],
  {
    label: string;
    position: [number, number, number];
    forward: [number, number, number];
  }
>;
export const qualities: Settings["quality"][];
export function readSettings(
  search: string,
  options?: { reducedMotion?: boolean; mobile?: boolean },
): Settings;
export function settingsQuery(settings: Settings): string;
export function rendererProps(settings: Settings): BlackHoleOptions;
export function exportConfiguration(settings: Settings): {
  schemaVersion: number;
  package: string;
  cameraPreset: string;
  note: string;
  props: BlackHoleOptions;
};
