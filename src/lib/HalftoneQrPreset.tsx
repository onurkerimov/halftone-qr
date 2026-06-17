import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { createGeneratedFieldBackgroundCanvas } from "../background";
import { mainPresetSettings, maxGeneratedFieldResolution } from "../constants";
import { createQrMatrices } from "../qr-code";
import { createRenderResult, drawRenderResult } from "../rendering";
import type { FieldContext, QRMaskPattern } from "../types";

export type HalftoneQrPresetProps = {
  ariaLabel?: string;
  className?: string;
  paused?: boolean;
  style?: CSSProperties;
  value: string;
};

function createPresetMatrices(value: string, maskPattern: QRMaskPattern) {
  let lastError: unknown = null;

  for (let qrSize = mainPresetSettings.userSize; qrSize <= 10; qrSize += 1) {
    try {
      return createQrMatrices(qrSize, mainPresetSettings.errorLevel, value, maskPattern);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

export function HalftoneQrPreset({
  ariaLabel = "Animated QR code",
  className,
  paused = false,
  style,
  value,
}: HalftoneQrPresetProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState(0);
  const [maskPattern, setMaskPattern] = useState<QRMaskPattern>(mainPresetSettings.maskPattern);
  const matrices = useMemo(() => createPresetMatrices(value, maskPattern), [maskPattern, value]);

  useEffect(() => {
    if (paused || !mainPresetSettings.evolveAngleField) {
      return;
    }

    const interval = window.setInterval(() => {
      setPhase((currentPhase) => (currentPhase + 0.2 * (mainPresetSettings.angleFieldSpeed / 100)) % (Math.PI * 2));
    }, 80);

    return () => window.clearInterval(interval);
  }, [paused]);

  useEffect(() => {
    if (paused || !mainPresetSettings.isPlayingMasks || mainPresetSettings.maskPlaySpeed <= 0) {
      return;
    }

    const intervalMs = Math.max(20, Math.round(100 / (mainPresetSettings.maskPlaySpeed / 100)));
    const interval = window.setInterval(() => {
      setMaskPattern((currentPattern) => (((currentPattern + 1) % 8) as QRMaskPattern));
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const fieldContext: FieldContext = {
      mouse: null,
      phase,
    };
    const backgroundCanvas = createGeneratedFieldBackgroundCanvas(
      mainPresetSettings.angleField,
      fieldContext,
      mainPresetSettings.fieldFirstColor,
      mainPresetSettings.fieldSecondColor,
      maxGeneratedFieldResolution,
    );
    const renderResult = createRenderResult(
      matrices.qrBytes,
      matrices.controlBytes,
      mainPresetSettings.dotShrinkage,
      mainPresetSettings.fillColor,
      mainPresetSettings.qrDarkColor,
      mainPresetSettings.qrLightColor,
      "generated-field",
      backgroundCanvas,
      mainPresetSettings.backgroundSource,
      mainPresetSettings.backgroundPixelation,
      mainPresetSettings.joinAlgorithm,
      mainPresetSettings.allowDiagonalJoins,
      mainPresetSettings.angleField,
      fieldContext,
      mainPresetSettings.connectorStyle,
      mainPresetSettings.pathStrokeSize,
      mainPresetSettings.pathSmoothing,
      mainPresetSettings.standaloneDotScale,
      mainPresetSettings.strokeCap,
      mainPresetSettings.paddingModules,
      mainPresetSettings.syntheticPaddingData,
      mainPresetSettings.syntheticPaddingFieldCompliance,
      maskPattern,
    );

    drawRenderResult(canvas, renderResult, backgroundCanvas);
  }, [matrices, maskPattern, phase]);

  return <canvas aria-label={ariaLabel} className={className} ref={canvasRef} style={style} />;
}
