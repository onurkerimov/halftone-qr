import { getFieldVector } from "./field";
import type { AngleField, FieldContext, RenderRect } from "./types";
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
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  pixelated = false,
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
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

export function createGeneratedFieldBackground(
  angleField: AngleField,
  fieldContext: FieldContext,
  firstColor: string,
  secondColor: string,
  sourceResolution: number,
): string {
  const size = sourceResolution > 0 ? sourceResolution : 480;
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
      const fieldVector = getFieldVector(angleField, x, y, size, fieldContext);
      const fieldLength = Math.hypot(fieldVector.x, fieldVector.y) || 1;
      const normalX = -fieldVector.y / fieldLength;
      const normalY = fieldVector.x / fieldLength;
      const stripe =
        Math.sin((x * normalX + y * normalY) * 0.08 + fieldContext.phase * 1.8) >= 0
          ? firstStripe
          : secondStripe;
      const index = (y * size + x) * 4;

      data[index] = stripe[0];
      data[index + 1] = stripe[1];
      data[index + 2] = stripe[2];
      data[index + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}
