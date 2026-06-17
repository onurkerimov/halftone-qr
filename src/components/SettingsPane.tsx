import { type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import {
  type AngleField,
  type BackgroundSource,
  type ConnectorStyle,
  type DotShrinkage,
  type ErrorLevel,
  type FieldBackgroundMode,
  type JoinAlgorithm,
  type Point,
  type PresetSettings,
  type QRMaskPattern,
  type StrokeCap,
  getFieldVector,
  qrMaskPatterns,
} from "../core";

type StateSetter<T> = Dispatch<SetStateAction<T>>;

type MutableRef<T> = {
  current: T;
};

type SettingsPaneProps = {
  advancedOpen: boolean;
  allowDiagonalJoins: boolean;
  angleField: AngleField;
  angleFieldSpeed: number;
  applyDenseRingsPreset: () => void;
  applyMainPreset: () => void;
  applyRingsPreset: () => void;
  applySavedPreset: () => void;
  applySmoothPathsPreset: () => void;
  applyVerticalFieldPreset: () => void;
  backgroundImageHref: string;
  backgroundResolutionMax: number;
  backgroundSource: BackgroundSource;
  connectorStyle: ConnectorStyle;
  dotShrinkage: DotShrinkage;
  effectiveBackgroundPixelation: number;
  errorLevel: ErrorLevel;
  evolveAngleField: boolean;
  fieldBackgroundChaos: number;
  fieldBackgroundDensity: number;
  fieldBackgroundDominance: number;
  fieldBackgroundMode: FieldBackgroundMode;
  fieldFirstColor: string;
  fieldMouseRef: MutableRef<Point | null>;
  fieldSecondColor: string;
  fillColor: string;
  handleBackgroundImageUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  isPlayingMasks: boolean;
  joinAlgorithm: JoinAlgorithm;
  maskPattern: QRMaskPattern;
  maskPlaySpeed: number;
  mouseModulation: boolean;
  mouseSmoothing: number;
  paddingModules: number;
  pathSmoothing: number;
  pathStrokeSize: number;
  qrDarkColor: string;
  qrLightColor: string;
  qrResolution: number;
  resetSettings: () => void;
  saveCurrentPreset: () => void;
  savedPreset: PresetSettings | null;
  setAdvancedOpen: StateSetter<boolean>;
  setAllowDiagonalJoins: StateSetter<boolean>;
  setAngleField: StateSetter<AngleField>;
  setAngleFieldSpeed: StateSetter<number>;
  setBackgroundImageHref: StateSetter<string>;
  setBackgroundPixelation: StateSetter<number>;
  setBackgroundSource: StateSetter<BackgroundSource>;
  setConnectorStyle: StateSetter<ConnectorStyle>;
  setDotShrinkage: StateSetter<DotShrinkage>;
  setErrorLevel: StateSetter<ErrorLevel>;
  setEvolveAngleField: StateSetter<boolean>;
  setFieldBackgroundChaos: StateSetter<number>;
  setFieldBackgroundDensity: StateSetter<number>;
  setFieldBackgroundDominance: StateSetter<number>;
  setFieldBackgroundMode: StateSetter<FieldBackgroundMode>;
  setFieldFirstColor: StateSetter<string>;
  setFieldMouse: StateSetter<Point | null>;
  setFieldSecondColor: StateSetter<string>;
  setFillColor: StateSetter<string>;
  setIsPlayingMasks: StateSetter<boolean>;
  setJoinAlgorithm: StateSetter<JoinAlgorithm>;
  setMaskPattern: StateSetter<QRMaskPattern>;
  setMaskPlaySpeed: StateSetter<number>;
  setMouseModulation: StateSetter<boolean>;
  setMouseSmoothing: StateSetter<number>;
  setPaddingModules: StateSetter<number>;
  setPathSmoothing: StateSetter<number>;
  setPathStrokeSize: StateSetter<number>;
  setQrDarkColor: StateSetter<string>;
  setQrLightColor: StateSetter<string>;
  setStandaloneDotScale: StateSetter<number>;
  setStrokeCap: StateSetter<StrokeCap>;
  setSyntheticPaddingData: StateSetter<boolean>;
  setSyntheticPaddingFieldCompliance: StateSetter<number>;
  setText: StateSetter<string>;
  setUserSize: StateSetter<number>;
  standaloneDotScale: number;
  strokeCap: StrokeCap;
  syntheticPaddingData: boolean;
  syntheticPaddingFieldCompliance: number;
  targetFieldMouseRef: MutableRef<Point | null>;
  text: string;
  userSize: number;
};

type AngleFieldOption = {
  label: string;
  value: AngleField;
};

const angleFieldOptions: AngleFieldOption[] = [
  { label: "None", value: "none" },
  { label: "Horizontal", value: "horizontal" },
  { label: "Vertical", value: "vertical" },
  { label: "Diagonal down", value: "diagonalDown" },
  { label: "Diagonal up", value: "diagonalUp" },
  { label: "Radial", value: "radial" },
  { label: "Rings", value: "rings" },
  { label: "Spiral", value: "spiral" },
  { label: "Wavy", value: "wavy" },
  { label: "Pinwheel", value: "pinwheel" },
  { label: "Diamond", value: "diamond" },
  { label: "Vortex", value: "vortex" },
  { label: "Noise", value: "noise" },
  { label: "Cross", value: "cross" },
  { label: "Hourglass", value: "hourglass" },
  { label: "Fan", value: "fan" },
  { label: "Twist", value: "twist" },
  { label: "Flow map", value: "flowMap" },
];

function AngleFieldPreview({ field, label }: { field: AngleField; label: string }) {
  const sampleSize = 7;
  const viewSize = 48;
  const step = viewSize / sampleSize;
  const halfLength = 2.8;
  const samples = Array.from({ length: sampleSize * sampleSize }, (_, index) => {
    const x = index % sampleSize;
    const y = Math.floor(index / sampleSize);
    const centerX = x * step + step / 2;
    const centerY = y * step + step / 2;

    if (field === "none") {
      return <circle className="angle-field-dot" cx={centerX} cy={centerY} key={index} r="1" />;
    }

    const vector = getFieldVector(field, x, y, sampleSize, { mouse: null, phase: 0 });
    const length = Math.hypot(vector.x, vector.y) || 1;
    const unitX = vector.x / length;
    const unitY = vector.y / length;

    return (
      <line
        className="angle-field-vector"
        key={index}
        x1={centerX - unitX * halfLength}
        x2={centerX + unitX * halfLength}
        y1={centerY - unitY * halfLength}
        y2={centerY + unitY * halfLength}
      />
    );
  });

  return (
    <svg aria-hidden="true" className="angle-field-preview" focusable="false" viewBox={`0 0 ${viewSize} ${viewSize}`}>
      <title>{label}</title>
      <rect className="angle-field-preview-bg" height={viewSize} width={viewSize} x="0" y="0" />
      {samples}
    </svg>
  );
}

export function SettingsPane({
  advancedOpen,
  allowDiagonalJoins,
  angleField,
  angleFieldSpeed,
  applyDenseRingsPreset,
  applyMainPreset,
  applyRingsPreset,
  applySavedPreset,
  applySmoothPathsPreset,
  applyVerticalFieldPreset,
  backgroundImageHref,
  backgroundResolutionMax,
  backgroundSource,
  connectorStyle,
  dotShrinkage,
  effectiveBackgroundPixelation,
  errorLevel,
  evolveAngleField,
  fieldBackgroundChaos,
  fieldBackgroundDensity,
  fieldBackgroundDominance,
  fieldBackgroundMode,
  fieldFirstColor,
  fieldMouseRef,
  fieldSecondColor,
  fillColor,
  handleBackgroundImageUpload,
  isPlayingMasks,
  joinAlgorithm,
  maskPattern,
  maskPlaySpeed,
  mouseModulation,
  mouseSmoothing,
  paddingModules,
  pathSmoothing,
  pathStrokeSize,
  qrDarkColor,
  qrLightColor,
  qrResolution,
  resetSettings,
  saveCurrentPreset,
  savedPreset,
  setAdvancedOpen,
  setAllowDiagonalJoins,
  setAngleField,
  setAngleFieldSpeed,
  setBackgroundImageHref,
  setBackgroundPixelation,
  setBackgroundSource,
  setConnectorStyle,
  setDotShrinkage,
  setErrorLevel,
  setEvolveAngleField,
  setFieldBackgroundChaos,
  setFieldBackgroundDensity,
  setFieldBackgroundDominance,
  setFieldBackgroundMode,
  setFieldFirstColor,
  setFieldMouse,
  setFieldSecondColor,
  setFillColor,
  setIsPlayingMasks,
  setJoinAlgorithm,
  setMaskPattern,
  setMaskPlaySpeed,
  setMouseModulation,
  setMouseSmoothing,
  setPaddingModules,
  setPathSmoothing,
  setPathStrokeSize,
  setQrDarkColor,
  setQrLightColor,
  setStandaloneDotScale,
  setStrokeCap,
  setSyntheticPaddingData,
  setSyntheticPaddingFieldCompliance,
  setText,
  setUserSize,
  standaloneDotScale,
  strokeCap,
  syntheticPaddingData,
  syntheticPaddingFieldCompliance,
  targetFieldMouseRef,
  text,
  userSize,
}: SettingsPaneProps) {
  const selectedAngleFieldLabel =
    angleFieldOptions.find((option) => option.value === angleField)?.label ?? "Custom field";

  return (
    <aside className="settings-pane">
      <header className="app-header">
        <p className="eyebrow">QR Generator</p>
        <p className="field-hint header-copy">Black canvas, sharp edges, precise output.</p>
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
            <span className="field-label">Presets</span>
            <div className="preset-row">
              <button className="ui-button" onClick={applyMainPreset} type="button">
                Default preset
              </button>
              <button className="ui-button secondary" onClick={applyVerticalFieldPreset} type="button">
                Vertical field
              </button>
              <button className="ui-button secondary" onClick={applyRingsPreset} type="button">
                Rings field
              </button>
              <button className="ui-button secondary" onClick={applyDenseRingsPreset} type="button">
                Dense rings field
              </button>
            </div>
          </div>

          <div className="field">
            <span className="field-label" id="angleFieldLabel">
              Angle field
            </span>
            <div aria-labelledby="angleFieldLabel" className="angle-field-grid" role="radiogroup">
              {angleFieldOptions.map((option) => (
                <label className="angle-field-choice" htmlFor={`angleField-${option.value}`} key={option.value}>
                  <input
                    checked={angleField === option.value}
                    className="angle-field-input sr-only"
                    id={`angleField-${option.value}`}
                    name="angleField"
                    onChange={() => setAngleField(option.value)}
                    type="radio"
                    value={option.value}
                  />
                  <span className="angle-field-option" title={option.label}>
                    <AngleFieldPreview field={option.value} label={option.label} />
                    <span className="sr-only">{option.label}</span>
                  </span>
                </label>
              ))}
            </div>
            <span className="angle-field-selected">Selected: {selectedAngleFieldLabel}</span>
            <span className="field-hint">Used by Field snake to bias non-forking paths by local direction.</span>
          </div>
        </section>

        <section className="settings-section advanced-section">
          <button
            aria-expanded={advancedOpen}
            className="advanced-toggle"
            onClick={() => setAdvancedOpen((open) => !open)}
            type="button"
          >
            <span>
              <span className="field-label">Advanced</span>
              <span className="field-hint">Background, colors, paths, masks, and QR version.</span>
            </span>
            <span aria-hidden="true" className="advanced-chevron">
              {advancedOpen ? "-" : "+"}
            </span>
          </button>

          {advancedOpen ? (
            <div className="advanced-content">
              <details className="settings-accordion" open>
                <summary className="settings-accordion-summary">
                  <span className="field-label">Background</span>
                </summary>
                <div className="settings-accordion-content">
                  <div className="field">
                    <label className="field-label" htmlFor="backgroundSource">
                      Background source
                    </label>
                    <select
                      className="ui-select"
                      id="backgroundSource"
                      onChange={(event) => setBackgroundSource(event.target.value as BackgroundSource)}
                      value={backgroundSource}
                    >
                      <option value="color">Color only</option>
                      <option value="uploaded">Uploaded image</option>
                      <option value="field">Generated angle field</option>
                    </select>
                  </div>

                  {backgroundSource === "uploaded" ? (
                    <div className="field">
                      <label className="field-label" htmlFor="backgroundImage">
                        Background image
                      </label>
                      <div className="file-row">
                        <input
                          accept="image/*"
                          className="ui-file"
                          id="backgroundImage"
                          onChange={handleBackgroundImageUpload}
                          type="file"
                        />
                        <button
                          className="ui-button secondary"
                          disabled={!backgroundImageHref}
                          onClick={() => {
                            setBackgroundImageHref("");
                            setBackgroundSource("color");
                          }}
                          type="button"
                        >
                          Clear
                        </button>
                      </div>
                      <span className="field-hint">
                        {backgroundImageHref
                          ? "Image is embedded into SVG and drawn behind the QR."
                          : "Choose an image to draw behind the QR."}
                      </span>
                    </div>
                  ) : null}

                  {backgroundSource === "field" ? (
                    <>
                      <label className="switch-row" htmlFor="fieldBackgroundMode">
                        <span>
                          <span className="field-label">Legacy field background</span>
                          <span className="field-hint">Uses the previous normal-projection field image.</span>
                        </span>
                        <input
                          checked={fieldBackgroundMode === "normal"}
                          className="switch-input"
                          id="fieldBackgroundMode"
                          onChange={(event) => setFieldBackgroundMode(event.target.checked ? "normal" : "contours")}
                          type="checkbox"
                        />
                      </label>

                      <div className="field">
                        <label className="field-label range-label" htmlFor="fieldBackgroundDensity">
                          <span>Field stripe density</span>
                          <span>{Math.round(fieldBackgroundDensity)}%</span>
                        </label>
                        <input
                          className="ui-range"
                          id="fieldBackgroundDensity"
                          max="500"
                          min="50"
                          onChange={(event) => setFieldBackgroundDensity(Number.parseInt(event.target.value, 10))}
                          step="10"
                          type="range"
                          value={fieldBackgroundDensity}
                        />
                        <span className="field-hint">
                          Controls generated angle-field stripe spacing when legacy mode is off.
                        </span>
                      </div>

                      <div className="field">
                        <label className="field-label range-label" htmlFor="fieldBackgroundChaos">
                          <span>Field stripe chaos</span>
                          <span>{Math.round(fieldBackgroundChaos)}%</span>
                        </label>
                        <input
                          className="ui-range"
                          id="fieldBackgroundChaos"
                          max="100"
                          min="0"
                          onChange={(event) => setFieldBackgroundChaos(Number.parseInt(event.target.value, 10))}
                          step="5"
                          type="range"
                          value={fieldBackgroundChaos}
                        />
                        <span className="field-hint">
                          Adds organic swirl and imperfect contour wobble when legacy mode is off.
                        </span>
                      </div>

                      <div className="field">
                        <label className="field-label range-label" htmlFor="fieldBackgroundDominance">
                          <span>Field stripe A dominance</span>
                          <span>{Math.round(fieldBackgroundDominance)}%</span>
                        </label>
                        <input
                          className="ui-range"
                          id="fieldBackgroundDominance"
                          max="100"
                          min="0"
                          onChange={(event) => setFieldBackgroundDominance(Number.parseInt(event.target.value, 10))}
                          step="1"
                          type="range"
                          value={fieldBackgroundDominance}
                        />
                        <span className="field-hint">
                          50% is balanced. Higher values favor stripe A; lower values favor stripe B.
                        </span>
                      </div>
                    </>
                  ) : null}

                  {backgroundSource !== "color" ? (
                    <div className="field">
                      <label className="field-label range-label" htmlFor="backgroundPixelation">
                        <span>{backgroundSource === "field" ? "Angle field resolution" : "Background pixelation"}</span>
                        <span>
                          {backgroundSource === "field"
                            ? `${effectiveBackgroundPixelation} x ${effectiveBackgroundPixelation}`
                            : effectiveBackgroundPixelation === 0
                              ? "Off"
                              : `${effectiveBackgroundPixelation} / ${qrResolution}`}
                        </span>
                      </label>
                      <input
                        className="ui-range"
                        id="backgroundPixelation"
                        max={backgroundResolutionMax}
                        min={backgroundSource === "field" ? "1" : "0"}
                        onChange={(event) => setBackgroundPixelation(Number.parseInt(event.target.value, 10))}
                        step="1"
                        type="range"
                        value={effectiveBackgroundPixelation}
                      />
                      <span className="field-hint">
                        {backgroundSource === "field"
                          ? "Sets the generated field image resolution before it is scaled behind the QR."
                          : "Pixelates uploaded backgrounds. The maximum grid matches the QR module resolution."}
                      </span>
                    </div>
                  ) : null}
                </div>
              </details>

              <details className="settings-accordion">
                <summary className="settings-accordion-summary">
                  <span className="field-label">Colors</span>
                </summary>
                <div className="settings-accordion-content">
                  <div className="color-grid">
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

                    <div className="field">
                      <label className="field-label" htmlFor="qrDarkColor">
                        QR dark
                      </label>
                      <div className="color-row">
                        <input
                          className="color-input"
                          id="qrDarkColor"
                          onChange={(event) => setQrDarkColor(event.target.value)}
                          title="Choose the dark QR color"
                          type="color"
                          value={qrDarkColor}
                        />
                        <span className="color-value">{qrDarkColor}</span>
                      </div>
                    </div>

                    <div className="field">
                      <label className="field-label" htmlFor="qrLightColor">
                        QR light
                      </label>
                      <div className="color-row">
                        <input
                          className="color-input"
                          id="qrLightColor"
                          onChange={(event) => setQrLightColor(event.target.value)}
                          title="Choose the light QR color"
                          type="color"
                          value={qrLightColor}
                        />
                        <span className="color-value">{qrLightColor}</span>
                      </div>
                    </div>

                    {backgroundSource === "field" ? (
                      <>
                        <div className="field">
                          <label className="field-label" htmlFor="fieldFirstColor">
                            Field stripe A
                          </label>
                          <div className="color-row">
                            <input
                              className="color-input"
                              id="fieldFirstColor"
                              onChange={(event) => setFieldFirstColor(event.target.value)}
                              title="Choose the first generated field color"
                              type="color"
                              value={fieldFirstColor}
                            />
                            <span className="color-value">{fieldFirstColor}</span>
                          </div>
                        </div>

                        <div className="field">
                          <label className="field-label" htmlFor="fieldSecondColor">
                            Field stripe B
                          </label>
                          <div className="color-row">
                            <input
                              className="color-input"
                              id="fieldSecondColor"
                              onChange={(event) => setFieldSecondColor(event.target.value)}
                              title="Choose the second generated field color"
                              type="color"
                              value={fieldSecondColor}
                            />
                            <span className="color-value">{fieldSecondColor}</span>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </details>

              <details className="settings-accordion">
                <summary className="settings-accordion-summary">
                  <span className="field-label">Field Motion</span>
                </summary>
                <div className="settings-accordion-content">
                  <label className="switch-row" htmlFor="evolveAngleField">
                    <span>
                      <span className="field-label">Evolve angle field</span>
                      <span className="field-hint">
                        Animates Field snake direction and the generated field background.
                      </span>
                    </span>
                    <input
                      checked={evolveAngleField}
                      className="switch-input"
                      id="evolveAngleField"
                      onChange={(event) => setEvolveAngleField(event.target.checked)}
                      type="checkbox"
                    />
                  </label>

                  <div className="field">
                    <label className="field-label range-label" htmlFor="angleFieldSpeed">
                      <span>Evolution speed</span>
                      <span>{Math.round(angleFieldSpeed)}%</span>
                    </label>
                    <input
                      className="ui-range"
                      id="angleFieldSpeed"
                      max="300"
                      min="0"
                      onChange={(event) => setAngleFieldSpeed(Number.parseInt(event.target.value, 10))}
                      step="5"
                      type="range"
                      value={angleFieldSpeed}
                    />
                    <span className="field-hint">Scales the animated angle-field phase. 100% matches the default speed.</span>
                  </div>

                  <label className="switch-row" htmlFor="mouseModulation">
                    <span>
                      <span className="field-label">Mouse modulation</span>
                      <span className="field-hint">Move over the preview to pull and ripple the active angle field.</span>
                    </span>
                    <input
                      checked={mouseModulation}
                      className="switch-input"
                      id="mouseModulation"
                      onChange={(event) => {
                        setMouseModulation(event.target.checked);
                        if (!event.target.checked) {
                          fieldMouseRef.current = null;
                          targetFieldMouseRef.current = null;
                          setFieldMouse(null);
                        }
                      }}
                      type="checkbox"
                    />
                  </label>

                  <div className="field">
                    <label className="field-label range-label" htmlFor="mouseSmoothing">
                      <span>Mouse smoothing</span>
                      <span>{Math.round(mouseSmoothing)}%</span>
                    </label>
                    <input
                      className="ui-range"
                      id="mouseSmoothing"
                      max="100"
                      min="0"
                      onChange={(event) => setMouseSmoothing(Number.parseInt(event.target.value, 10))}
                      step="1"
                      type="range"
                      value={mouseSmoothing}
                    />
                    <span className="field-hint">0% follows the pointer immediately. Higher values add more easing.</span>
                  </div>
                </div>
              </details>

              <details className="settings-accordion">
                <summary className="settings-accordion-summary">
                  <span className="field-label">Connectors</span>
                </summary>
                <div className="settings-accordion-content">
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

                  {connectorStyle === "paths" ? (
                    <>
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

                      <div className="field">
                        <label className="field-label range-label" htmlFor="pathStrokeSize">
                          <span>Path stroke size</span>
                          <span>{pathStrokeSize.toFixed(2)}x</span>
                        </label>
                        <input
                          className="ui-range"
                          id="pathStrokeSize"
                          max="3"
                          min="2"
                          onChange={(event) => setPathStrokeSize(Number.parseFloat(event.target.value))}
                          step="0.01"
                          type="range"
                          value={pathStrokeSize}
                        />
                        <span className="field-hint">2x is thicker. 3x is thinner.</span>
                      </div>

                      <div className="field">
                        <label className="field-label range-label" htmlFor="standaloneDotScale">
                          <span>Standalone dot size</span>
                          <span>{standaloneDotScale.toFixed(2)}x</span>
                        </label>
                        <input
                          className="ui-range"
                          id="standaloneDotScale"
                          max="4"
                          min="1"
                          onChange={(event) => setStandaloneDotScale(Number.parseFloat(event.target.value))}
                          step="0.01"
                          type="range"
                          value={standaloneDotScale}
                        />
                        <span className="field-hint">Applies to unconnected rounded dots in SVG path mode.</span>
                      </div>

                      <div className="field">
                        <label className="field-label range-label" htmlFor="pathSmoothing">
                          <span>Path smoothing</span>
                          <span>{Math.round(pathSmoothing)}%</span>
                        </label>
                        <input
                          className="ui-range"
                          id="pathSmoothing"
                          max="100"
                          min="0"
                          onChange={(event) => setPathSmoothing(Number.parseInt(event.target.value, 10))}
                          step="1"
                          type="range"
                          value={pathSmoothing}
                        />
                        <span className="field-hint">
                          Rounds corners in SVG path mode. Higher values bend paths farther from the QR grid.
                        </span>
                      </div>
                    </>
                  ) : null}
                </div>
              </details>

              <details className="settings-accordion">
                <summary className="settings-accordion-summary">
                  <span className="field-label">QR and Masks</span>
                </summary>
                <div className="settings-accordion-content">
                  <div className="field">
                    <label className="field-label" htmlFor="maskPattern">
                      QR mask pattern
                    </label>
                    <div className="mask-row">
                      <select
                        className="ui-select"
                        id="maskPattern"
                        onChange={(event) => setMaskPattern(Number.parseInt(event.target.value, 10) as QRMaskPattern)}
                        value={maskPattern}
                      >
                        {qrMaskPatterns.map((pattern) => (
                          <option key={pattern} value={pattern}>
                            Mask {pattern}
                          </option>
                        ))}
                      </select>
                      <button
                        aria-pressed={isPlayingMasks}
                        className="ui-button secondary"
                        onClick={() => setIsPlayingMasks((playing) => !playing)}
                        type="button"
                      >
                        {isPlayingMasks ? "Pause" : "Play"}
                      </button>
                    </div>
                  </div>

                  <div className="field">
                    <label className="field-label range-label" htmlFor="maskPlaySpeed">
                      <span>Mask play speed</span>
                      <span>{Math.round(maskPlaySpeed)}%</span>
                    </label>
                    <input
                      className="ui-range"
                      id="maskPlaySpeed"
                      max="300"
                      min="0"
                      onChange={(event) => setMaskPlaySpeed(Number.parseInt(event.target.value, 10))}
                      step="5"
                      type="range"
                      value={maskPlaySpeed}
                    />
                    <span className="field-hint">Controls how quickly Play cycles through mask patterns.</span>
                  </div>

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
                </div>
              </details>

              <details className="settings-accordion">
                <summary className="settings-accordion-summary">
                  <span className="field-label">Padding Data</span>
                </summary>
                <div className="settings-accordion-content">
                  <div className="field">
                    <label className="field-label range-label" htmlFor="paddingModules">
                      <span>QR padding</span>
                      <span>{paddingModules} modules</span>
                    </label>
                    <input
                      className="ui-range"
                      id="paddingModules"
                      max="8"
                      min="0"
                      onChange={(event) => setPaddingModules(Number.parseInt(event.target.value, 10))}
                      step="1"
                      type="range"
                      value={paddingModules}
                    />
                    <span className="field-hint">Adds background space around the QR in preview and exports.</span>
                  </div>

                  <label className="switch-row" htmlFor="syntheticPaddingData">
                    <span>
                      <span className="field-label">Synthetic padding data</span>
                      <span className="field-hint">
                        Fills the padding with pseudo-random modules seeded by the mask pattern.
                      </span>
                    </span>
                    <input
                      checked={syntheticPaddingData}
                      className="switch-input"
                      id="syntheticPaddingData"
                      onChange={(event) => setSyntheticPaddingData(event.target.checked)}
                      type="checkbox"
                    />
                  </label>

                  {syntheticPaddingData ? (
                    <div className="field">
                      <label className="field-label range-label" htmlFor="syntheticPaddingFieldCompliance">
                        <span>Padding field compliance</span>
                        <span>{Math.round(syntheticPaddingFieldCompliance)}%</span>
                      </label>
                      <input
                        className="ui-range"
                        id="syntheticPaddingFieldCompliance"
                        max="100"
                        min="0"
                        onChange={(event) => setSyntheticPaddingFieldCompliance(Number.parseInt(event.target.value, 10))}
                        step="1"
                        type="range"
                        value={syntheticPaddingFieldCompliance}
                      />
                      <span className="field-hint">
                        Blends random padding with bands aligned to the active angle field.
                      </span>
                    </div>
                  ) : null}
                </div>
              </details>

              <details className="settings-accordion">
                <summary className="settings-accordion-summary">
                  <span className="field-label">Preset Tools</span>
                </summary>
                <div className="settings-accordion-content">
                  <div className="preset-row">
                    <button className="ui-button secondary" onClick={applySmoothPathsPreset} type="button">
                      Smooth paths
                    </button>
                    <button className="ui-button secondary" onClick={resetSettings} type="button">
                      Reset settings
                    </button>
                    <button className="ui-button secondary" onClick={saveCurrentPreset} type="button">
                      Save current
                    </button>
                    <button
                      className="ui-button secondary"
                      disabled={!savedPreset}
                      onClick={applySavedPreset}
                      type="button"
                    >
                      Apply saved
                    </button>
                  </div>
                </div>
              </details>
            </div>
          ) : null}
        </section>
      </form>
    </aside>
  );
}
