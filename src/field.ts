import { defaultFieldContext } from "./constants";
import type { AngleField, DotEdge, FieldContext, Point } from "./types";

export function rotateVector(vector: Point, angle: number): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: vector.x * cos - vector.y * sin,
    y: vector.x * sin + vector.y * cos,
  };
}

export function normalizeVector(vector: Point): Point {
  const length = Math.hypot(vector.x, vector.y) || 1;

  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}

function signOrOne(value: number): number {
  return value < 0 ? -1 : 1;
}

export function applyFieldDynamics(vector: Point, x: number, y: number, size: number, fieldContext: FieldContext): Point {
  const phaseTurn = fieldContext.phase * 0.035;
  const phaseVector = rotateVector(vector, phaseTurn);

  if (!fieldContext.mouse) {
    return phaseVector;
  }

  const normalizedX = x / Math.max(1, size - 1);
  const normalizedY = y / Math.max(1, size - 1);
  const mouseDx = normalizedX - fieldContext.mouse.x;
  const mouseDy = normalizedY - fieldContext.mouse.y;
  const mouseDistance = Math.hypot(mouseDx, mouseDy);
  const mouseAngle = Math.atan2(mouseDy, mouseDx);
  const ripple = Math.sin(mouseDistance * Math.PI * 7 - fieldContext.phase * 2.4);
  const falloff = Math.max(0, 1 - mouseDistance * 1.85);
  const mouseVector = rotateVector(vector, ripple * falloff * 0.38 + mouseAngle * falloff * 0.06);

  return normalizeVector({
    x: phaseVector.x * (1 - falloff * 0.22) + mouseVector.x * falloff * 0.22,
    y: phaseVector.y * (1 - falloff * 0.22) + mouseVector.y * falloff * 0.22,
  });
}

