import type {
  AngleField,
  BackgroundSource,
  ConnectorStyle,
  DotShrinkage,
  ErrorLevel,
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
];

export const connectorStyles: ConnectorStyle[] = ["dots", "paths"];

export const backgroundSources: BackgroundSource[] = ["color", "uploaded", "field"];

export const qrMaskPatterns: QRMaskPattern[] = [0, 1, 2, 3, 4, 5, 6, 7];

export const strokeCaps: StrokeCap[] = ["square", "round"];

export const maxGeneratedFieldResolution = 512;

export const defaultFieldContext: FieldContext = {
  mouse: null,
  phase: 0,
};

export const mainPresetSettings: PresetSettings = {
  allowDiagonalJoins: true,
  angleField: "rings",
  angleFieldSpeed: 100,
  backgroundImageHref: "",
  backgroundPixelation: 0,
  backgroundSource: "field",
  connectorStyle: "dots",
  dotShrinkage: 2,
  errorLevel: "H",
  evolveAngleField: true,
  fieldFirstColor: "#ff3eb5",
  fieldSecondColor: "#149cff",
  fillColor: "#7fb8d8",
  joinAlgorithm: "fieldSnake",
  isPlayingMasks: false,
  maskPattern: 0,
  maskPlaySpeed: 100,
  mouseModulation: true,
  mouseSmoothing: 30,
  paddingModules: 3,
  pathStrokeSize: 2,
  pathSmoothing: 0,
  qrDarkColor: "#000000",
  qrLightColor: "#ffffff",
  standaloneDotScale: 2,
  strokeCap: "square",
  syntheticPaddingData: true,
  syntheticPaddingFieldCompliance: 100,
  userSize: 6,
};
