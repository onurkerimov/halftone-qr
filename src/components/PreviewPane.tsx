import { type PointerEvent, type RefObject } from "react";

type PreviewPaneProps = {
  handlePreviewPointerLeave: () => void;
  handlePreviewPointerMove: (event: PointerEvent<HTMLCanvasElement>) => void;
  outputRef: RefObject<HTMLCanvasElement | null>;
  pngHref: string;
  svgHref: string;
};

export function PreviewPane({
  handlePreviewPointerLeave,
  handlePreviewPointerMove,
  outputRef,
  pngHref,
  svgHref,
}: PreviewPaneProps) {
  return (
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
        <canvas
          aria-label="Generated QR code preview"
          className="qr-canvas"
          id="output"
          onPointerLeave={handlePreviewPointerLeave}
          onPointerMove={handlePreviewPointerMove}
          ref={outputRef}
        />
      </div>
    </main>
  );
}
