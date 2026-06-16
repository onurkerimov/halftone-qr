import { blockSize } from "./constants";
import { getFieldAlignment } from "./field";
import { isDataCell } from "./qr-code";
import type { AngleField, DotCell, DotEdge, FieldContext, JoinAlgorithm, Point, QRMatrix } from "./types";

export function dotKey(dot: DotCell): string {
  return `${dot.byteRow},${dot.byteCell}`;
}

export function canJoinDots(
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

export function edgeFromPath(
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

export function createPathEdges(
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

export function createRowSnakePath(size: number): DotCell[] {
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

export function createColumnSnakePath(size: number): DotCell[] {
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

export function createSpiralSnakePath(size: number): DotCell[] {
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

export function createAllMatchingNeighborEdges(
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

export function getParent(parents: Map<string, string>, key: string): string {
  const parent = parents.get(key) ?? key;

  if (parent === key) {
    parents.set(key, key);
    return key;
  }

  const root = getParent(parents, parent);
  parents.set(key, root);
  return root;
}

export function joinParents(parents: Map<string, string>, first: string, second: string) {
  parents.set(getParent(parents, second), getParent(parents, first));
}

export function edgeWeight(edge: DotEdge): number {
  const first = edge.from.byteRow * 73856093 + edge.from.byteCell * 19349663;
  const second = edge.to.byteRow * 83492791 + edge.to.byteCell * 2971215073;

  return (first ^ second) >>> 0;
}

export function createMazeSnakeEdges(
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

export function createNonForkingEdges(edges: DotEdge[]): DotEdge[] {
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

export function createFieldSnakeEdges(
  qrBytes: QRMatrix,
  controlBytes: QRMatrix,
  allowDiagonalJoins: boolean,
  angleField: AngleField,
  fieldContext: FieldContext,
): DotEdge[] {
  const edges = createAllMatchingNeighborEdges(qrBytes, controlBytes, allowDiagonalJoins).sort((first, second) => {
    const alignmentDifference =
      getFieldAlignment(second, angleField, qrBytes.length, fieldContext) -
      getFieldAlignment(first, angleField, qrBytes.length, fieldContext);

    if (Math.abs(alignmentDifference) > 0.0001) {
      return alignmentDifference;
    }

    return edgeWeight(first) - edgeWeight(second);
  });

  return createNonForkingEdges(edges);
}

export function createJoinEdges(
  algorithm: JoinAlgorithm,
  qrBytes: QRMatrix,
  controlBytes: QRMatrix,
  allowDiagonalJoins: boolean,
  angleField: AngleField,
  fieldContext: FieldContext,
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
      return createFieldSnakeEdges(qrBytes, controlBytes, allowDiagonalJoins, angleField, fieldContext);
    case "none":
      return [];
  }
}

export function getDotCenter(dot: DotCell, padding: number): Point {
  return {
    x: padding + dot.byteRow * blockSize + blockSize / 2,
    y: padding + dot.byteCell * blockSize + blockSize / 2,
  };
}

export function createPointerAvoidanceKeys(
  fieldContext: FieldContext,
  controlBytes: QRMatrix,
  renderWidth: number,
  padding: number,
): Set<string> {
  if (!fieldContext.mouse) {
    return new Set();
  }

  const keys = new Set<string>();
  const pointerX = fieldContext.mouse.x * renderWidth;
  const pointerY = fieldContext.mouse.y * renderWidth;
  const radius = blockSize * 1.25;

  for (let byteRow = 0; byteRow < controlBytes.length; byteRow += 1) {
    for (let byteCell = 0; byteCell < controlBytes[byteRow].length; byteCell += 1) {
      if (!isDataCell(controlBytes, byteRow, byteCell)) {
        continue;
      }

      const centerX = padding + byteRow * blockSize + blockSize / 2;
      const centerY = padding + byteCell * blockSize + blockSize / 2;

      if (Math.hypot(centerX - pointerX, centerY - pointerY) <= radius) {
        keys.add(dotKey({ byteCell, byteRow }));
      }
    }
  }

  return keys;
}

export function createEdgeChains(edges: DotEdge[]): DotCell[][] {
  const adjacency = new Map<string, Array<{ edgeIndex: number; other: DotCell }>>();
  const dotByKey = new Map<string, DotCell>();
  const usedEdges = new Set<number>();

  const addNeighbor = (dot: DotCell, other: DotCell, edgeIndex: number) => {
    const key = dotKey(dot);
    dotByKey.set(key, dot);
    dotByKey.set(dotKey(other), other);

    const neighbors = adjacency.get(key) ?? [];
    neighbors.push({ edgeIndex, other });
    adjacency.set(key, neighbors);
  };

  edges.forEach((edge, edgeIndex) => {
    addNeighbor(edge.from, edge.to, edgeIndex);
    addNeighbor(edge.to, edge.from, edgeIndex);
  });

  for (const neighbors of adjacency.values()) {
    neighbors.sort((first, second) => edgeWeight(edges[first.edgeIndex]) - edgeWeight(edges[second.edgeIndex]));
  }

  const startKeys = [...adjacency.entries()]
    .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
    .sort(([, firstNeighbors], [, secondNeighbors]) => firstNeighbors.length - secondNeighbors.length)
    .map(([key]) => key);
  const chains: DotCell[][] = [];

  for (const startKey of startKeys) {
    let neighbors = adjacency.get(startKey) ?? [];

    while (neighbors.some((neighbor) => !usedEdges.has(neighbor.edgeIndex))) {
      const startDot = dotByKey.get(startKey);

      if (!startDot) {
        break;
      }

      const chain = [startDot];
      let currentKey = startKey;

      while (true) {
        const nextNeighbor = (adjacency.get(currentKey) ?? []).find(
          (neighbor) => !usedEdges.has(neighbor.edgeIndex),
        );

        if (!nextNeighbor) {
          break;
        }

        usedEdges.add(nextNeighbor.edgeIndex);
        chain.push(nextNeighbor.other);
        currentKey = dotKey(nextNeighbor.other);
      }

      if (chain.length > 1) {
        chains.push(chain);
      }

      neighbors = adjacency.get(startKey) ?? [];
    }
  }

  return chains;
}

export function createSmoothedPathD(points: Point[], smoothing: number): string {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  if (smoothing <= 0 || points.length === 2) {
    return points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
  }

  const cornerRadius = blockSize * 0.5 * (smoothing / 100);
  const commands = [`M ${points[0].x} ${points[0].y}`];

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const previousDistance = Math.hypot(previous.x - current.x, previous.y - current.y);
    const nextDistance = Math.hypot(next.x - current.x, next.y - current.y);
    const beforeDistance = Math.min(cornerRadius, previousDistance / 2);
    const afterDistance = Math.min(cornerRadius, nextDistance / 2);
    const before = {
      x: current.x + ((previous.x - current.x) / previousDistance) * beforeDistance,
      y: current.y + ((previous.y - current.y) / previousDistance) * beforeDistance,
    };
    const after = {
      x: current.x + ((next.x - current.x) / nextDistance) * afterDistance,
      y: current.y + ((next.y - current.y) / nextDistance) * afterDistance,
    };

    commands.push(`L ${before.x} ${before.y}`);
    commands.push(`Q ${current.x} ${current.y} ${after.x} ${after.y}`);
  }

  const last = points[points.length - 1];
  commands.push(`L ${last.x} ${last.y}`);

  return commands.join(" ");
}
