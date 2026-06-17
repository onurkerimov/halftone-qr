import { blockSize } from "./constants";
import { createPixelatedBackgroundRects, drawCoverImage, get2d } from "./background";
import {
  createEdgeChains,
  createJoinEdges,
  createPointerAvoidanceKeys,
  createSmoothedPathD,
  dotKey,
  getDotCenter,
} from "./connectors";
import { isDataCell } from "./qr-code";
import { createSyntheticPaddedMatrices } from "./synthetic";
import type {
  BackgroundSource,
  ConnectorStyle,
  DotShrinkage,
  FieldContext,
  JoinAlgorithm,
  QRMaskPattern,
  QRMatrix,
  RenderResult,
  RenderShape,
  StrokeCap,
  AngleField,
} from "./types";
import { clamp } from "./utils";

export function createRenderResult(
  qrBytes: QRMatrix,
  controlBytes: QRMatrix,
  dotShrinkage: DotShrinkage,
  fillColor: string,
  qrDarkColor: string,
  qrLightColor: string,
  backgroundImageHref: string,
  backgroundImage: HTMLCanvasElement | HTMLImageElement | null,
  backgroundSource: BackgroundSource,
  backgroundPixelation: number,
  joinAlgorithm: JoinAlgorithm,
  allowDiagonalJoins: boolean,
  angleField: AngleField,
  fieldContext: FieldContext,
  connectorStyle: ConnectorStyle,
  pathStrokeSize: number,
  pathSmoothing: number,
  standaloneDotScale: number,
  strokeCap: StrokeCap,
  paddingModules: number,
  syntheticPaddingData: boolean,
  syntheticPaddingFieldCompliance: number,
  maskPattern: QRMaskPattern,
): RenderResult {
  const paddedMatrices =
    syntheticPaddingData && paddingModules > 0
      ? createSyntheticPaddedMatrices(
          qrBytes,
          controlBytes,
          paddingModules,
          maskPattern,
          angleField,
          fieldContext,
          syntheticPaddingFieldCompliance,
        )
      : { controlBytes, qrBytes };
  const renderQrBytes = paddedMatrices.qrBytes;
  const renderControlBytes = paddedMatrices.controlBytes;
  const padding = syntheticPaddingData ? 0 : paddingModules * blockSize;
  const width = renderQrBytes.length * blockSize + padding * 2;
  const dotSize = blockSize / dotShrinkage;
  const pathStrokeWidth = blockSize / pathStrokeSize;
  const dotOffset = (blockSize - dotSize) / 2;
  const backgroundPixelationGrid =
    backgroundPixelation > 0
      ? Math.round((qrBytes.length * qrBytes.length) / backgroundPixelation)
      : 0;
  const pointerAvoidanceKeys = createPointerAvoidanceKeys(fieldContext, renderControlBytes, width, padding);
  const joinEdges = createJoinEdges(
    joinAlgorithm,
    renderQrBytes,
    renderControlBytes,
    allowDiagonalJoins,
    angleField,
    fieldContext,
  ).filter((edge) => !pointerAvoidanceKeys.has(dotKey(edge.from)) && !pointerAvoidanceKeys.has(dotKey(edge.to)));
  const pathDotKeys =
    connectorStyle === "paths"
      ? new Set(joinEdges.flatMap((edge) => [dotKey(edge.from), dotKey(edge.to)]))
      : new Set<string>();
  const shapes: RenderShape[] = [
    {
      fill: fillColor,
      height: width,
      kind: "rect",
      width,
      x: 0,
      y: 0,
    },
  ];

  if (backgroundImageHref) {
    if (backgroundSource === "uploaded" && backgroundImage instanceof HTMLImageElement && backgroundPixelation > 0) {
      shapes.push(...createPixelatedBackgroundRects(backgroundImage, 0, 0, width, width, backgroundPixelationGrid));
    } else {
      shapes.push({
        height: width,
        href: backgroundImageHref,
        kind: "image",
        pixelated: backgroundSource === "field" && backgroundPixelation > 0,
        width,
        x: 0,
        y: 0,
      });
    }
  }

  for (let byteRow = 0; byteRow < renderQrBytes.length; byteRow += 1) {
    for (let byteCell = 0; byteCell < renderQrBytes[byteRow].length; byteCell += 1) {
      if (pointerAvoidanceKeys.has(dotKey({ byteCell, byteRow }))) {
        continue;
      }

      if (pathDotKeys.has(dotKey({ byteCell, byteRow })) && isDataCell(renderControlBytes, byteRow, byteCell)) {
        continue;
      }

      if (connectorStyle === "paths" && strokeCap === "round" && isDataCell(renderControlBytes, byteRow, byteCell)) {
        shapes.push({
          cx: padding + byteRow * blockSize + blockSize / 2,
          cy: padding + byteCell * blockSize + blockSize / 2,
          fill: renderQrBytes[byteRow][byteCell] ? qrDarkColor : qrLightColor,
          kind: "circle",
          r: (dotSize * standaloneDotScale) / 2,
        });
        continue;
      }

      shapes.push({
        fill: renderQrBytes[byteRow][byteCell] ? qrDarkColor : qrLightColor,
        height: dotSize,
        kind: "rect",
        width: dotSize,
        x: padding + byteRow * blockSize + dotOffset,
        y: padding + byteCell * blockSize + dotOffset,
      });
    }
  }

  if (connectorStyle === "paths") {
    for (const chain of createEdgeChains(joinEdges)) {
      const color = renderQrBytes[chain[0].byteRow][chain[0].byteCell] ? qrDarkColor : qrLightColor;

      shapes.push({
        d: createSmoothedPathD(chain.map((dot) => getDotCenter(dot, padding)), pathSmoothing),
        kind: "path",
        stroke: color,
        strokeLinecap: strokeCap,
        strokeWidth: pathStrokeWidth,
      });
    }
  } else {
    for (const edge of joinEdges) {
      const color = renderQrBytes[edge.from.byteRow][edge.from.byteCell] ? qrDarkColor : qrLightColor;

      for (let connector = 1; connector < dotShrinkage; connector += 1) {
        const rowDirection = Math.sign(edge.to.byteRow - edge.from.byteRow);
        const cellDirection = Math.sign(edge.to.byteCell - edge.from.byteCell);

        shapes.push({
          fill: color,
          height: dotSize,
          kind: "rect",
          width: dotSize,
          x: padding + edge.from.byteRow * blockSize + dotOffset + dotSize * connector * rowDirection,
          y: padding + edge.from.byteCell * blockSize + dotOffset + dotSize * connector * cellDirection,
        });
      }
    }
  }

  if (fieldContext.mouse) {
    const pointerModuleX = clamp(Math.floor((fieldContext.mouse.x * width - padding) / blockSize), 0, renderQrBytes.length - 1);
    const pointerModuleY = clamp(Math.floor((fieldContext.mouse.y * width - padding) / blockSize), 0, renderQrBytes.length - 1);
    const pointerDotColor = renderQrBytes[pointerModuleX][pointerModuleY] ? qrDarkColor : qrLightColor;

    shapes.push({
      cx: fieldContext.mouse.x * width,
      cy: fieldContext.mouse.y * width,
      fill: pointerDotColor,
      kind: "circle",
      r: (dotSize * standaloneDotScale * 1.5) / 2,
    });
  }

  for (let byteRow = 0; byteRow < renderControlBytes.length; byteRow += 1) {
    for (let byteCell = 0; byteCell < renderControlBytes[byteRow].length; byteCell += 1) {
      const controlByte = renderControlBytes[byteRow][byteCell];

      if (controlByte !== null && !pointerAvoidanceKeys.has(dotKey({ byteCell, byteRow }))) {
        shapes.push({
          fill: controlByte ? qrDarkColor : qrLightColor,
          height: blockSize,
          kind: "rect",
          width: blockSize,
          x: padding + byteRow * blockSize,
          y: padding + byteCell * blockSize,
        });
      }
    }
  }

  return { shapes, width };
}

