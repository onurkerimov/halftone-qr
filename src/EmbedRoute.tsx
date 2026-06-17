import { HalftoneQrPreset } from "./lib/HalftoneQrPreset";

function getEmbedValue() {
  const params = new URLSearchParams(window.location.search);
  return params.get("text") || params.get("value") || "https://nity.ch";
}

export function EmbedRoute() {
  return (
    <main className="embed-route">
      <HalftoneQrPreset className="embed-qr" value={getEmbedValue()} />
    </main>
  );
}
