import { useCallback, useEffect, useRef, useState } from "react";
import qrcode from "./qr";

type ErrorLevel = "L" | "M" | "Q" | "H";
type DotShrinkage = 2 | 3;
type JoinAlgorithm = "none" | "all" | "rowSnake" | "columnSnake" | "spiralSnake" | "mazeSnake";
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

type QRCode = {
  addData(data: string): void;
  make(onlyControl?: boolean): void;
  returnByteArray(): QRMatrix;
};

const pixelSize = 6;
const blockSize = 3 * pixelSize;

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

function createJoinEdges(
  algorithm: JoinAlgorithm,
  qrBytes: QRMatrix,
  controlBytes: QRMatrix,
  allowDiagonalJoins: boolean,
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
    case "none":
      return [];
  }
}

export default function App() {
  const [text, setText] = useState("https://nity.ch");
  const [debouncedText, setDebouncedText] = useState("https://nity.ch");
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>("H");
  const [userSize, setUserSize] = useState(0);
  const [fillColor, setFillColor] = useState("#7fb8d8");
  const [dotShrinkage, setDotShrinkage] = useState<DotShrinkage>(2);
  const [joinAlgorithm, setJoinAlgorithm] = useState<JoinAlgorithm>("none");
  const [allowDiagonalJoins, setAllowDiagonalJoins] = useState(false);
  const [downloadHref, setDownloadHref] = useState("about:blank");

  const outputRef = useRef<HTMLCanvasElement | null>(null);

  const halftoneQR = useCallback(
    (qrBytes: QRMatrix, controlBytes: QRMatrix) => {
      const canvas = outputRef.current;

      if (!canvas) {
        return;
      }

      const width = qrBytes.length * blockSize;
      const dotSize = blockSize / dotShrinkage;
      const dotOffset = (blockSize - dotSize) / 2;
      canvas.width = width;
      canvas.height = width;

      const ctx = get2d(canvas);
      ctx.fillStyle = fillColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let byteRow = 0; byteRow < qrBytes.length; byteRow += 1) {
        for (let byteCell = 0; byteCell < qrBytes[byteRow].length; byteCell += 1) {
          ctx.fillStyle = qrBytes[byteRow][byteCell] ? "black" : "white";
          ctx.fillRect(
            byteRow * blockSize + dotOffset,
            byteCell * blockSize + dotOffset,
            dotSize,
            dotSize,
          );
        }
      }

      for (const edge of createJoinEdges(joinAlgorithm, qrBytes, controlBytes, allowDiagonalJoins)) {
        ctx.fillStyle = qrBytes[edge.from.byteRow][edge.from.byteCell] ? "black" : "white";

        for (let connector = 1; connector < dotShrinkage; connector += 1) {
          const rowDirection = Math.sign(edge.to.byteRow - edge.from.byteRow);
          const cellDirection = Math.sign(edge.to.byteCell - edge.from.byteCell);

          ctx.fillRect(
            edge.from.byteRow * blockSize + dotOffset + dotSize * connector * rowDirection,
            edge.from.byteCell * blockSize + dotOffset + dotSize * connector * cellDirection,
            dotSize,
            dotSize,
          );
        }
      }

      for (let byteRow = 0; byteRow < controlBytes.length; byteRow += 1) {
        for (let byteCell = 0; byteCell < controlBytes[byteRow].length; byteCell += 1) {
          const controlByte = controlBytes[byteRow][byteCell];

          if (controlByte !== null) {
            ctx.fillStyle = controlByte ? "black" : "white";
            ctx.fillRect(byteRow * blockSize, byteCell * blockSize, blockSize, blockSize);
          }
        }
      }

      setDownloadHref(canvas.toDataURL());
    },
    [allowDiagonalJoins, dotShrinkage, fillColor, joinAlgorithm],
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
    <div className="container content px-3">
      <header>
        <h1>Halftone QR Code Generator</h1>
      </header>

      <form>
        <div className="row">
          <div className="col-md">
            <div className="mb-3">
              <label htmlFor="input" className="form-label">
                <strong>Data</strong>
              </label>
              <textarea
                className="form-control"
                id="input"
                onChange={(event) => setText(event.target.value)}
                placeholder="Your data here."
                value={text}
              />
            </div>
          </div>

          <div className="col-md">
            <div className="mb-3">
              <label htmlFor="fillColor" className="form-label">
                <strong>Fill color</strong>
              </label>
              <input
                className="form-control form-control-color"
                id="fillColor"
                onChange={(event) => setFillColor(event.target.value)}
                title="Choose the fill color"
                type="color"
                value={fillColor}
              />
            </div>

            <div className="mb-3">
              <label className="form-label d-block" htmlFor="dotShrinkage2">
                <strong>Dot shrinkage</strong>
              </label>
              <div aria-label="Dot shrinkage" className="btn-group" role="group">
                <input
                  checked={dotShrinkage === 2}
                  className="btn-check"
                  id="dotShrinkage2"
                  name="dotShrinkage"
                  onChange={() => setDotShrinkage(2)}
                  type="radio"
                />
                <label className="btn btn-outline-primary" htmlFor="dotShrinkage2">
                  2x
                </label>

                <input
                  checked={dotShrinkage === 3}
                  className="btn-check"
                  id="dotShrinkage3"
                  name="dotShrinkage"
                  onChange={() => setDotShrinkage(3)}
                  type="radio"
                />
                <label className="btn btn-outline-primary" htmlFor="dotShrinkage3">
                  3x
                </label>
              </div>
            </div>

            <div className="mb-3">
              <div className="form-floating">
                <select
                  className="form-select"
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
                </select>
                <label htmlFor="joinAlgorithm">Dot joining</label>
              </div>
            </div>

            <div className="mb-3 form-check form-switch">
              <input
                checked={allowDiagonalJoins}
                className="form-check-input"
                id="allowDiagonalJoins"
                onChange={(event) => setAllowDiagonalJoins(event.target.checked)}
                type="checkbox"
              />
              <label className="form-check-label" htmlFor="allowDiagonalJoins">
                Allow diagonal joins
              </label>
            </div>

            <div className="mb-3">
              <div className="form-floating">
                <select
                  className="form-select"
                  id="error_level"
                  onChange={(event) => setErrorLevel(event.target.value as ErrorLevel)}
                  value={errorLevel}
                >
                  <option value="L">Low (7%)</option>
                  <option value="M">Medium (15%)</option>
                  <option value="Q">Quartile (25%)</option>
                  <option value="H">High (30%)</option>
                </select>
                <label htmlFor="error_level">Redundancy (error correction level)</label>
              </div>
            </div>

            <div className="mb-3">
              <div className="form-floating">
                <select
                  className="form-select"
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
                <label htmlFor="size">QR size</label>
                <div className="form-text">6 gives the largest solid fill area</div>
              </div>
            </div>
          </div>
        </div>
      </form>

      <hr className="mb-4" />

      <div className="col-md-6">
        <div className="col">
          <a
            download="qr_code.png"
            href={downloadHref}
            id="download"
            target="_blank"
            title="Click to download"
          >
            <canvas className="img-thumbnail" id="output" ref={outputRef} />
          </a>
        </div>
      </div>

      <hr className="mb-5" />

      <footer className="mb-5">
        Based on
        <ul>
          <li>
            <a href="https://github.com/gentlecat/halftone-qr">Source code</a>
          </li>
          <li>
            <a href="http://vecg.cs.ucl.ac.uk/Projects/SmartGeometry/halftone_QR/halftoneQR_sigga13.html">
              Halftone QR Codes
            </a>
          </li>
          <li>
            <a href="https://jsfiddle.net/lachlan/r8qWV/">https://jsfiddle.net/lachlan/r8qWV/</a>
          </li>
        </ul>
      </footer>
    </div>
  );
}
