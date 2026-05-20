"use client";

import { useMemo, useState } from "react";

type HarmonyMode = "complementary" | "triadic" | "analogous" | "monochromatic";

type Swatch = {
  hex: string;
  rgb: string;
  h: number;
  s: number;
  l: number;
  locked: boolean;
};

const modes: { value: HarmonyMode; label: string }[] = [
  { value: "complementary", label: "Complementary" },
  { value: "triadic", label: "Triadic" },
  { value: "analogous", label: "Analogous" },
  { value: "monochromatic", label: "Monochromatic" },
];

const defaultPalette: Swatch[] = [
  createSwatch(214, 84, 60),
  createSwatch(228, 76, 45),
  createSwatch(28, 88, 58),
  createSwatch(36, 90, 48),
  createSwatch(214, 44, 22),
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function wrapHue(value: number) {
  return ((Math.round(value) % 360) + 360) % 360;
}

function componentToHex(value: number) {
  return value.toString(16).padStart(2, "0");
}

function hslToRgb(h: number, s: number, l: number) {
  const hue = wrapHue(h) / 360;
  const sat = clamp(s, 0, 100) / 100;
  const light = clamp(l, 0, 100) / 100;

  if (sat === 0) {
    const gray = Math.round(light * 255);
    return { r: gray, g: gray, b: gray };
  }

  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
  const p = 2 * light - q;
  const convert = (t: number) => {
    let channel = t;
    if (channel < 0) channel += 1;
    if (channel > 1) channel -= 1;
    if (channel < 1 / 6) return p + (q - p) * 6 * channel;
    if (channel < 1 / 2) return q;
    if (channel < 2 / 3) return p + (q - p) * (2 / 3 - channel) * 6;
    return p;
  };

  return {
    r: Math.round(convert(hue + 1 / 3) * 255),
    g: Math.round(convert(hue) * 255),
    b: Math.round(convert(hue - 1 / 3) * 255),
  };
}

function rgbToHsl(r: number, g: number, b: number) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    if (max === red) h = (green - blue) / delta + (green < blue ? 6 : 0);
    if (max === green) h = (blue - red) / delta + 2;
    if (max === blue) h = (red - green) / delta + 4;
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hexToHsl(hex: string) {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return rgbToHsl(r, g, b);
}

function hslToHex(h: number, s: number, l: number) {
  const { r, g, b } = hslToRgb(h, s, l);
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`.toUpperCase();
}

function createSwatch(h: number, s: number, l: number, locked = false): Swatch {
  const rgb = hslToRgb(h, s, l);

  return {
    hex: hslToHex(h, s, l),
    rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`,
    h: wrapHue(h),
    s: Math.round(clamp(s, 0, 100)),
    l: Math.round(clamp(l, 0, 100)),
    locked,
  };
}

