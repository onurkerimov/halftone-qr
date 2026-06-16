import {
  angleFields,
  backgroundSources,
  connectorStyles,
  dotShrinkages,
  errorLevels,
  joinAlgorithms,
  mainPresetSettings,
  maxGeneratedFieldResolution,
  qrMaskPatterns,
  strokeCaps,
} from "./constants";
import type { PresetSettings } from "./types";
import { isOneOf, isRecord } from "./utils";

export function parseString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

export function parseBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function parseFillColor(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

export function parseImageDataUrl(value: unknown, fallback: string): string {
  return typeof value === "string" && (value === "" || /^data:image\//.test(value)) ? value : fallback;
}

export function parseQrSize(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 10 ? value : fallback;
}

export function parsePadding(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 8 ? value : fallback;
}

export function parseBackgroundPixelation(value: unknown, fallback: number): number {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= maxGeneratedFieldResolution
    ? value
    : fallback;
}

export function parsePercentage(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100 ? value : fallback;
}

export function parsePathStrokeSize(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 2 && value <= 3 ? value : fallback;
}

export function parseStandaloneDotScale(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 4 ? value : fallback;
}

export function parseSpeedPercentage(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 300 ? value : fallback;
}

export function parseOption<T extends string | number>(values: T[], value: unknown, fallback: T): T {
  return isOneOf(values, value) ? value : fallback;
}

export function parsePresetSettings(value: unknown, fallback: PresetSettings | null): PresetSettings | null {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    allowDiagonalJoins: parseBoolean(value.allowDiagonalJoins, mainPresetSettings.allowDiagonalJoins),
    angleField: parseOption(angleFields, value.angleField, mainPresetSettings.angleField),
    angleFieldSpeed: parseSpeedPercentage(value.angleFieldSpeed, mainPresetSettings.angleFieldSpeed),
    backgroundImageHref: parseImageDataUrl(value.backgroundImageHref, mainPresetSettings.backgroundImageHref),
    backgroundPixelation: parseBackgroundPixelation(value.backgroundPixelation, mainPresetSettings.backgroundPixelation),
    backgroundSource: parseOption(backgroundSources, value.backgroundSource, mainPresetSettings.backgroundSource),
    connectorStyle: parseOption(connectorStyles, value.connectorStyle, mainPresetSettings.connectorStyle),
    dotShrinkage: parseOption(dotShrinkages, value.dotShrinkage, mainPresetSettings.dotShrinkage),
    errorLevel: parseOption(errorLevels, value.errorLevel, mainPresetSettings.errorLevel),
    evolveAngleField: parseBoolean(value.evolveAngleField, mainPresetSettings.evolveAngleField),
    fieldFirstColor: parseFillColor(value.fieldFirstColor, mainPresetSettings.fieldFirstColor),
    fieldSecondColor: parseFillColor(value.fieldSecondColor, mainPresetSettings.fieldSecondColor),
    fillColor: parseFillColor(value.fillColor, mainPresetSettings.fillColor),
    joinAlgorithm: parseOption(joinAlgorithms, value.joinAlgorithm, mainPresetSettings.joinAlgorithm),
    isPlayingMasks: parseBoolean(value.isPlayingMasks, mainPresetSettings.isPlayingMasks),
    maskPattern: parseOption(qrMaskPatterns, value.maskPattern, mainPresetSettings.maskPattern),
    maskPlaySpeed: parseSpeedPercentage(value.maskPlaySpeed, mainPresetSettings.maskPlaySpeed),
    mouseModulation: parseBoolean(value.mouseModulation, mainPresetSettings.mouseModulation),
    mouseSmoothing: parsePercentage(value.mouseSmoothing, mainPresetSettings.mouseSmoothing),
    paddingModules: parsePadding(value.paddingModules, mainPresetSettings.paddingModules),
    pathStrokeSize: parsePathStrokeSize(value.pathStrokeSize, mainPresetSettings.pathStrokeSize),
    pathSmoothing: parsePercentage(value.pathSmoothing, mainPresetSettings.pathSmoothing),
    qrDarkColor: parseFillColor(value.qrDarkColor, mainPresetSettings.qrDarkColor),
    qrLightColor: parseFillColor(value.qrLightColor, mainPresetSettings.qrLightColor),
    standaloneDotScale: parseStandaloneDotScale(value.standaloneDotScale, mainPresetSettings.standaloneDotScale),
    strokeCap: parseOption(strokeCaps, value.strokeCap, mainPresetSettings.strokeCap),
    syntheticPaddingData: parseBoolean(value.syntheticPaddingData, mainPresetSettings.syntheticPaddingData),
    syntheticPaddingFieldCompliance: parsePercentage(
      value.syntheticPaddingFieldCompliance,
      mainPresetSettings.syntheticPaddingFieldCompliance,
    ),
    userSize: parseQrSize(value.userSize, mainPresetSettings.userSize),
  };
}
