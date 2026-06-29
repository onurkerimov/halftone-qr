import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { mainPresetSettings } from "./constants";
import { parsePresetSettings } from "./parsing";
import type { PresetSettings } from "./types";
import { isRecord } from "./utils";

type EmbedState = {
  preset: PresetSettings;
  text: string;
};

export function createEmbedHref(text: string, preset: PresetSettings): string {
  const url = new URL("/embed", window.location.href);
  const params = new URLSearchParams();
  const compressedState = compressToEncodedURIComponent(
    JSON.stringify({
      preset,
      text,
    }),
  );

  params.set("s", compressedState);
  url.hash = params.toString();

  return `${url.pathname}${url.hash}`;
}

function parseEmbedState(value: unknown): EmbedState | null {
  if (!isRecord(value)) {
    return null;
  }

  const preset = parsePresetSettings(value.preset, mainPresetSettings) ?? mainPresetSettings;

  return {
    preset,
    text: typeof value.text === "string" ? value.text : "https://nity.ch",
  };
}

export function readEmbedState(): EmbedState {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);
  const params = hashParams.size > 0 ? hashParams : searchParams;
  const compressedStateParam = params.get("s");
  const text = params.get("text") || params.get("value") || "https://nity.ch";
  const presetParam = params.get("preset");

  if (compressedStateParam) {
    try {
      const decompressed = decompressFromEncodedURIComponent(compressedStateParam);
      const parsed = decompressed ? (JSON.parse(decompressed) as unknown) : null;
      const state = parseEmbedState(parsed);

      if (state) {
        return state;
      }
    } catch {
      // Fall through to the legacy uncompressed params.
    }
  }

  if (!presetParam) {
    return {
      preset: mainPresetSettings,
      text,
    };
  }

  try {
    const parsed = JSON.parse(presetParam) as unknown;
    const preset = isRecord(parsed) ? parsePresetSettings(parsed, mainPresetSettings) : mainPresetSettings;

    return {
      preset: preset ?? mainPresetSettings,
      text,
    };
  } catch {
    return {
      preset: mainPresetSettings,
      text,
    };
  }
}
