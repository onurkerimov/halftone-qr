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

  params.set("text", text);
  params.set("preset", JSON.stringify(preset));
  url.hash = params.toString();

  return `${url.pathname}${url.hash}`;
}

export function readEmbedState(): EmbedState {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);
  const params = hashParams.size > 0 ? hashParams : searchParams;
  const text = params.get("text") || params.get("value") || "https://nity.ch";
  const presetParam = params.get("preset");

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
