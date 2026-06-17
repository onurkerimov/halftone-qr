import { type ChangeEvent, type PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { PreviewPane } from "./components/PreviewPane";
import { SettingsPane } from "./components/SettingsPane";
import {
  type AngleField,
  type BackgroundSource,
  type ConnectorStyle,
  type DotShrinkage,
  type ErrorLevel,
  type FieldBackgroundMode,
  type FieldContext,
  type JoinAlgorithm,
  type Point,
  type PresetSettings,
  type QRMaskPattern,
  type StrokeCap,
  angleFields,
  backgroundSources,
  clamp,
  connectorStyles,
  createGeneratedFieldBackground,
  createQrMatrices,
  createRenderResult,
  createSvgHref,
  dotShrinkages,
  drawRenderResult,
  errorLevels,
  fieldBackgroundModes,
  getQrMatrixCacheKey,
  joinAlgorithms,
  loadImage,
  mainPresetSettings,
  maxGeneratedFieldResolution,
  parseBackgroundPixelation,
  parseBoolean,
  parseFieldBackgroundDensity,
  parseFillColor,
  parseImageDataUrl,
  parseOption,
  parsePadding,
  parsePathStrokeSize,
  parsePercentage,
  parsePresetSettings,
  parseQrSize,
  parseSpeedPercentage,
  parseStandaloneDotScale,
  parseString,
  qrMaskPatterns,
  strokeCaps,
  useStoredState,
} from "./core";

const verticalFieldPresetSettings: PresetSettings = {
  allowDiagonalJoins: true,
  angleField: "vertical",
  angleFieldSpeed: 30,
  backgroundImageHref: "",
  backgroundPixelation: 90,
  backgroundSource: "field",
  connectorStyle: "paths",
  dotShrinkage: 2,
  errorLevel: "H",
  evolveAngleField: true,
  fieldBackgroundChaos: 35,
  fieldBackgroundDensity: 200,
  fieldBackgroundMode: "contours",
  fieldFirstColor: "#d562a9",
  fieldSecondColor: "#5ba3d7",
  fillColor: "#000000",
  isPlayingMasks: true,
  joinAlgorithm: "fieldSnake",
  maskPattern: 2,
  maskPlaySpeed: 65,
  mouseModulation: true,
  mouseSmoothing: 0,
  paddingModules: 4,
  pathSmoothing: 60,
  pathStrokeSize: 2.65,
  qrDarkColor: "#ffffff",
  qrLightColor: "#000000",
  standaloneDotScale: 1.5,
  strokeCap: "round",
  syntheticPaddingData: true,
  syntheticPaddingFieldCompliance: 100,
  userSize: 5,
};

const ringsPresetSettings: PresetSettings = {
  allowDiagonalJoins: true,
  angleField: "rings",
  angleFieldSpeed: 25,
  backgroundImageHref: "",
  backgroundPixelation: 163,
  backgroundSource: "color",
  connectorStyle: "paths",
  dotShrinkage: 2,
  errorLevel: "H",
  evolveAngleField: true,
  fieldBackgroundChaos: 45,
  fieldBackgroundDensity: 280,
  fieldBackgroundMode: "contours",
  fieldFirstColor: "#000000",
  fieldSecondColor: "#ffffff",
  fillColor: "#000000",
  isPlayingMasks: true,
  joinAlgorithm: "fieldSnake",
  maskPattern: 2,
  maskPlaySpeed: 80,
  mouseModulation: true,
  mouseSmoothing: 0,
  paddingModules: 5,
  pathSmoothing: 100,
  pathStrokeSize: 2,
  qrDarkColor: "#ffffff",
  qrLightColor: "#000000",
  standaloneDotScale: 2,
  strokeCap: "round",
  syntheticPaddingData: true,
  syntheticPaddingFieldCompliance: 100,
  userSize: 5,
};

export default function App() {
  const [text, setText] = useStoredState("text", "https://nity.ch", parseString);
  const [debouncedText, setDebouncedText] = useState(text);
  const [errorLevel, setErrorLevel] = useStoredState<ErrorLevel>(
    "errorLevel",
    mainPresetSettings.errorLevel,
    (value, fallback) => parseOption(errorLevels, value, fallback),
  );
  const [userSize, setUserSize] = useStoredState("userSize", mainPresetSettings.userSize, parseQrSize);
  const [fillColor, setFillColor] = useStoredState("fillColor", mainPresetSettings.fillColor, parseFillColor);
  const [qrDarkColor, setQrDarkColor] = useStoredState("qrDarkColor", mainPresetSettings.qrDarkColor, parseFillColor);
  const [qrLightColor, setQrLightColor] = useStoredState("qrLightColor", mainPresetSettings.qrLightColor, parseFillColor);
  const [fieldFirstColor, setFieldFirstColor] = useStoredState(
    "fieldFirstColor",
    mainPresetSettings.fieldFirstColor,
    parseFillColor,
  );
  const [fieldSecondColor, setFieldSecondColor] = useStoredState(
    "fieldSecondColor",
    mainPresetSettings.fieldSecondColor,
    parseFillColor,
  );
  const [fieldBackgroundDensity, setFieldBackgroundDensity] = useStoredState(
    "fieldBackgroundDensity",
    mainPresetSettings.fieldBackgroundDensity,
    parseFieldBackgroundDensity,
  );
  const [fieldBackgroundChaos, setFieldBackgroundChaos] = useStoredState(
    "fieldBackgroundChaos",
    mainPresetSettings.fieldBackgroundChaos,
    parsePercentage,
  );
  const [fieldBackgroundMode, setFieldBackgroundMode] = useStoredState<FieldBackgroundMode>(
    "fieldBackgroundMode",
    mainPresetSettings.fieldBackgroundMode,
    (value, fallback) => parseOption(fieldBackgroundModes, value, fallback),
  );
  const [backgroundSource, setBackgroundSource] = useStoredState<BackgroundSource>(
    "backgroundSource",
    mainPresetSettings.backgroundSource,
    (value, fallback) => parseOption(backgroundSources, value, fallback),
  );
  const [backgroundImageHref, setBackgroundImageHref] = useStoredState(
    "backgroundImageHref",
    mainPresetSettings.backgroundImageHref,
    parseImageDataUrl,
  );
  const [dotShrinkage, setDotShrinkage] = useStoredState<DotShrinkage>(
    "dotShrinkage",
    mainPresetSettings.dotShrinkage,
    (value, fallback) => parseOption(dotShrinkages, value, fallback),
  );
  const [joinAlgorithm, setJoinAlgorithm] = useStoredState<JoinAlgorithm>(
    "joinAlgorithm",
    mainPresetSettings.joinAlgorithm,
    (value, fallback) => parseOption(joinAlgorithms, value, fallback),
  );
  const [allowDiagonalJoins, setAllowDiagonalJoins] = useStoredState(
    "allowDiagonalJoins",
    mainPresetSettings.allowDiagonalJoins,
    parseBoolean,
  );
  const [angleField, setAngleField] = useStoredState<AngleField>(
    "angleField",
    mainPresetSettings.angleField,
    (value, fallback) => parseOption(angleFields, value, fallback),
  );
  const [connectorStyle, setConnectorStyle] = useStoredState<ConnectorStyle>(
    "connectorStyle",
    mainPresetSettings.connectorStyle,
    (value, fallback) => parseOption(connectorStyles, value, fallback),
  );
  const [pathStrokeSize, setPathStrokeSize] = useStoredState(
    "pathStrokeSize",
    mainPresetSettings.pathStrokeSize,
    parsePathStrokeSize,
  );
  const [pathSmoothing, setPathSmoothing] = useStoredState(
    "pathSmoothing",
    mainPresetSettings.pathSmoothing,
    parsePercentage,
  );
  const [standaloneDotScale, setStandaloneDotScale] = useStoredState(
    "standaloneDotScale",
    mainPresetSettings.standaloneDotScale,
    parseStandaloneDotScale,
  );
  const [paddingModules, setPaddingModules] = useStoredState(
    "paddingModules",
    mainPresetSettings.paddingModules,
    parsePadding,
  );
  const [syntheticPaddingData, setSyntheticPaddingData] = useStoredState(
    "syntheticPaddingData",
    mainPresetSettings.syntheticPaddingData,
    parseBoolean,
  );
  const [syntheticPaddingFieldCompliance, setSyntheticPaddingFieldCompliance] = useStoredState(
    "syntheticPaddingFieldCompliance",
    mainPresetSettings.syntheticPaddingFieldCompliance,
    parsePercentage,
  );
  const [backgroundPixelation, setBackgroundPixelation] = useStoredState(
    "backgroundPixelation",
    mainPresetSettings.backgroundPixelation,
    parseBackgroundPixelation,
  );
  const [maskPattern, setMaskPattern] = useStoredState<QRMaskPattern>(
    "maskPattern",
    mainPresetSettings.maskPattern,
    (value, fallback) => parseOption(qrMaskPatterns, value, fallback),
  );
  const [maskPlaySpeed, setMaskPlaySpeed] = useStoredState(
    "maskPlaySpeed",
    mainPresetSettings.maskPlaySpeed,
    parseSpeedPercentage,
  );
  const [strokeCap, setStrokeCap] = useStoredState<StrokeCap>(
    "strokeCap",
    mainPresetSettings.strokeCap,
    (value, fallback) => parseOption(strokeCaps, value, fallback),
  );
  const [evolveAngleField, setEvolveAngleField] = useStoredState(
    "evolveAngleField",
    mainPresetSettings.evolveAngleField,
    parseBoolean,
  );
  const [angleFieldSpeed, setAngleFieldSpeed] = useStoredState(
    "angleFieldSpeed",
    mainPresetSettings.angleFieldSpeed,
    parseSpeedPercentage,
  );
  const [mouseModulation, setMouseModulation] = useStoredState(
    "mouseModulation",
    mainPresetSettings.mouseModulation,
    parseBoolean,
  );
  const [mouseSmoothing, setMouseSmoothing] = useStoredState(
    "mouseSmoothing",
    mainPresetSettings.mouseSmoothing,
    parsePercentage,
  );
  const [advancedOpen, setAdvancedOpen] = useStoredState("advancedOpen", false, parseBoolean);
  const [savedPreset, setSavedPreset] = useStoredState<PresetSettings | null>(
    "savedPreset",
    null,
    parsePresetSettings,
  );
  const [isPlayingMasks, setIsPlayingMasks] = useStoredState(
    "isPlayingMasks",
    mainPresetSettings.isPlayingMasks,
    parseBoolean,
  );
  const [generatedBackgroundHref, setGeneratedBackgroundHref] = useState("");
  const [fieldPhase, setFieldPhase] = useState(0);
  const [fieldMouse, setFieldMouse] = useState<Point | null>(null);
  const [pngHref, setPngHref] = useState("about:blank");
  const [svgHref, setSvgHref] = useState("about:blank");
  const [qrResolution, setQrResolution] = useState(41);
  const backgroundResolutionMax =
    backgroundSource === "field" ? maxGeneratedFieldResolution : qrResolution;
  const effectiveBackgroundPixelation =
    backgroundSource === "field"
      ? clamp(
          backgroundPixelation > 0 ? backgroundPixelation : maxGeneratedFieldResolution,
          1,
          maxGeneratedFieldResolution,
        )
      : Math.min(backgroundPixelation, backgroundResolutionMax);
  const generatedFieldResolution = effectiveBackgroundPixelation;
  const fieldContext: FieldContext = {
    mouse: mouseModulation ? fieldMouse : null,
    phase: fieldPhase,
  };
  const effectiveBackgroundImageHref =
    backgroundSource === "uploaded"
      ? backgroundImageHref
      : backgroundSource === "field"
        ? generatedBackgroundHref
        : "";

  const outputRef = useRef<HTMLCanvasElement | null>(null);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const generatedBackgroundHrefRef = useRef("");
  const loadedBackgroundHrefRef = useRef("");
  const pngHrefRef = useRef("about:blank");
  const qrResolutionRef = useRef(41);
  const requestedBackgroundHrefRef = useRef("");
  const svgHrefRef = useRef("about:blank");
  const fieldMouseRef = useRef<Point | null>(null);
  const qrMatrixCacheRef = useRef(new Map<string, ReturnType<typeof createQrMatrices>>());
  const targetFieldMouseRef = useRef<Point | null>(null);
  const [backgroundImageVersion, setBackgroundImageVersion] = useState(0);

  useEffect(() => {
    const canvas = outputRef.current;

    if (!canvas) {
      return;
    }

    const firstSize = userSize === 0 ? 1 : userSize;
    let lastError: unknown = null;

    for (let qrSize = firstSize; qrSize <= 10; qrSize += 1) {
      try {
        const cacheKey = getQrMatrixCacheKey(qrSize, errorLevel, debouncedText, maskPattern);
        let matrices = qrMatrixCacheRef.current.get(cacheKey);

        if (!matrices) {
          matrices = createQrMatrices(qrSize, errorLevel, debouncedText, maskPattern);
          qrMatrixCacheRef.current.set(cacheKey, matrices);

          if (qrMatrixCacheRef.current.size > 120) {
            const oldestKey = qrMatrixCacheRef.current.keys().next().value;

            if (oldestKey) {
              qrMatrixCacheRef.current.delete(oldestKey);
            }
          }
        }

        const { qrBytes, controlBytes } = matrices;
        const renderResult = createRenderResult(
          qrBytes,
          controlBytes,
          dotShrinkage,
          fillColor,
          qrDarkColor,
          qrLightColor,
          effectiveBackgroundImageHref,
          backgroundImageRef.current,
          backgroundSource,
          effectiveBackgroundPixelation,
          joinAlgorithm,
          allowDiagonalJoins,
          angleField,
          fieldContext,
          connectorStyle,
          pathStrokeSize,
          pathSmoothing,
          standaloneDotScale,
          strokeCap,
          paddingModules,
          syntheticPaddingData,
          syntheticPaddingFieldCompliance,
          maskPattern,
        );

        if (qrResolutionRef.current !== qrBytes.length) {
          qrResolutionRef.current = qrBytes.length;
          setQrResolution(qrBytes.length);
        }

        drawRenderResult(canvas, renderResult, backgroundImageRef.current);

        const nextPngHref = canvas.toDataURL("image/png");
        const nextSvgHref = createSvgHref(renderResult);

        if (pngHrefRef.current !== nextPngHref) {
          pngHrefRef.current = nextPngHref;
          setPngHref(nextPngHref);
        }

        if (svgHrefRef.current !== nextSvgHref) {
          svgHrefRef.current = nextSvgHref;
          setSvgHref(nextSvgHref);
        }

        if (userSize !== 0 && userSize !== qrSize) {
          setUserSize(qrSize);
        }

        return;
      } catch (error) {
        lastError = error;
        // Try the next QR type. The encoder validates real bit capacity.
      }
    }

    console.warn("Could not fit data in QR versions 1-10.", lastError);
  }, [
    allowDiagonalJoins,
    angleField,
    backgroundImageVersion,
    backgroundSource,
    connectorStyle,
    debouncedText,
    dotShrinkage,
    effectiveBackgroundImageHref,
    errorLevel,
    fieldMouse,
    fieldPhase,
    fillColor,
    joinAlgorithm,
    maskPattern,
    mouseModulation,
    paddingModules,
    pathStrokeSize,
    pathSmoothing,
    standaloneDotScale,
    qrDarkColor,
    qrLightColor,
    strokeCap,
    syntheticPaddingData,
    syntheticPaddingFieldCompliance,
    userSize,
  ]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedText(text);
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [text]);

  useEffect(() => {
    fieldMouseRef.current = fieldMouse;
  }, [fieldMouse]);

  useEffect(() => {
    let cancelled = false;
    requestedBackgroundHrefRef.current = effectiveBackgroundImageHref;

    if (!effectiveBackgroundImageHref) {
      if (backgroundImageRef.current || loadedBackgroundHrefRef.current) {
        backgroundImageRef.current = null;
        loadedBackgroundHrefRef.current = "";
        requestedBackgroundHrefRef.current = "";
        setBackgroundImageVersion((version) => version + 1);
      }
      return;
    }

    const requestedHref = effectiveBackgroundImageHref;

    loadImage(effectiveBackgroundImageHref)
      .then((image) => {
        if (
          !cancelled &&
          requestedBackgroundHrefRef.current === requestedHref &&
          loadedBackgroundHrefRef.current !== requestedHref
        ) {
          backgroundImageRef.current = image;
          loadedBackgroundHrefRef.current = requestedHref;
          setBackgroundImageVersion((version) => version + 1);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled && requestedBackgroundHrefRef.current === requestedHref) {
          if (backgroundImageRef.current || loadedBackgroundHrefRef.current) {
            backgroundImageRef.current = null;
            loadedBackgroundHrefRef.current = "";
            setBackgroundImageVersion((version) => version + 1);
          }
          console.error(error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [effectiveBackgroundImageHref]);

  useEffect(() => {
    if (backgroundSource !== "field") {
      return;
    }

    const nextGeneratedBackgroundHref = createGeneratedFieldBackground(
      angleField,
      fieldContext,
      fieldFirstColor,
      fieldSecondColor,
      generatedFieldResolution,
      fieldBackgroundMode,
      fieldBackgroundDensity,
      fieldBackgroundChaos,
    );

    if (generatedBackgroundHrefRef.current !== nextGeneratedBackgroundHref) {
      generatedBackgroundHrefRef.current = nextGeneratedBackgroundHref;
      setGeneratedBackgroundHref(nextGeneratedBackgroundHref);
    }
  }, [
    angleField,
    backgroundSource,
    fieldBackgroundChaos,
    fieldBackgroundDensity,
    fieldFirstColor,
    fieldBackgroundMode,
    fieldMouse,
    fieldPhase,
    fieldSecondColor,
    mouseModulation,
    generatedFieldResolution,
  ]);

  useEffect(() => {
    if (!evolveAngleField) {
      return;
    }

    const interval = window.setInterval(() => {
      setFieldPhase((phase) => (phase + 0.2 * (angleFieldSpeed / 100)) % (Math.PI * 2));
    }, 80);

    return () => window.clearInterval(interval);
  }, [angleFieldSpeed, evolveAngleField]);

  useEffect(() => {
    if (!mouseModulation) {
      targetFieldMouseRef.current = null;
      fieldMouseRef.current = null;
      setFieldMouse(null);
      return;
    }

    let animationFrame = 0;

    const tick = () => {
      const target = targetFieldMouseRef.current;
      const current = fieldMouseRef.current;

      if (!target) {
        if (current) {
          fieldMouseRef.current = null;
          setFieldMouse(null);
        }

        animationFrame = window.requestAnimationFrame(tick);
        return;
      }

      if (!current) {
        fieldMouseRef.current = target;
        setFieldMouse(target);
        animationFrame = window.requestAnimationFrame(tick);
        return;
      }

      if (current === target) {
        animationFrame = window.requestAnimationFrame(tick);
        return;
      }

      const easing = 1 - mouseSmoothing * 0.0095;
      const next = {
        x: current.x + (target.x - current.x) * easing,
        y: current.y + (target.y - current.y) * easing,
      };

      if (Math.hypot(next.x - target.x, next.y - target.y) < 0.001) {
        fieldMouseRef.current = target;
        setFieldMouse(target);
      } else {
        fieldMouseRef.current = next;
        setFieldMouse(next);
      }

      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [mouseModulation, mouseSmoothing]);

  useEffect(() => {
    if (!isPlayingMasks || maskPlaySpeed <= 0) {
      return;
    }

    const intervalMs = Math.max(20, Math.round(100 / (maskPlaySpeed / 100)));
    const interval = window.setInterval(() => {
      setMaskPattern((current) => (((current + 1) % qrMaskPatterns.length) as QRMaskPattern));
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [isPlayingMasks, maskPlaySpeed, setMaskPattern]);

  const handleBackgroundImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBackgroundImageHref(reader.result);
        setBackgroundSource("uploaded");
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePreviewPointerMove = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (!mouseModulation) {
        return;
      }

      const bounds = event.currentTarget.getBoundingClientRect();
      targetFieldMouseRef.current = {
        x: clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
        y: clamp((event.clientY - bounds.top) / bounds.height, 0, 1),
      };
    },
    [mouseModulation],
  );

  const handlePreviewPointerLeave = useCallback(() => {
    targetFieldMouseRef.current = null;
  }, []);

  const getCurrentPresetSettings = (): PresetSettings => ({
    allowDiagonalJoins,
    angleField,
    angleFieldSpeed,
    backgroundImageHref,
    backgroundPixelation,
    backgroundSource,
    connectorStyle,
    dotShrinkage,
    errorLevel,
    evolveAngleField,
    fieldBackgroundChaos,
    fieldBackgroundDensity,
    fieldBackgroundMode,
    fieldFirstColor,
    fieldSecondColor,
    fillColor,
    joinAlgorithm,
    isPlayingMasks,
    maskPattern,
    maskPlaySpeed,
    mouseModulation,
    mouseSmoothing,
    paddingModules,
    pathStrokeSize,
    pathSmoothing,
    qrDarkColor,
    qrLightColor,
    standaloneDotScale,
    strokeCap,
    syntheticPaddingData,
    syntheticPaddingFieldCompliance,
    userSize,
  });

  const applyPresetSettings = (preset: PresetSettings) => {
    setErrorLevel(preset.errorLevel);
    setUserSize(preset.userSize);
    setFillColor(preset.fillColor);
    setIsPlayingMasks(preset.isPlayingMasks);
    setQrDarkColor(preset.qrDarkColor);
    setQrLightColor(preset.qrLightColor);
    setFieldBackgroundChaos(preset.fieldBackgroundChaos);
    setFieldBackgroundDensity(preset.fieldBackgroundDensity);
    setFieldFirstColor(preset.fieldFirstColor);
    setFieldBackgroundMode(preset.fieldBackgroundMode);
    setFieldSecondColor(preset.fieldSecondColor);
    setBackgroundSource(preset.backgroundSource);
    setBackgroundImageHref(preset.backgroundImageHref);
    setDotShrinkage(preset.dotShrinkage);
    setJoinAlgorithm(preset.joinAlgorithm);
    setAllowDiagonalJoins(preset.allowDiagonalJoins);
    setAngleField(preset.angleField);
    setConnectorStyle(preset.connectorStyle);
    setPathStrokeSize(preset.pathStrokeSize);
    setPathSmoothing(preset.pathSmoothing);
    setStandaloneDotScale(preset.standaloneDotScale);
    setPaddingModules(preset.paddingModules);
    setSyntheticPaddingData(preset.syntheticPaddingData);
    setSyntheticPaddingFieldCompliance(preset.syntheticPaddingFieldCompliance);
    setBackgroundPixelation(preset.backgroundPixelation);
    setMaskPattern(preset.maskPattern);
    setMaskPlaySpeed(preset.maskPlaySpeed);
    setStrokeCap(preset.strokeCap);
    setEvolveAngleField(preset.evolveAngleField);
    setAngleFieldSpeed(preset.angleFieldSpeed);
    setMouseModulation(preset.mouseModulation);
    setMouseSmoothing(preset.mouseSmoothing);
  };

  const applyMainPreset = () => {
    applyPresetSettings(mainPresetSettings);
  };

  const applyVerticalFieldPreset = () => {
    applyPresetSettings(verticalFieldPresetSettings);
  };

  const applyRingsPreset = () => {
    applyPresetSettings(ringsPresetSettings);
  };

  const applySmoothPathsPreset = () => {
    setConnectorStyle("paths");
    setStrokeCap("round");
    setPathSmoothing(100);
  };

  const resetSettings = () => {
    applyMainPreset();
    setFieldMouse(null);
    fieldMouseRef.current = null;
    targetFieldMouseRef.current = null;
    setFieldPhase(0);
    generatedBackgroundHrefRef.current = "";
    setGeneratedBackgroundHref("");
  };

  const saveCurrentPreset = () => {
    setSavedPreset({
      ...getCurrentPresetSettings(),
      mouseSmoothing: 0,
    });
  };

  const applySavedPreset = () => {
    if (savedPreset) {
      applyPresetSettings({
        ...savedPreset,
        mouseSmoothing: 0,
      });
    }
  };

  return (
    <div className="app-shell">
      <SettingsPane
        advancedOpen={advancedOpen}
        allowDiagonalJoins={allowDiagonalJoins}
        angleField={angleField}
        angleFieldSpeed={angleFieldSpeed}
        applyMainPreset={applyMainPreset}
        applyRingsPreset={applyRingsPreset}
        applySavedPreset={applySavedPreset}
        applySmoothPathsPreset={applySmoothPathsPreset}
        applyVerticalFieldPreset={applyVerticalFieldPreset}
        backgroundImageHref={backgroundImageHref}
        backgroundResolutionMax={backgroundResolutionMax}
        backgroundSource={backgroundSource}
        connectorStyle={connectorStyle}
        dotShrinkage={dotShrinkage}
        effectiveBackgroundPixelation={effectiveBackgroundPixelation}
        errorLevel={errorLevel}
        evolveAngleField={evolveAngleField}
        fieldBackgroundChaos={fieldBackgroundChaos}
        fieldBackgroundDensity={fieldBackgroundDensity}
        fieldBackgroundMode={fieldBackgroundMode}
        fieldFirstColor={fieldFirstColor}
        fieldMouseRef={fieldMouseRef}
        fieldSecondColor={fieldSecondColor}
        fillColor={fillColor}
        handleBackgroundImageUpload={handleBackgroundImageUpload}
        isPlayingMasks={isPlayingMasks}
        joinAlgorithm={joinAlgorithm}
        maskPattern={maskPattern}
        maskPlaySpeed={maskPlaySpeed}
        mouseModulation={mouseModulation}
        mouseSmoothing={mouseSmoothing}
        paddingModules={paddingModules}
        pathSmoothing={pathSmoothing}
        pathStrokeSize={pathStrokeSize}
        qrDarkColor={qrDarkColor}
        qrLightColor={qrLightColor}
        qrResolution={qrResolution}
        resetSettings={resetSettings}
        saveCurrentPreset={saveCurrentPreset}
        savedPreset={savedPreset}
        setAdvancedOpen={setAdvancedOpen}
        setAllowDiagonalJoins={setAllowDiagonalJoins}
        setAngleField={setAngleField}
        setAngleFieldSpeed={setAngleFieldSpeed}
        setBackgroundImageHref={setBackgroundImageHref}
        setBackgroundPixelation={setBackgroundPixelation}
        setBackgroundSource={setBackgroundSource}
        setConnectorStyle={setConnectorStyle}
        setDotShrinkage={setDotShrinkage}
        setErrorLevel={setErrorLevel}
        setEvolveAngleField={setEvolveAngleField}
        setFieldBackgroundChaos={setFieldBackgroundChaos}
        setFieldBackgroundDensity={setFieldBackgroundDensity}
        setFieldBackgroundMode={setFieldBackgroundMode}
        setFieldFirstColor={setFieldFirstColor}
        setFieldMouse={setFieldMouse}
        setFieldSecondColor={setFieldSecondColor}
        setFillColor={setFillColor}
        setIsPlayingMasks={setIsPlayingMasks}
        setJoinAlgorithm={setJoinAlgorithm}
        setMaskPattern={setMaskPattern}
        setMaskPlaySpeed={setMaskPlaySpeed}
        setMouseModulation={setMouseModulation}
        setMouseSmoothing={setMouseSmoothing}
        setPaddingModules={setPaddingModules}
        setPathSmoothing={setPathSmoothing}
        setPathStrokeSize={setPathStrokeSize}
        setQrDarkColor={setQrDarkColor}
        setQrLightColor={setQrLightColor}
        setStandaloneDotScale={setStandaloneDotScale}
        setStrokeCap={setStrokeCap}
        setSyntheticPaddingData={setSyntheticPaddingData}
        setSyntheticPaddingFieldCompliance={setSyntheticPaddingFieldCompliance}
        setText={setText}
        setUserSize={setUserSize}
        standaloneDotScale={standaloneDotScale}
        strokeCap={strokeCap}
        syntheticPaddingData={syntheticPaddingData}
        syntheticPaddingFieldCompliance={syntheticPaddingFieldCompliance}
        targetFieldMouseRef={targetFieldMouseRef}
        text={text}
        userSize={userSize}
      />

      <PreviewPane
        handlePreviewPointerLeave={handlePreviewPointerLeave}
        handlePreviewPointerMove={handlePreviewPointerMove}
        outputRef={outputRef}
        pngHref={pngHref}
        svgHref={svgHref}
      />
    </div>
  );
}