export function getFieldVector(
  field: AngleField,
  x: number,
  y: number,
  size: number,
  fieldContext = defaultFieldContext,
) {
  const baseCenter = (size - 1) / 2;
  const mouseCenterX = fieldContext.mouse ? fieldContext.mouse.x * (size - 1) : baseCenter;
  const mouseCenterY = fieldContext.mouse ? fieldContext.mouse.y * (size - 1) : baseCenter;
  const centerX = baseCenter + (mouseCenterX - baseCenter) * 0.9;
  const centerY = baseCenter + (mouseCenterY - baseCenter) * 0.9;
  const dx = x - centerX;
  const dy = y - centerY;
  const distance = Math.hypot(dx, dy) || 1;
  const phase = fieldContext.phase;
  const normalizedSize = Math.max(1, size - 1);
  const nx = x / normalizedSize;
  const ny = y / normalizedSize;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const angle = Math.atan2(dy, dx);

  switch (field) {
    case "horizontal":
      return applyFieldDynamics({ x: 1, y: 0 }, x, y, size, fieldContext);
    case "vertical":
      return applyFieldDynamics({ x: 0, y: 1 }, x, y, size, fieldContext);
    case "diagonalDown":
      return applyFieldDynamics({ x: 1, y: 1 }, x, y, size, fieldContext);
    case "diagonalUp":
      return applyFieldDynamics({ x: 1, y: -1 }, x, y, size, fieldContext);
    case "radial":
      return applyFieldDynamics({ x: dx / distance, y: dy / distance }, x, y, size, fieldContext);
    case "rings":
      return applyFieldDynamics({ x: -dy / distance, y: dx / distance }, x, y, size, fieldContext);
    case "spiral":
      return applyFieldDynamics(
        {
          x: Math.cos(phase * 0.12) * (dx / distance) - Math.sin(phase * 0.12) * (dy / distance),
          y: Math.cos(phase * 0.12) * (dy / distance) + Math.sin(phase * 0.12) * (dx / distance),
        },
        x,
        y,
        size,
        fieldContext,
      );
    case "wavy":
      return applyFieldDynamics(
        { x: 1, y: Math.sin((y / Math.max(1, size - 1)) * Math.PI * 4 + phase * 0.45) },
        x,
        y,
        size,
        fieldContext,
      );
    case "pinwheel":
      return applyFieldDynamics(
        {
          x: Math.cos(angle * 3 + phase * 0.35),
          y: Math.sin(angle * 3 + phase * 0.35),
        },
        x,
        y,
        size,
        fieldContext,
      );
    case "diamond":
      return applyFieldDynamics(normalizeVector({ x: signOrOne(dx), y: signOrOne(dy) }), x, y, size, fieldContext);
    case "vortex":
      return applyFieldDynamics(
        normalizeVector({
          x: dx / distance - (dy / distance) * 1.7,
          y: dy / distance + (dx / distance) * 1.7,
        }),
        x,
        y,
        size,
        fieldContext,
      );
    case "noise":
      return applyFieldDynamics(
        {
          x: Math.cos(
            Math.sin(nx * Math.PI * 3.8 + phase * 0.25) +
              Math.cos(ny * Math.PI * 5.1 - phase * 0.18) +
              Math.sin((nx + ny) * Math.PI * 2.2),
          ),
          y: Math.sin(
            Math.sin(nx * Math.PI * 4.4 - phase * 0.2) +
              Math.cos(ny * Math.PI * 3.6 + phase * 0.22) +
              Math.cos((nx - ny) * Math.PI * 2.6),
          ),
        },
        x,
        y,
        size,
        fieldContext,
      );
    case "cross": {
      const horizontalWeight = 1 / (1 + absDy * 0.85);
      const verticalWeight = 1 / (1 + absDx * 0.85);

      return applyFieldDynamics({ x: horizontalWeight, y: verticalWeight }, x, y, size, fieldContext);
    }
    case "hourglass":
      return applyFieldDynamics(
        normalizeVector({
          x: signOrOne(dx) * (0.35 + Math.abs(ny - 0.5) * 2),
          y: dy * -0.75,
        }),
        x,
        y,
        size,
        fieldContext,
      );
    case "fan":
      return applyFieldDynamics(
        normalizeVector({
          x: x + 1,
          y: y - centerY,
        }),
        x,
        y,
        size,
        fieldContext,
      );
    case "twist":
      return applyFieldDynamics(
        {
          x: Math.cos((nx + ny - 1) * Math.PI + phase * 0.2),
          y: Math.sin((nx + ny - 1) * Math.PI + phase * 0.2),
        },
        x,
        y,
        size,
        fieldContext,
      );
    case "flowMap":
      return applyFieldDynamics(
        {
          x: 1 + Math.sin(ny * Math.PI * 2.4 + phase * 0.28) * 0.9 + Math.cos(nx * Math.PI * 1.6) * 0.35,
          y: Math.sin(nx * Math.PI * 2.1 - phase * 0.22) * 0.95 + Math.cos((nx + ny) * Math.PI * 1.4) * 0.45,
        },
        x,
        y,
        size,
        fieldContext,
      );
    case "none":
      return applyFieldDynamics({ x: 1, y: 0 }, x, y, size, fieldContext);
  }
}

export function getFieldAlignment(edge: DotEdge, field: AngleField, size: number, fieldContext: FieldContext): number {
  if (field === "none") {
    return 0;
  }

  const edgeX = edge.to.byteRow - edge.from.byteRow;
  const edgeY = edge.to.byteCell - edge.from.byteCell;
  const midpointX = (edge.from.byteRow + edge.to.byteRow) / 2;
  const midpointY = (edge.from.byteCell + edge.to.byteCell) / 2;
  const fieldVector = getFieldVector(field, midpointX, midpointY, size, fieldContext);
  const edgeLength = Math.hypot(edgeX, edgeY) || 1;
  const fieldLength = Math.hypot(fieldVector.x, fieldVector.y) || 1;

  return Math.abs((edgeX * fieldVector.x + edgeY * fieldVector.y) / (edgeLength * fieldLength));
}
