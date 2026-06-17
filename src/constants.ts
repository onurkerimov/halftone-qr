import type {
  AngleField,
  BackgroundSource,
  ConnectorStyle,
  DotShrinkage,
  ErrorLevel,
  FieldBackgroundMode,
  FieldContext,
  JoinAlgorithm,
  PresetSettings,
  QRMaskPattern,
  StrokeCap,
} from "./types";

export const pixelSize = 6;

export const blockSize = 3 * pixelSize;

export const storagePrefix = "halftone-qr";

export const errorLevels: ErrorLevel[] = ["L", "M", "Q", "H"];

export const dotShrinkages: DotShrinkage[] = [2, 3];

export const joinAlgorithms: JoinAlgorithm[] = [
  "none",
  "all",
  "rowSnake",
  "columnSnake",
  "spiralSnake",
  "mazeSnake",
  "fieldSnake",
];

export const angleFields: AngleField[] = [
  "none",
  "horizontal",
  "vertical",
  "diagonalDown",
  "diagonalUp",
  "radial",
  "rings",
  "spiral",
  "wavy",
  "pinwheel",
  "diamond",
  "vortex",
  "noise",
  "cross",
  "hourglass",
  "fan",
  "twist",
  "flowMap",
];

export const connectorStyles: ConnectorStyle[] = ["dots", "paths"];

export const backgroundSources: BackgroundSource[] = ["color", "uploaded", "field"];

export const fieldBackgroundModes: FieldBackgroundMode[] = ["contours", "normal"];

export const qrMaskPatterns: QRMaskPattern[] = [0, 1, 2, 3, 4, 5, 6, 7];

export const strokeCaps: StrokeCap[] = ["square", "round"];

export const maxGeneratedFieldResolution = 256;

export const defaultFieldContext: FieldContext = {
  mouse: null,
  phase: 0,
};

export const mainPresetSettings: PresetSettings = {
  allowDiagonalJoins: true,
  angleField: "pinwheel",
  angleFieldSpeed: 15,
  backgroundImageHref: "",
  backgroundPixelation: maxGeneratedFieldResolution,
  backgroundSource: "field",
  connectorStyle: "paths",
  dotShrinkage: 2,
  errorLevel: "H",
  evolveAngleField: true,
  fieldBackgroundChaos: 35,
  fieldBackgroundDensity: 200,
  fieldBackgroundMode: "contours",
  fieldFirstColor: "#d562a9",
  fieldSecondColor: "#5ba3d7",
  fillColor: "#7fb8d8",
  joinAlgorithm: "fieldSnake",
  isPlayingMasks: true,
  maskPattern: 3,
  maskPlaySpeed: 15,
  mouseModulation: true,
  mouseSmoothing: 0,
  paddingModules: 4,
  pathStrokeSize: 2.65,
  pathSmoothing: 100,
  qrDarkColor: "#ffffff",
  qrLightColor: "#000000",
  standaloneDotScale: 1.5,
  strokeCap: "round",
  syntheticPaddingData: true,
  syntheticPaddingFieldCompliance: 100,
  userSize: 5,
};