function randomBetween(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

function getModeHues(baseHue: number, mode: HarmonyMode) {
  if (mode === "complementary") return [baseHue, baseHue + 180, baseHue + 160, baseHue + 200, baseHue - 12];
  if (mode === "triadic") return [baseHue, baseHue + 120, baseHue + 240, baseHue + 135, baseHue + 255];
  if (mode === "analogous") return [baseHue - 36, baseHue - 18, baseHue, baseHue + 18, baseHue + 36];
  return [baseHue, baseHue, baseHue, baseHue, baseHue];
}

function buildPalette(baseHex: string, mode: HarmonyMode, previous: Swatch[]) {
  const base = hexToHsl(baseHex);
  const hues = getModeHues(base.h, mode);
  const saturationOffsets = mode === "monochromatic" ? [-16, -6, 8, 18, 28] : [-10, 4, 16, -2, 10];
  const lightnessOffsets = mode === "monochromatic" ? [-24, -10, 2, 14, 28] : [-18, -4, 8, 18, 30];

  return previous.map((swatch, index) => {
    if (swatch.locked) return swatch;

    const hueJitter = mode === "monochromatic" ? randomBetween(-3, 3) : randomBetween(-8, 8);
    const saturation = clamp(base.s + saturationOffsets[index] + randomBetween(-8, 8), 34, 94);
    const lightness = clamp(base.l + lightnessOffsets[index] + randomBetween(-7, 7), 16, 82);

    return createSwatch(hues[index] + hueJitter, saturation, lightness);
  });
}

function readableTextColor(hex: string) {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.56 ? "#111827" : "#F9FAFB";
}

export default function Home() {
  const [mode, setMode] = useState<HarmonyMode>("complementary");
  const [baseColor, setBaseColor] = useState("#3B82F6");
  const [palette, setPalette] = useState<Swatch[]>(defaultPalette);
  const [copiedHex, setCopiedHex] = useState("");

  const cssVariables = useMemo(
    () =>
      `:root {\n${palette
        .map((swatch, index) => `  --palette-${index + 1}: ${swatch.hex};`)
        .join("\n")}\n}`,
    [palette],
  );

  function generatePalette(nextMode = mode, nextBaseColor = baseColor) {
    setPalette((current) => buildPalette(nextBaseColor, nextMode, current));
  }

  function updateMode(nextMode: HarmonyMode) {
    setMode(nextMode);
    generatePalette(nextMode, baseColor);
  }

  function updateBaseColor(nextBaseColor: string) {
    setBaseColor(nextBaseColor);
    generatePalette(mode, nextBaseColor);
  }

  function surpriseBase() {
    const next = hslToHex(randomBetween(0, 359), randomBetween(56, 90), randomBetween(42, 64));
    setBaseColor(next);
    generatePalette(mode, next);
  }

  async function copyHex(hex: string) {
    await navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    window.setTimeout(() => setCopiedHex(""), 1400);
  }

  function toggleLock(index: number) {
    setPalette((current) =>
      current.map((swatch, swatchIndex) =>
        swatchIndex === index ? { ...swatch, locked: !swatch.locked } : swatch,
      ),
    );
  }

  function copyCss() {
    navigator.clipboard.writeText(cssVariables);
    setCopiedHex("CSS");
    window.setTimeout(() => setCopiedHex(""), 1400);
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-5 py-6 text-neutral-100 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-cyan-300">Palette Craft</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-white sm:text-5xl">
              Build harmonious color systems.
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex h-12 items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-neutral-300">
              <span>Base</span>
              <input
                aria-label="Base color"
                type="color"
                value={baseColor}
                onChange={(event) => updateBaseColor(event.target.value)}
                className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <span className="font-mono text-xs text-neutral-400">{baseColor.toUpperCase()}</span>
            </label>
            <button
              type="button"
              onClick={surpriseBase}
              className="h-12 rounded-lg border border-white/10 bg-white/[0.06] px-4 text-sm font-medium text-white transition hover:border-cyan-300/50 hover:bg-cyan-300/10"
            >
              Random Base
            </button>
            <button
              type="button"
              onClick={() => generatePalette()}
              className="h-12 rounded-lg bg-cyan-300 px-5 text-sm font-semibold text-neutral-950 transition hover:bg-cyan-200"
            >
              Generate
            </button>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-4" aria-label="Harmony mode">
          {modes.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => updateMode(item.value)}
              className={`h-11 rounded-lg border px-4 text-sm font-medium transition ${
                mode === item.value
                  ? "border-cyan-300 bg-cyan-300 text-neutral-950"
                  : "border-white/10 bg-white/[0.04] text-neutral-300 hover:border-white/30 hover:bg-white/[0.08]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </section>

        <section className="grid min-h-[430px] gap-4 lg:grid-cols-5" aria-label="Generated palette">
          {palette.map((swatch, index) => (
            <article
              key={`${swatch.hex}-${index}`}
              className="flex min-h-72 flex-col justify-between overflow-hidden rounded-lg border border-white/10 shadow-2xl shadow-black/30 lg:min-h-[520px]"
              style={{ backgroundColor: swatch.hex, color: readableTextColor(swatch.hex) }}
            >
              <div className="flex items-center justify-between p-4">
                <span className="rounded-md bg-black/25 px-3 py-1 text-xs font-semibold backdrop-blur">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => toggleLock(index)}
                  className="rounded-md bg-black/25 px-3 py-1 text-xs font-semibold backdrop-blur transition hover:bg-black/40"
                  aria-pressed={swatch.locked}
                >
                  {swatch.locked ? "Locked" : "Lock"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => copyHex(swatch.hex)}
                className="mt-auto flex w-full flex-col items-start gap-2 bg-black/25 p-5 text-left backdrop-blur transition hover:bg-black/35"
                aria-label={`Copy ${swatch.hex}`}
              >
                <span className="font-mono text-3xl font-semibold">{swatch.hex}</span>
                <span className="font-mono text-sm opacity-85">RGB {swatch.rgb}</span>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
                  {copiedHex === swatch.hex ? "Copied" : "Click to copy"}
                </span>
              </button>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_420px]">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">CSS Variables</h2>
              <button
                type="button"
                onClick={copyCss}
                className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition hover:border-cyan-300/50 hover:bg-cyan-300/10"
              >
                {copiedHex === "CSS" ? "Copied" : "Copy CSS"}
              </button>
            </div>
            <pre className="max-h-72 overflow-auto rounded-lg bg-neutral-950 p-4 text-sm leading-6 text-cyan-100">
              <code>{cssVariables}</code>
            </pre>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-lg font-semibold text-white">Current Palette</h2>
            <div className="mt-4 grid grid-cols-5 overflow-hidden rounded-lg border border-white/10">
              {palette.map((swatch, index) => (
                <button
                  key={`strip-${swatch.hex}-${index}`}
                  type="button"
                  onClick={() => copyHex(swatch.hex)}
                  className="h-24 transition hover:scale-105"
                  style={{ backgroundColor: swatch.hex }}
                  aria-label={`Copy ${swatch.hex}`}
                />
              ))}
            </div>
            <div className="mt-4 grid gap-2 text-sm text-neutral-300">
              {palette.map((swatch, index) => (
                <div key={`meta-${swatch.hex}-${index}`} className="flex items-center justify-between gap-3">
                  <span className="font-mono">{swatch.hex}</span>
                  <span className="font-mono text-neutral-500">rgb({swatch.rgb})</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
