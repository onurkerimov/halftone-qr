import { getFieldVector } from "./field";
import { maxGeneratedFieldResolution } from "./constants";
import type { AngleField, FieldBackgroundMode, FieldContext, Point, RenderRect } from "./types";
import { clamp } from "./utils";

export function get2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create canvas rendering context.");
  }

  return context;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load background image."));
    image.src = src;
  });
}

export function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLCanvasElement | HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  pixelated = false,
) {
  const imageWidth = image instanceof HTMLCanvasElement ? image.width : image.naturalWidth;
  const imageHeight = image instanceof HTMLCanvasElement ? image.height : image.naturalHeight;
  const scale = Math.max(width / imageWidth, height / imageHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (imageWidth - sourceWidth) / 2;
  const sourceY = (imageHeight - sourceHeight) / 2;
  const previousImageSmoothing = ctx.imageSmoothingEnabled;

  ctx.imageSmoothingEnabled = !pixelated;
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  ctx.imageSmoothingEnabled = previousImageSmoothing;
}

export function createPixelatedBackgroundRects(
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  cells: number,
): RenderRect[] {
  const gridSize = clamp(Math.round(cells), 1, Math.max(1, Math.floor(Math.min(width, height))));
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = gridSize;
  sampleCanvas.height = gridSize;

  const sampleContext = get2d(sampleCanvas);
  sampleContext.imageSmoothingEnabled = false;
  drawCoverImage(sampleContext, image, 0, 0, gridSize, gridSize);

  const pixels = sampleContext.getImageData(0, 0, gridSize, gridSize).data;
  const rects: RenderRect[] = [];

  for (let row = 0; row < gridSize; row += 1) {
    const rectY = y + (height * row) / gridSize;
    const rectHeight = y + (height * (row + 1)) / gridSize - rectY;

    for (let column = 0; column < gridSize; column += 1) {
      const index = (row * gridSize + column) * 4;
      const rectX = x + (width * column) / gridSize;
      const rectWidth = x + (width * (column + 1)) / gridSize - rectX;

      rects.push({
        fill: `rgb(${pixels[index]}, ${pixels[index + 1]}, ${pixels[index + 2]})`,
        height: rectHeight,
        kind: "rect",
        width: rectWidth,
        x: rectX,
        y: rectY,
      });
    }
  }

  return rects;
}

export function hexToRgb(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

type FieldSample = {
  absDx: number;
  absDy: number;
  angle: number;
  center: Point;
  distance: number;
  nx: number;
  ny: number;
  phase: number;
  size: number;
  x: number;
  y: number;
};

function createFieldSample(x: number, y: number, size: number, fieldContext: FieldContext): FieldSample {
  const baseCenter = (size - 1) / 2;
  const mouseCenterX = fieldContext.mouse ? fieldContext.mouse.x * (size - 1) : baseCenter;
  const mouseCenterY = fieldContext.mouse ? fieldContext.mouse.y * (size - 1) : baseCenter;
  const center = {
    x: baseCenter + (mouseCenterX - baseCenter) * 0.9,
    y: baseCenter + (mouseCenterY - baseCenter) * 0.9,
  };
  const dx = x - center.x;
  const dy = y - center.y;
  const normalizedSize = Math.max(1, size - 1);

  return {
    absDx: Math.abs(dx),
    absDy: Math.abs(dy),
    angle: Math.atan2(dy, dx),
    center,
    distance: Math.hypot(dx, dy),
    nx: x / normalizedSize,
    ny: y / normalizedSize,
    phase: fieldContext.phase,
    size,
    x,
    y,
  };
}

function getOrganicFieldBackgroundPhaseWarp(sample: FieldSample, fieldBackgroundChaos: number): number {
  const chaos = clamp(fieldBackgroundChaos, 0, 100) / 100;

  if (chaos <= 0) {
    return 0;
  }

  const normalizedDistance = sample.distance / Math.max(1, sample.size - 1);
  const swirl = Math.sin(sample.angle * 3.4 + normalizedDistance * 19 + sample.phase * 0.65);
  const cellular = Math.sin((sample.nx * 5.7 + sample.ny * 3.3) * Math.PI + sample.phase * 0.4);
  const crossflow = Math.cos((sample.nx - sample.ny) * Math.PI * 7.1 - sample.angle * 2.2);

  return (swirl * 1.7 + cellular * 1.05 + crossflow * 0.8) * chaos * 3.2;
}

function getFieldBackgroundPhase(
  angleField: AngleField,
  sample: FieldSample,
  fieldBackgroundDensity: number,
  fieldBackgroundChaos: number,
): number {
  const linear = 0.16 * (clamp(fieldBackgroundDensity, 50, 500) / 100);
  const phase = sample.phase * 1.8 + getOrganicFieldBackgroundPhaseWarp(sample, fieldBackgroundChaos);

  switch (angleField) {
    case "none":
      return Math.PI / 2;
    case "horizontal":
      return sample.y * linear + phase;
    case "vertical":
      return sample.x * linear + phase;
    case "diagonalDown":
      return (sample.y - sample.x) * linear * 0.72 + phase;
    case "diagonalUp":
      return (sample.x + sample.y) * linear * 0.72 + phase;
    case "radial":
      return sample.angle * 8 + phase;
    case "rings":
      return sample.distance * linear + phase;
    case "spiral":
      return sample.angle * 5 + sample.distance * linear * 0.8 + phase;
    case "wavy":
      return (
        (sample.y + Math.sin(sample.nx * Math.PI * 4 + sample.phase * 0.45) * sample.size * 0.07) * linear +
        phase
      );
    case "pinwheel":
      return sample.angle * 9 + sample.distance * linear * 0.35 + phase;
    case "diamond":
      return (sample.absDx + sample.absDy) * linear + phase;
    case "vortex":
      return sample.angle * 4 - Math.log(sample.distance + 1) * 5.8 + phase;
    case "noise":
      return (
        Math.sin(sample.nx * Math.PI * 3.8 + sample.phase * 0.25) +
        Math.cos(sample.ny * Math.PI * 5.1 - sample.phase * 0.18) +
        Math.sin((sample.nx + sample.ny) * Math.PI * 2.2) +
        phase
      );
    case "cross":
      return Math.min(sample.absDx, sample.absDy) * linear * 1.35 + phase;
    case "hourglass":
      return (sample.absDx - sample.absDy * 0.68) * linear + phase;
    case "fan":
      return Math.atan2(sample.y - sample.center.y, sample.x + sample.size * 0.12) * 8 + phase;
    case "twist":
      return (
        (sample.nx + sample.ny - 1) * Math.PI * 5 +
        Math.sin((sample.nx - sample.ny) * Math.PI * 2 + sample.phase * 0.2) * 1.4 +
        phase
      );
    case "flowMap":
      return (
        (sample.y +
          Math.sin(sample.nx * Math.PI * 2.1 - sample.phase * 0.22) * sample.size * 0.09 +
          Math.cos((sample.nx + sample.ny) * Math.PI * 1.4) * sample.size * 0.05) *
          linear +
        phase
      );
  }
}

function getNormalFieldBackgroundPhase(
  angleField: AngleField,
  x: number,
  y: number,
  size: number,
  fieldContext: FieldContext,
): number {
  const fieldVector = getFieldVector(angleField, x, y, size, fieldContext);
  const fieldLength = Math.hypot(fieldVector.x, fieldVector.y) || 1;
  const normalX = -fieldVector.y / fieldLength;
  const normalY = fieldVector.x / fieldLength;

  return (x * normalX + y * normalY) * 0.08 + fieldContext.phase * 1.8;
}

export function createGeneratedFieldBackground(
  angleField: AngleField,
  fieldContext: FieldContext,
  firstColor: string,
  secondColor: string,
  sourceResolution: number,
  fieldBackgroundMode: FieldBackgroundMode = "contours",
  fieldBackgroundDensity = 200,
  fieldBackgroundChaos = 35,
): string {
  return createGeneratedFieldBackgroundCanvas(
    angleField,
    fieldContext,
    firstColor,
    secondColor,
    sourceResolution,
    fieldBackgroundMode,
    fieldBackgroundDensity,
    fieldBackgroundChaos,
  ).toDataURL("image/png");
}

export function createGeneratedFieldBackgroundCanvas(
  angleField: AngleField,
  fieldContext: FieldContext,
  firstColor: string,
  secondColor: string,
  sourceResolution: number,
  fieldBackgroundMode: FieldBackgroundMode = "contours",
  fieldBackgroundDensity = 200,
  fieldBackgroundChaos = 35,
): HTMLCanvasElement {
  const requestedSize = sourceResolution > 0 ? sourceResolution : maxGeneratedFieldResolution;
  const size = clamp(Math.round(requestedSize), 1, maxGeneratedFieldResolution);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = get2d(canvas);
  const image = ctx.createImageData(size, size);
  const data = image.data;
  const firstStripe = hexToRgb(firstColor);
  const secondStripe = hexToRgb(secondColor);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const fieldPhase =
        fieldBackgroundMode === "normal"
          ? getNormalFieldBackgroundPhase(angleField, x, y, size, fieldContext)
          : getFieldBackgroundPhase(
              angleField,
              createFieldSample(x, y, size, fieldContext),
              fieldBackgroundDensity,
              fieldBackgroundChaos,
            );
      const stripe = Math.sin(fieldPhase) >= 0 ? firstStripe : secondStripe;
      const index = (y * size + x) * 4;

      data[index] = stripe[0];
      data[index + 1] = stripe[1];
      data[index + 2] = stripe[2];
      data[index + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas;
}
