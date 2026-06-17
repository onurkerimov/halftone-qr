export type ErrorLevel = "L" | "M" | "Q" | "H";

export type DotShrinkage = 2 | 3;

export type ConnectorStyle = "dots" | "paths";

export type BackgroundSource = "color" | "uploaded" | "field";

export type FieldBackgroundMode = "contours" | "normal";

export type QRMaskPattern = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type StrokeCap = "square" | "round";

export type JoinAlgorithm =
  | "none"
  | "all"
  | "rowSnake"
  | "columnSnake"
  | "spiralSnake"
  | "mazeSnake"
  | "fieldSnake";

export type AngleField =
  | "none"
  | "horizontal"
  | "vertical"
  | "diagonalDown"
  | "diagonalUp"
  | "radial"
  | "rings"
  | "spiral"
  | "wavy"
  | "pinwheel"
  | "diamond"
  | "vortex"
  | "noise"
  | "cross"
  | "hourglass"
  | "fan"
  | "twist"
  | "flowMap";

export type QRCell = boolean | null;

export type QRMatrix = QRCell[][];

export type DotCell = {
  byteCell: number;
  byteRow: number;
};

export type DotEdge = {
  from: DotCell;
  to: DotCell;
};

export type Point = {
  x: number;
  y: number;
};

export type FieldContext = {
  mouse: Point | null;
  phase: number;
};

export type RenderCircle = {
  cx: number;
  cy: number;
  fill: string;
  kind: "circle";
  r: number;
};

export type RenderRect = {
  kind: "rect";
  fill: string;
  height: number;
  width: number;
  x: number;
  y: number;
};

export type RenderPath = {
  d: string;
  kind: "path";
  stroke: string;
  strokeLinecap: StrokeCap;
  strokeWidth: number;
};

export type RenderImage = {
  height: number;
  href: string;
  kind: "image";
  pixelated?: boolean;
  width: number;
  x: number;
  y: number;
};

export type RenderShape = RenderCircle | RenderImage | RenderRect | RenderPath;

export type RenderResult = {
  shapes: RenderShape[];
  width: number;
};

export type PresetSettings = {
  allowDiagonalJoins: boolean;
  angleField: AngleField;
  angleFieldSpeed: number;
  backgroundImageHref: string;
  backgroundPixelation: number;
  backgroundSource: BackgroundSource;
  connectorStyle: ConnectorStyle;
  dotShrinkage: DotShrinkage;
  errorLevel: ErrorLevel;
  evolveAngleField: boolean;
  fieldBackgroundChaos: number;
  fieldBackgroundDensity: number;
  fieldBackgroundDominance: number;
  fieldBackgroundMode: FieldBackgroundMode;
  fieldFirstColor: string;
  fieldSecondColor: string;
  fillColor: string;
  joinAlgorithm: JoinAlgorithm;
  isPlayingMasks: boolean;
  maskPattern: QRMaskPattern;
  maskPlaySpeed: number;
  mouseModulation: boolean;
  mouseSmoothing: number;
  paddingModules: number;
  pathStrokeSize: number;
  pathSmoothing: number;
  qrDarkColor: string;
  qrLightColor: string;
  standaloneDotScale: number;
  strokeCap: StrokeCap;
  syntheticPaddingData: boolean;
  syntheticPaddingFieldCompliance: number;
  userSize: number;
};

export type QRCode = {
  addData(data: string): void;
  make(onlyControl?: boolean, maskPattern?: QRMaskPattern): void;
  returnByteArray(): QRMatrix;
};
