import { useMemo } from "react";
import { readEmbedState } from "./embed-state";
import { HalftoneQrPreset } from "./lib/HalftoneQrPreset";

export function EmbedRoute() {
  const embedState = useMemo(() => readEmbedState(), []);

  return (
    <main className="embed-route">
      <HalftoneQrPreset className="embed-qr" settings={embedState.preset} value={embedState.text} />
    </main>
  );
}
