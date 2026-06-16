import { getFieldVector } from "./field";
import type { AngleField, FieldContext, QRCell, QRMaskPattern, QRMatrix } from "./types";

export function syntheticPaddingHash(maskPattern: QRMaskPattern, moduleX: number, moduleY: number, salt: number): number {
  let value = (maskPattern + 1) * 0x9e3779b1;
  value ^= moduleX * 0x85ebca6b;
  value ^= moduleY * 0xc2b2ae35;
  value ^= salt * 0x27d4eb2d;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);

  return (value ^ (value >>> 16)) >>> 0;
}

export function syntheticPaddingBit(
  maskPattern: QRMaskPattern,
  moduleX: number,
  moduleY: number,
  totalModules: number,
  angleField: AngleField,
  fieldContext: FieldContext,
  fieldCompliance: number,
): boolean {
  const randomBit = (syntheticPaddingHash(maskPattern, moduleX, moduleY, 0) & 1) === 1;

  if (fieldCompliance <= 0) {
    return randomBit;
  }

  const fieldVector = getFieldVector(angleField, moduleX, moduleY, totalModules, fieldContext);
  const fieldLength = Math.hypot(fieldVector.x, fieldVector.y) || 1;
  const normalX = -fieldVector.y / fieldLength;
  const normalY = fieldVector.x / fieldLength;
  const seedPhase = (maskPattern + 1) * 1.618;
  const fieldBit = Math.sin((moduleX * normalX + moduleY * normalY) * Math.PI * 0.72 + seedPhase) >= 0;
  const complianceGate = syntheticPaddingHash(maskPattern, moduleX, moduleY, 1) / 0xffffffff;

  return complianceGate < fieldCompliance / 100 ? fieldBit : randomBit;
}

export function createSyntheticPaddedMatrices(
  qrBytes: QRMatrix,
  controlBytes: QRMatrix,
  paddingModules: number,
  maskPattern: QRMaskPattern,
  angleField: AngleField,
  fieldContext: FieldContext,
  fieldCompliance: number,
) {
  const totalModules = qrBytes.length + paddingModules * 2;
  const paddedQrBytes: QRMatrix = [];
  const paddedControlBytes: QRMatrix = [];

  for (let moduleX = 0; moduleX < totalModules; moduleX += 1) {
    const qrColumn: QRCell[] = [];
    const controlColumn: QRCell[] = [];

    for (let moduleY = 0; moduleY < totalModules; moduleY += 1) {
      const qrX = moduleX - paddingModules;
      const qrY = moduleY - paddingModules;
      const insideQr = qrX >= 0 && qrX < qrBytes.length && qrY >= 0 && qrY < qrBytes.length;

      if (insideQr) {
        qrColumn.push(qrBytes[qrX][qrY]);
        controlColumn.push(controlBytes[qrX][qrY]);
      } else {
        qrColumn.push(
          syntheticPaddingBit(
            maskPattern,
            moduleX,
            moduleY,
            totalModules,
            angleField,
            fieldContext,
            fieldCompliance,
          ),
        );
        controlColumn.push(null);
      }
    }

    paddedQrBytes.push(qrColumn);
    paddedControlBytes.push(controlColumn);
  }

  return {
    controlBytes: paddedControlBytes,
    qrBytes: paddedQrBytes,
  };
}