export function drawRenderResult(
  canvas: HTMLCanvasElement,
  renderResult: RenderResult,
  backgroundImage: HTMLCanvasElement | HTMLImageElement | null,
) {
  canvas.width = renderResult.width;
  canvas.height = renderResult.width;

  const ctx = get2d(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const shape of renderResult.shapes) {
    if (shape.kind === "circle") {
      ctx.fillStyle = shape.fill;
      ctx.beginPath();
      ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2);
      ctx.fill();
    } else if (shape.kind === "rect") {
      ctx.fillStyle = shape.fill;
      ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
    } else if (shape.kind === "image") {
      if (backgroundImage) {
        drawCoverImage(ctx, backgroundImage, shape.x, shape.y, shape.width, shape.height, shape.pixelated);
      }
    } else {
      const path = new Path2D(shape.d);
      ctx.lineCap = shape.strokeLinecap;
      ctx.strokeStyle = shape.stroke;
      ctx.lineWidth = shape.strokeWidth;
      ctx.stroke(path);
    }
  }
}

export function escapeAttribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

export function createSvgHref(renderResult: RenderResult): string {
  const shapes = renderResult.shapes
    .map((shape) => {
      if (shape.kind === "circle") {
        return `<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}" fill="${shape.fill}" />`;
      }

      if (shape.kind === "rect") {
        return `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${shape.fill}" />`;
      }

      if (shape.kind === "image") {
        const pixelated = shape.pixelated ? ' style="image-rendering:pixelated"' : "";
        return `<image x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" href="${escapeAttribute(shape.href)}" preserveAspectRatio="xMidYMid slice"${pixelated} />`;
      }

      return `<path d="${shape.d}" fill="none" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" stroke-linecap="${shape.strokeLinecap}" />`;
    })
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${renderResult.width}" height="${renderResult.width}" viewBox="0 0 ${renderResult.width} ${renderResult.width}" shape-rendering="crispEdges">${shapes}</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
