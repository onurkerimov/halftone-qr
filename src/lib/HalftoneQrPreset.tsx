import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { createGeneratedFieldBackgroundCanvas, loadImage } from "../background";
import { mainPresetSettings, maxGeneratedFieldResolution } from "../constants";
import { createQrMatrices } from "../qr-code";
import { createRenderResult, drawRenderResult } from "../rendering";
import type { FieldContext, PresetSettings, QRMaskPattern } from "../types";

export type HalftoneQrPresetProps = {
  ariaLabel?: string;
  className?: string;
  paused?: boolean;
  settings?: PresetSettings;
  style?: CSSProperties;
  value: string;
};

function createPresetMatrices(value: string, maskPattern: QRMaskPattern, settings: PresetSettings) {
  let lastError: unknown = null;
  const firstSize = settings.userSize === 0 ? 1 : settings.userSize;

  for (let qrSize = firstSize; qrSize <= 10; qrSize += 1) {
    try {
      return createQrMatrices(qrSize, settings.errorLevel, value, maskPattern);
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
  settings = mainPresetSettings,
  style,
  value,
}: HalftoneQrPresetProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const [phase, setPhase] = useState(0);
  const [backgroundImageVersion, setBackgroundImageVersion] = useState(0);
  const [maskPattern, setMaskPattern] = useState<QRMaskPattern>(settings.maskPattern);
  const matrices = useMemo(() => createPresetMatrices(value, maskPattern, settings), [maskPattern, settings, value]);

  useEffect(() => {
    setMaskPattern(settings.maskPattern);
  }, [settings.maskPattern]);

  useEffect(() => {
    if (paused || !settings.evolveAngleField) {
      return;
    }

    const interval = window.setInterval(() => {
      setPhase((currentPhase) => (currentPhase + 0.2 * (settings.angleFieldSpeed / 100)) % (Math.PI * 2));
    }, 80);

    return () => window.clearInterval(interval);
  }, [paused, settings.angleFieldSpeed, settings.evolveAngleField]);

  useEffect(() => {
    if (paused || !settings.isPlayingMasks || settings.maskPlaySpeed <= 0) {
      return;
    }

    const intervalMs = Math.max(20, Math.round(100 / (settings.maskPlaySpeed / 100)));
    const interval = window.setInterval(() => {
      setMaskPattern((currentPattern) => (((currentPattern + 1) % 8) as QRMaskPattern));
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [paused, settings.isPlayingMasks, settings.maskPlaySpeed]);

  useEffect(() => {
    if (settings.backgroundSource !== "uploaded" || !settings.backgroundImageHref) {
      if (backgroundImageRef.current) {
        backgroundImageRef.current = null;
        setBackgroundImageVersion((version) => version + 1);
      }
      return;
    }

    let cancelled = false;

    loadImage(settings.backgroundImageHref)
      .then((image) => {
        if (!cancelled) {
          backgroundImageRef.current = image;
          setBackgroundImageVersion((version) => version + 1);
        }
      })
      .catch(() => {
        if (!cancelled && backgroundImageRef.current) {
          backgroundImageRef.current = null;
          setBackgroundImageVersion((version) => version + 1);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [settings.backgroundImageHref, settings.backgroundSource]);

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
      settings.angleField,
      fieldContext,
      settings.fieldFirstColor,
      settings.fieldSecondColor,
      maxGeneratedFieldResolution,
      settings.fieldBackgroundMode,
      settings.fieldBackgroundDensity,
      settings.fieldBackgroundChaos,
      settings.fieldBackgroundDominance,
    );
    const backgroundImage =
      settings.backgroundSource === "field"
        ? backgroundCanvas
        : settings.backgroundSource === "uploaded"
          ? backgroundImageRef.current
          : null;
    const backgroundImageHref =
      settings.backgroundSource === "field"
        ? "generated-field"
        : settings.backgroundSource === "uploaded"
          ? settings.backgroundImageHref
          : "";
    const renderResult = createRenderResult(
      matrices.qrBytes,
      matrices.controlBytes,
      settings.dotShrinkage,
      settings.fillColor,
      settings.qrDarkColor,
      settings.qrLightColor,
      backgroundImageHref,
      backgroundImage,
      settings.backgroundSource,
      settings.backgroundPixelation,
      settings.joinAlgorithm,
      settings.allowDiagonalJoins,
      settings.angleField,
      fieldContext,
      settings.connectorStyle,
      settings.pathStrokeSize,
      settings.pathSmoothing,
      settings.standaloneDotScale,
      settings.strokeCap,
      settings.paddingModules,
      settings.syntheticPaddingData,
      settings.syntheticPaddingFieldCompliance,
      maskPattern,
    );

    drawRenderResult(canvas, renderResult, backgroundImage);
  }, [backgroundImageVersion, matrices, maskPattern, phase, settings]);

  return <canvas aria-label={ariaLabel} className={className} ref={canvasRef} style={style} />;
}
