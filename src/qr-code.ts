import qrcode from "./qr";
import type { ErrorLevel, QRCode, QRMaskPattern, QRMatrix } from "./types";

export function createQr(size: number, errorLevel: ErrorLevel, text: string): QRCode {
  const qr = qrcode(size, errorLevel) as QRCode;
  qr.addData(text);
  return qr;
}

export function createQrMatrices(size: number, errorLevel: ErrorLevel, text: string, maskPattern: QRMaskPattern) {
  const qr = createQr(size, errorLevel, text);
  qr.make(false, maskPattern);

  const controls = createQr(size, errorLevel, text);
  controls.make(true, maskPattern);

  return {
    controlBytes: controls.returnByteArray(),
    qrBytes: qr.returnByteArray(),
  };
}

export function getQrMatrixCacheKey(size: number, errorLevel: ErrorLevel, text: string, maskPattern: QRMaskPattern): string {
  return JSON.stringify([size, errorLevel, text, maskPattern]);
}

export function isDataCell(controlBytes: QRMatrix, byteRow: number, byteCell: number): boolean {
  return controlBytes[byteRow]?.[byteCell] === null;
}
