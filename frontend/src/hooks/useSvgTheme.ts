"use client";

import { useEffect, useMemo, useState } from "react";

function parseRGB(rgb: string) {
  // rgb(255, 255, 255) or rgba(0,0,0,1)
  const m = rgb.match(/rgba?\(([^)]+)\)/i);
  if (!m) return { r: 255, g: 255, b: 255 };
  const parts = m[1]
    .split(",")
    .map((x) => parseFloat(x.trim()))
    .filter((x) => !Number.isNaN(x));
  const [r, g, b] = parts as number[];
  return { r, g, b };
}

function relLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  // Convert sRGB to linear and compute luminance
  const toLin = (v: number) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const R = toLin(r);
  const G = toLin(g);
  const B = toLin(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export type SvgTheme = {
  strokeColor: string; // CSS color string
  bgColor: string; // CSS color string
  prefersReducedMotion: boolean;
};

export function useSvgTheme(): SvgTheme {
  const [colors, setColors] = useState<{ stroke: string; bg: string }>({
    stroke: "#0a0a0a",
    bg: "transparent",
  });

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const bodyStyles = window.getComputedStyle(document.body);
    const bg = bodyStyles.backgroundColor || "rgb(255,255,255)";
    const fgVar = getComputedStyle(document.documentElement).getPropertyValue("--color-foreground");
    const primaryVar = getComputedStyle(document.documentElement).getPropertyValue("--color-primary");

    const bgRGB = parseRGB(bg);
    const L = relLuminance(bgRGB);

    // Choose a contrasting stroke: use CSS variables when available, fallback to black/white
    let stroke = "#0a0a0a";
    if (fgVar) stroke = `hsl(${fgVar.trim()})`;
    if (primaryVar && L < 0.25) stroke = `hsl(${primaryVar.trim()})`;
    if (L > 0.6) stroke = "#0a0a0a"; // dark stroke on light bg
    if (L <= 0.6) stroke = "#e1f0f3"; // light stroke on dark bg (blue-12 fallback)

    setColors({ stroke, bg });

    // Update on theme changes via MutationObserver (class changes like .dark)
    const obs = new MutationObserver(() => {
      const bs = window.getComputedStyle(document.body);
      const nbg = bs.backgroundColor || bg;
      const nL = relLuminance(parseRGB(nbg));
      let nstroke = stroke;
      if (nL > 0.6) nstroke = "#0a0a0a";
      else nstroke = "#e1f0f3";
      setColors({ stroke: nstroke, bg: nbg });
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
    return () => obs.disconnect();
  }, []);

  return { strokeColor: colors.stroke, bgColor: colors.bg, prefersReducedMotion };
}

