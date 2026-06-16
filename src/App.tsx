import { useCallback, useEffect, useRef, useState } from "react";
import qrcode from "./qr";

type ErrorLevel = "L" | "M" | "Q" | "H";
type DotShrinkage = 2 | 3;
type ConnectorStyle = "dots" | "paths";
type StrokeCap = "square" | "round";
type JoinAlgorithm =
  | "none"
  | "all"
  | "rowSnake"
  | "columnSnake"
  | "spiralSnake"
  | "mazeSnake"
  | "fieldSnake";
type AngleField =
  | "none"
  | "horizontal"
  | "vertical"
  | "diagonalDown"
  | "diagonalUp"
  | "radial"
  | "rings"
  | "spiral"
  | "wavy"
  | "pinwheel";
type QRCell = boolean | null;
type QRMatrix = QRCell[][];
type DotCell = {
  byteCell: number;
  byteRow: number;
};
type DotEdge = {
  from: DotCell;
  to: DotCell;
};
type RenderRect = {
  kind: "rect";
  fill: string;
  height: number;
  width: number;
  x: number;
  y: number;
};
type RenderPath = {
  d: string;
  kind: "path";
  stroke: string;
  strokeLinecap: StrokeCap;
  strokeWidth: number;
};
type RenderShape = RenderRect | RenderPath;
type RenderResult = {
  shapes: RenderShape[];
  width: number;
};

type QRCode = {
  addData(data: string): void;
  make(onlyControl?: boolean): void;
  returnByteArray(): QRMatrix;
};

const pixelSize = 6;
const blockSize = 3 * pixelSize;
const storagePrefix = "halftone-qr";

const errorLevels: ErrorLevel[] = ["L", "M", "Q", "H"];
const dotShrinkages: DotShrinkage[] = [2, 3];
const joinAlgorithms: JoinAlgorithm[] = [
  "none",
  "all",
  "rowSnake",
  "columnSnake",
  "spiralSnake",
  "mazeSnake",
  "fieldSnake",
];
const angleFields: AngleField[] = [
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
const connectorStyles: ConnectorStyle[] = ["dots", "paths"];
const strokeCaps: StrokeCap[] = ["square", "round"];

function isOneOf<T extends string | number>(values: T[], value: unknown): value is T {
  return values.includes(value as T);
}

function parseString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function parseFillColor(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function parseQrSize(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 10 ? value : fallback;
}

function parseOption<T extends string | number>(values: T[], value: unknown, fallback: T): T {
  return isOneOf(values, value) ? value : fallback;
}

function readStoredState<T>(key: string, fallback: T, parse: (value: unknown, fallback: T) => T): T {
  try {
    const stored = window.localStorage.getItem(`${storagePrefix}:${key}`);

    if (stored === null) {
      return fallback;
    }

    return parse(JSON.parse(stored), fallback);
  } catch {
    return fallback;
  }
}

function useStoredState<T>(key: string, fallback: T, parse: (value: unknown, fallback: T) => T) {
  const [value, setValue] = useState(() => readStoredState(key, fallback, parse));

  useEffect(() => {
    window.localStorage.setItem(`${storagePrefix}:${key}`, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

function get2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create canvas rendering context.");
  }

  return context;
}

function createQr(size: number, errorLevel: ErrorLevel, text: string): QRCode {
  const qr = qrcode(size, errorLevel) as QRCode;
  qr.addData(text);
  return qr;
}

function createQrMatrices(size: number, errorLevel: ErrorLevel, text: string) {
  const qr = createQr(size, errorLevel, text);
  qr.make();

  const controls = createQr(size, errorLevel, text);
  controls.make(true);

  return {
    controlBytes: controls.returnByteArray(),
    qrBytes: qr.returnByteArray(),
  };
}

function isDataCell(controlBytes: QRMatrix, byteRow: number, byteCell: number): boolean {
  return controlBytes[byteRow]?.[byteCell] === null;
}

function dotKey(dot: DotCell): string {
  return `${dot.byteRow},${dot.byteCell}`;
}

function canJoinDots(
  qrBytes: QRMatrix,
  controlBytes: QRMatrix,
  first: DotCell,
  second: DotCell,
  allowDiagonalJoins: boolean,
): boolean {
  const rowDistance = Math.abs(first.byteRow - second.byteRow);
  const cellDistance = Math.abs(first.byteCell - second.byteCell);
  const isNeighbor = allowDiagonalJoins
    ? rowDistance <= 1 && cellDistance <= 1 && rowDistance + cellDistance > 0
    : rowDistance + cellDistance === 1;

  return (
    isDataCell(controlBytes, first.byteRow, first.byteCell) &&
    isDataCell(controlBytes, second.byteRow, second.byteCell) &&
    qrBytes[first.byteRow][first.byteCell] === qrBytes[second.byteRow][second.byteCell] &&
    isNeighbor
  );
}

function edgeFromPath(
  qrBytes: QRMatrix,
  controlBytes: QRMatrix,
  first: DotCell,
  second: DotCell,
  allowDiagonalJoins: boolean,
): DotEdge | null {
  if (!canJoinDots(qrBytes, controlBytes, first, second, allowDiagonalJoins)) {
    return null;
  }

  return { from: first, to: second };
}

function createPathEdges(
  qrBytes: QRMatrix,
  controlBytes: QRMatrix,
  path: DotCell[],
  allowDiagonalJoins: boolean,
): DotEdge[] {
  const edges: DotEdge[] = [];

  for (let index = 1; index < path.length; index += 1) {
    const edge = edgeFromPath(qrBytes, controlBytes, path[index - 1], path[index], allowDiagonalJoins);

    if (edge) {
      edges.push(edge);
    }
  }

  return edges;
}

function createRowSnakePath(size: number): DotCell[] {
  const path: DotCell[] = [];

  for (let byteCell = 0; byteCell < size; byteCell += 1) {
    if (byteCell % 2 === 0) {
      for (let byteRow = 0; byteRow < size; byteRow += 1) {
        path.push({ byteCell, byteRow });
      }
    } else {
      for (let byteRow = size - 1; byteRow >= 0; byteRow -= 1) {
        path.push({ byteCell, byteRow });
      }
    }
  }

  return path;
}

function createColumnSnakePath(size: number): DotCell[] {
  const path: DotCell[] = [];

  for (let byteRow = 0; byteRow < size; byteRow += 1) {
    if (byteRow % 2 === 0) {
      for (let byteCell = 0; byteCell < size; byteCell += 1) {
        path.push({ byteCell, byteRow });
      }
    } else {
      for (let byteCell = size - 1; byteCell >= 0; byteCell -= 1) {
        path.push({ byteCell, byteRow });
      }
    }
  }

  return path;
}

function createSpiralSnakePath(size: number): DotCell[] {
  const path: DotCell[] = [];
  let left = 0;
  let right = size - 1;
  let top = 0;
  let bottom = size - 1;

  while (left <= right && top <= bottom) {
    for (let byteRow = left; byteRow <= right; byteRow += 1) {
      path.push({ byteCell: top, byteRow });
    }
    top += 1;

    for (let byteCell = top; byteCell <= bottom; byteCell += 1) {
      path.push({ byteCell, byteRow: right });
    }
    right -= 1;

    if (top <= bottom) {
      for (let byteRow = right; byteRow >= left; byteRow -= 1) {
        path.push({ byteCell: bottom, byteRow });
      }
      bottom -= 1;
    }

    if (left <= right) {
      for (let byteCell = bottom; byteCell >= top; byteCell -= 1) {
        path.push({ byteCell, byteRow: left });
      }
      left += 1;
    }
  }

  return path;
}

function createAllMatchingNeighborEdges(
  qrBytes: QRMatrix,
  controlBytes: QRMatrix,
  allowDiagonalJoins: boolean,
): DotEdge[] {
  const edges: DotEdge[] = [];
  const offsets = allowDiagonalJoins
    ? [
        [1, 0],
        [0, 1],
        [1, 1],
        [1, -1],
      ]
    : [
        [1, 0],
        [0, 1],
      ];

  for (let byteRow = 0; byteRow < qrBytes.length; byteRow += 1) {
    for (let byteCell = 0; byteCell < qrBytes[byteRow].length; byteCell += 1) {
      const current = { byteCell, byteRow };

      for (const [rowOffset, cellOffset] of offsets) {
        const next = {
          byteCell: byteCell + cellOffset,
          byteRow: byteRow + rowOffset,
        };

        if (
          next.byteRow < 0 ||
          next.byteRow >= qrBytes.length ||
          next.byteCell < 0 ||
          next.byteCell >= qrBytes[byteRow].length
        ) {
          continue;
        }

        const edge = edgeFromPath(qrBytes, controlBytes, current, next, allowDiagonalJoins);

        if (edge) {
          edges.push(edge);
        }
      }
    }
  }

  return edges;
}

function getParent(parents: Map<string, string>, key: string): string {
  const parent = parents.get(key) ?? key;

  if (parent === key) {
    parents.set(key, key);
    return key;
  }

  const root = getParent(parents, parent);
  parents.set(key, root);
  return root;
}

function joinParents(parents: Map<string, string>, first: string, second: string) {
  parents.set(getParent(parents, second), getParent(parents, first));
}

function edgeWeight(edge: DotEdge): number {
  const first = edge.from.byteRow * 73856093 + edge.from.byteCell * 19349663;
  const second = edge.to.byteRow * 83492791 + edge.to.byteCell * 2971215073;

  return (first ^ second) >>> 0;
}

function getFieldVector(field: AngleField, x: number, y: number, size: number) {
  const center = (size - 1) / 2;
  const dx = x - center;
  const dy = y - center;
  const distance = Math.hypot(dx, dy) || 1;

  switch (field) {
    case "horizontal":
      return { x: 1, y: 0 };
    case "vertical":
      return { x: 0, y: 1 };
    case "diagonalDown":
      return { x: 1, y: 1 };
    case "diagonalUp":
      return { x: 1, y: -1 };
    case "radial":
      return { x: dx / distance, y: dy / distance };
    case "rings":
      return { x: -dy / distance, y: dx / distance };
    case "spiral":
      return { x: dx / distance - dy / distance, y: dy / distance + dx / distance };
    case "wavy":
      return { x: 1, y: Math.sin((y / Math.max(1, size - 1)) * Math.PI * 4) };
    case "pinwheel":
      return {
        x: Math.cos(Math.atan2(dy, dx) * 3),
        y: Math.sin(Math.atan2(dy, dx) * 3),
      };
    case "none":
      return { x: 1, y: 0 };
  }
}

function getFieldAlignment(edge: DotEdge, field: AngleField, size: number): number {
  if (field === "none") {
    return 0;
  }

  const edgeX = edge.to.byteRow - edge.from.byteRow;
  const edgeY = edge.to.byteCell - edge.from.byteCell;
  const midpointX = (edge.from.byteRow + edge.to.byteRow) / 2;
  const midpointY = (edge.from.byteCell + edge.to.byteCell) / 2;
  const fieldVector = getFieldVector(field, midpointX, midpointY, size);
  const edgeLength = Math.hypot(edgeX, edgeY) || 1;
  const fieldLength = Math.hypot(fieldVector.x, fieldVector.y) || 1;

  return Math.abs((edgeX * fieldVector.x + edgeY * fieldVector.y) / (edgeLength * fieldLength));
}

function createMazeSnakeEdges(
  qrBytes: QRMatrix,
  controlBytes: QRMatrix,
  allowDiagonalJoins: boolean,
): DotEdge[] {
  const edges = createAllMatchingNeighborEdges(qrBytes, controlBytes, allowDiagonalJoins).sort(
    (first, second) => edgeWeight(first) - edgeWeight(second),
  );
  const degree = new Map<string, number>();
  const parents = new Map<string, string>();
  const selected: DotEdge[] = [];

  for (const edge of edges) {
    const firstKey = dotKey(edge.from);
    const secondKey = dotKey(edge.to);
    const firstDegree = degree.get(firstKey) ?? 0;
    const secondDegree = degree.get(secondKey) ?? 0;

    if (firstDegree >= 2 || secondDegree >= 2 || getParent(parents, firstKey) === getParent(parents, secondKey)) {
      continue;
    }

    degree.set(firstKey, firstDegree + 1);
    degree.set(secondKey, secondDegree + 1);
    joinParents(parents, firstKey, secondKey);
    selected.push(edge);
  }

  return selected;
}

function createNonForkingEdges(edges: DotEdge[]): DotEdge[] {
  const degree = new Map<string, number>();
  const parents = new Map<string, string>();
  const selected: DotEdge[] = [];

  for (const edge of edges) {
    const firstKey = dotKey(edge.from);
    const secondKey = dotKey(edge.to);
    const firstDegree = degree.get(firstKey) ?? 0;
    const secondDegree = degree.get(secondKey) ?? 0;

    if (firstDegree >= 2 || secondDegree >= 2 || getParent(parents, firstKey) === getParent(parents, secondKey)) {
      continue;
    }

    degree.set(firstKey, firstDegree + 1);
    degree.set(secondKey, secondDegree + 1);
    joinParents(parents, firstKey, secondKey);
    selected.push(edge);
  }

  return selected;
}

function createFieldSnakeEdges(
  qrBytes: QRMatrix,
  controlBytes: QRMatrix,
  allowDiagonalJoins: boolean,
  angleField: AngleField,
): DotEdge[] {
  const edges = createAllMatchingNeighborEdges(qrBytes, controlBytes, allowDiagonalJoins).sort((first, second) => {
    const alignmentDifference =
      getFieldAlignment(second, angleField, qrBytes.length) - getFieldAlignment(first, angleField, qrBytes.length);

    if (Math.abs(alignmentDifference) > 0.0001) {
      return alignmentDifference;
    }

    return edgeWeight(first) - edgeWeight(second);
  });

  return createNonForkingEdges(edges);
}

function createJoinEdges(
  algorithm: JoinAlgorithm,
  qrBytes: QRMatrix,
  controlBytes: QRMatrix,
  allowDiagonalJoins: boolean,
  angleField: AngleField,
): DotEdge[] {
  switch (algorithm) {
    case "all":
      return createAllMatchingNeighborEdges(qrBytes, controlBytes, allowDiagonalJoins);
    case "rowSnake":
      return createPathEdges(qrBytes, controlBytes, createRowSnakePath(qrBytes.length), allowDiagonalJoins);
    case "columnSnake":
      return createPathEdges(qrBytes, controlBytes, createColumnSnakePath(qrBytes.length), allowDiagonalJoins);
    case "spiralSnake":
      return createPathEdges(qrBytes, controlBytes, createSpiralSnakePath(qrBytes.length), allowDiagonalJoins);
    case "mazeSnake":
      return createMazeSnakeEdges(qrBytes, controlBytes, allowDiagonalJoins);
    case "fieldSnake":
      return createFieldSnakeEdges(qrBytes, controlBytes, allowDiagonalJoins, angleField);
    case "none":
      return [];
  }
}

function createRenderResult(
  qrBytes: QRMatrix,
  controlBytes: QRMatrix,
  dotShrinkage: DotShrinkage,
  fillColor: string,
  joinAlgorithm: JoinAlgorithm,
  allowDiagonalJoins: boolean,
  angleField: AngleField,
  connectorStyle: ConnectorStyle,
  strokeCap: StrokeCap,
): RenderResult {
  const width = qrBytes.length * blockSize;
  const dotSize = blockSize / dotShrinkage;
  const dotOffset = (blockSize - dotSize) / 2;
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

  for (let byteRow = 0; byteRow < qrBytes.length; byteRow += 1) {
    for (let byteCell = 0; byteCell < qrBytes[byteRow].length; byteCell += 1) {
      shapes.push({
        fill: qrBytes[byteRow][byteCell] ? "black" : "white",
        height: dotSize,
        kind: "rect",
        width: dotSize,
        x: byteRow * blockSize + dotOffset,
        y: byteCell * blockSize + dotOffset,
      });
    }
  }

  for (const edge of createJoinEdges(joinAlgorithm, qrBytes, controlBytes, allowDiagonalJoins, angleField)) {
    const color = qrBytes[edge.from.byteRow][edge.from.byteCell] ? "black" : "white";

    if (connectorStyle === "paths") {
      const startX = edge.from.byteRow * blockSize + blockSize / 2;
      const startY = edge.from.byteCell * blockSize + blockSize / 2;
      const endX = edge.to.byteRow * blockSize + blockSize / 2;
      const endY = edge.to.byteCell * blockSize + blockSize / 2;

      shapes.push({
        d: `M ${startX} ${startY} L ${endX} ${endY}`,
        kind: "path",
        stroke: color,
        strokeLinecap: strokeCap,
        strokeWidth: dotSize,
      });
    } else {
      for (let connector = 1; connector < dotShrinkage; connector += 1) {
        const rowDirection = Math.sign(edge.to.byteRow - edge.from.byteRow);
        const cellDirection = Math.sign(edge.to.byteCell - edge.from.byteCell);

        shapes.push({
          fill: color,
          height: dotSize,
          kind: "rect",
          width: dotSize,
          x: edge.from.byteRow * blockSize + dotOffset + dotSize * connector * rowDirection,
          y: edge.from.byteCell * blockSize + dotOffset + dotSize * connector * cellDirection,
        });
      }
    }
  }

  for (let byteRow = 0; byteRow < controlBytes.length; byteRow += 1) {
    for (let byteCell = 0; byteCell < controlBytes[byteRow].length; byteCell += 1) {
      const controlByte = controlBytes[byteRow][byteCell];

      if (controlByte !== null) {
        shapes.push({
          fill: controlByte ? "black" : "white",
          height: blockSize,
          kind: "rect",
          width: blockSize,
          x: byteRow * blockSize,
          y: byteCell * blockSize,
        });
      }
    }
  }

  return { shapes, width };
}

function drawRenderResult(canvas: HTMLCanvasElement, renderResult: RenderResult) {
  canvas.width = renderResult.width;
  canvas.height = renderResult.width;

  const ctx = get2d(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const shape of renderResult.shapes) {
    if (shape.kind === "rect") {
      ctx.fillStyle = shape.fill;
      ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
    } else {
      const path = new Path2D(shape.d);
      ctx.lineCap = shape.strokeLinecap;
      ctx.strokeStyle = shape.stroke;
      ctx.lineWidth = shape.strokeWidth;
      ctx.stroke(path);
    }
  }
}

function createSvgHref(renderResult: RenderResult): string {
  const shapes = renderResult.shapes
    .map((shape) => {
      if (shape.kind === "rect") {
        return `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${shape.fill}" />`;
      }

      return `<path d="${shape.d}" fill="none" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" stroke-linecap="${shape.strokeLinecap}" />`;
    })
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${renderResult.width}" height="${renderResult.width}" viewBox="0 0 ${renderResult.width} ${renderResult.width}" shape-rendering="crispEdges">${shapes}</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function App() {
  const [text, setText] = useStoredState("text", "https://nity.ch", parseString);
  const [debouncedText, setDebouncedText] = useState(text);
  const [errorLevel, setErrorLevel] = useStoredState<ErrorLevel>("errorLevel", "H", (value, fallback) =>
    parseOption(errorLevels, value, fallback),
  );
  const [userSize, setUserSize] = useStoredState("userSize", 0, parseQrSize);
  const [fillColor, setFillColor] = useStoredState("fillColor", "#7fb8d8", parseFillColor);
  const [dotShrinkage, setDotShrinkage] = useStoredState<DotShrinkage>("dotShrinkage", 3, (value, fallback) =>
    parseOption(dotShrinkages, value, fallback),
  );
  const [joinAlgorithm, setJoinAlgorithm] = useStoredState<JoinAlgorithm>(
    "joinAlgorithm",
    "fieldSnake",
    (value, fallback) => parseOption(joinAlgorithms, value, fallback),
  );
  const [allowDiagonalJoins, setAllowDiagonalJoins] = useStoredState(
    "allowDiagonalJoins",
    true,
    parseBoolean,
  );
  const [angleField, setAngleField] = useStoredState<AngleField>("angleField", "rings", (value, fallback) =>
    parseOption(angleFields, value, fallback),
  );
  const [connectorStyle, setConnectorStyle] = useStoredState<ConnectorStyle>(
    "connectorStyle",
    "paths",
    (value, fallback) => parseOption(connectorStyles, value, fallback),
  );
  const [strokeCap, setStrokeCap] = useStoredState<StrokeCap>("strokeCap", "square", (value, fallback) =>
    parseOption(strokeCaps, value, fallback),
  );
  const [pngHref, setPngHref] = useState("about:blank");
  const [svgHref, setSvgHref] = useState("about:blank");

  const outputRef = useRef<HTMLCanvasElement | null>(null);

  const halftoneQR = useCallback(
    (qrBytes: QRMatrix, controlBytes: QRMatrix) => {
      const canvas = outputRef.current;

      if (!canvas) {
        return;
      }

      const renderResult = createRenderResult(
        qrBytes,
        controlBytes,
        dotShrinkage,
        fillColor,
        joinAlgorithm,
        allowDiagonalJoins,
        angleField,
        connectorStyle,
        strokeCap,
      );
      drawRenderResult(canvas, renderResult);
      setPngHref(canvas.toDataURL("image/png"));
      setSvgHref(createSvgHref(renderResult));
    },
    [allowDiagonalJoins, angleField, connectorStyle, dotShrinkage, fillColor, joinAlgorithm, strokeCap],
  );

  const regen = useCallback(() => {
    if (userSize === 0) {
      for (let qrSize = 1; qrSize <= 10; qrSize += 1) {
        try {
          const { qrBytes, controlBytes } = createQrMatrices(qrSize, errorLevel, debouncedText);
          halftoneQR(qrBytes, controlBytes);
          return;
        } catch {
          // Try the next QR type. The encoder validates real bit capacity.
        }
      }

      alert("Too much text. Try decreasing the error level.");
      return;
    }

    try {
      const { qrBytes, controlBytes } = createQrMatrices(userSize, errorLevel, debouncedText);
      halftoneQR(qrBytes, controlBytes);
    } catch (error) {
      alert(error);
    }
  }, [debouncedText, errorLevel, halftoneQR, userSize]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedText(text);
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [text]);

  useEffect(() => {
    regen();
  }, [regen]);

  return (
    <div className="app-shell">
      <aside className="settings-pane">
        <header className="app-header">
          <p className="eyebrow">Halftone QR</p>
          <h1>Shape the code.</h1>
        </header>

        <form className="settings-scroll" onSubmit={(event) => event.preventDefault()}>
          <section className="settings-section">
            <div className="field">
              <label className="field-label" htmlFor="input">
                Data
              </label>
              <input
                className="ui-input"
                id="input"
                onChange={(event) => setText(event.target.value)}
                placeholder="https://example.com"
                type="text"
                value={text}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="fillColor">
                Background color
              </label>
              <div className="color-row">
                <input
                  className="color-input"
                  id="fillColor"
                  onChange={(event) => setFillColor(event.target.value)}
                  title="Choose the fill color"
                  type="color"
                  value={fillColor}
                />
                <span className="color-value">{fillColor}</span>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <div className="field">
              <span className="field-label">Dot shrinkage</span>
              <div aria-label="Dot shrinkage" className="segmented-control" role="radiogroup">
                <button
                  aria-checked={dotShrinkage === 2}
                  className="segment-button"
                  onClick={() => setDotShrinkage(2)}
                  role="radio"
                  type="button"
                >
                  2x
                </button>
                <button
                  aria-checked={dotShrinkage === 3}
                  className="segment-button"
                  onClick={() => setDotShrinkage(3)}
                  role="radio"
                  type="button"
                >
                  3x
                </button>
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="joinAlgorithm">
                Dot joining
              </label>
              <select
                className="ui-select"
                id="joinAlgorithm"
                onChange={(event) => setJoinAlgorithm(event.target.value as JoinAlgorithm)}
                value={joinAlgorithm}
              >
                <option value="none">None</option>
                <option value="all">All matching neighbors</option>
                <option value="rowSnake">Row snake</option>
                <option value="columnSnake">Column snake</option>
                <option value="spiralSnake">Spiral snake</option>
                <option value="mazeSnake">Maze snake</option>
                <option value="fieldSnake">Field snake</option>
              </select>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="angleField">
                Angle field
              </label>
              <select
                className="ui-select"
                id="angleField"
                onChange={(event) => setAngleField(event.target.value as AngleField)}
                value={angleField}
              >
                <option value="none">None</option>
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
                <option value="diagonalDown">Diagonal down</option>
                <option value="diagonalUp">Diagonal up</option>
                <option value="radial">Radial</option>
                <option value="rings">Rings</option>
                <option value="spiral">Spiral</option>
                <option value="wavy">Wavy</option>
                <option value="pinwheel">Pinwheel</option>
              </select>
              <span className="field-hint">Used by Field snake to bias non-forking paths by local direction.</span>
            </div>

            <div className="field">
              <span className="field-label">Connector rendering</span>
              <div aria-label="Connector rendering" className="segmented-control" role="radiogroup">
                <button
                  aria-checked={connectorStyle === "dots"}
                  className="segment-button"
                  onClick={() => setConnectorStyle("dots")}
                  role="radio"
                  type="button"
                >
                  Dots
                </button>
                <button
                  aria-checked={connectorStyle === "paths"}
                  className="segment-button"
                  onClick={() => setConnectorStyle("paths")}
                  role="radio"
                  type="button"
                >
                  SVG paths
                </button>
              </div>
            </div>

            <div className="field">
              <span className="field-label">Path stroke</span>
              <div aria-label="Path stroke" className="segmented-control" role="radiogroup">
                <button
                  aria-checked={strokeCap === "square"}
                  className="segment-button"
                  onClick={() => setStrokeCap("square")}
                  role="radio"
                  type="button"
                >
                  Square
                </button>
                <button
                  aria-checked={strokeCap === "round"}
                  className="segment-button"
                  onClick={() => setStrokeCap("round")}
                  role="radio"
                  type="button"
                >
                  Rounded
                </button>
              </div>
              <span className="field-hint">Applies when connector rendering is set to SVG paths.</span>
            </div>

            <label className="switch-row" htmlFor="allowDiagonalJoins">
              <span>
                <span className="field-label">Allow diagonal joins</span>
                <span className="field-hint">Applies to matching-dot connection candidates.</span>
              </span>
              <input
                checked={allowDiagonalJoins}
                className="switch-input"
                id="allowDiagonalJoins"
                onChange={(event) => setAllowDiagonalJoins(event.target.checked)}
                type="checkbox"
              />
            </label>
          </section>

          <section className="settings-section">
            <div className="field">
              <label className="field-label" htmlFor="error_level">
                Error correction
              </label>
              <select
                className="ui-select"
                id="error_level"
                onChange={(event) => setErrorLevel(event.target.value as ErrorLevel)}
                value={errorLevel}
              >
                <option value="L">Low (7%)</option>
                <option value="M">Medium (15%)</option>
                <option value="Q">Quartile (25%)</option>
                <option value="H">High (30%)</option>
              </select>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="size">
                QR size
              </label>
              <select
                className="ui-select"
                id="size"
                onChange={(event) => setUserSize(Number.parseInt(event.target.value, 10))}
                value={userSize}
              >
                <option value="0">Auto</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
              </select>
              <span className="field-hint">Auto uses the smallest QR version accepted by the encoder.</span>
            </div>
          </section>
        </form>
      </aside>

      <main className="preview-pane">
        <div className="preview-toolbar">
          <div>
            <p className="eyebrow">Preview</p>
            <h2>Export-ready QR</h2>
          </div>
          <div className="download-actions">
            <a className="ui-button secondary" download="qr_code.svg" href={svgHref}>
              SVG
            </a>
            <a className="ui-button" download="qr_code.png" href={pngHref}>
              PNG
            </a>
          </div>
        </div>

        <div className="preview-stage">
          <canvas aria-label="Generated QR code preview" className="qr-canvas" id="output" ref={outputRef} />
        </div>
      </main>
    </div>
  );
}
