"use client";

import React from "react";
import { useSvgTheme } from "@/hooks/useSvgTheme";
import Link from "next/link";
// We load the SVG markup at runtime to style internals without SVGR

// Loads the SVG markup at runtime and injects it so we can style internal paths.
type Props = { size?: number; className?: string; interactive?: boolean };

export default function EpiLogo({ size = 40, className, interactive = true }: Props) {
  const { strokeColor, prefersReducedMotion } = useSvgTheme();
  const [svgMarkup, setSvgMarkup] = React.useState<string>("");
  const [isLoaded, setIsLoaded] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const strokeWidth = Math.max(0.2, (size / 300) * 0.6);
  const rafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    let mounted = true;
    fetch("/images/logo.svg")
      .then((r) => r.text())
      .then((txt) => {
        if (!mounted) return;
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(txt, "image/svg+xml");
          const svgElement = doc.documentElement;
          const path = doc.getElementById("path0");

          if (path) {
            const d = path.getAttribute("d") || "";
            const match = d.match(/M\s*182\.148/);
            if (match && match.index !== undefined) {
              const idx = match.index;
              const newD = d.substring(idx); // strip outer square subpath
              path.setAttribute("d", newD);
            }
          }

          // Crop the viewBox by 30% on all sides to remove outer border
          const originalViewBox = svgElement.getAttribute("viewBox") || "0, 0, 400, 400";
          const [x, y, width, height] = originalViewBox.split(/[,\s]+/).map(Number);
          const cropAmount = 0.3; // 30% crop
          const newX = x + (width * cropAmount / 2);
          const newY = y + (height * cropAmount / 2);
          const newWidth = width * (1 - cropAmount);
          const newHeight = height * (1 - cropAmount);
          svgElement.setAttribute("viewBox", `${newX} ${newY} ${newWidth} ${newHeight}`);

          // No gradient injection; animation will be handled via CSS color pulse
          if (false) {
            const svgEl = svgElement;
            svgEl.setAttribute(
              "class",
              `${svgEl.getAttribute("class") || ""} use-gradient`.trim()
            );
            let defs = doc.querySelector("defs");
            if (!defs) {
              defs = doc.createElementNS("http://www.w3.org/2000/svg", "defs");
              svgEl.insertBefore(defs, svgEl.firstChild);
            }
            const grad = doc.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
            grad.setAttribute("id", "epilogo-stroke-gradient");
            grad.setAttribute("x1", "0.1");
            grad.setAttribute("y1", "0.9");
            grad.setAttribute("x2", "0.9");
            grad.setAttribute("y2", "0.1");
            grad.setAttribute("gradientUnits", "objectBoundingBox");
            grad.setAttribute("gradientTransform", "translate(-200, -50)");
            grad.setAttribute("spreadMethod", "repeat");

            const stop1 = doc.createElementNS("http://www.w3.org/2000/svg", "stop");
            stop1.setAttribute("offset", "0%");
            stop1.setAttribute("stop-color", "#eaf6fbff");
            const stopMid = doc.createElementNS("http://www.w3.org/2000/svg", "stop");
            stopMid.setAttribute("offset", "20%");
            stopMid.setAttribute("stop-color", strokeColor || "#e1f0f3");
            const stop2 = doc.createElementNS("http://www.w3.org/2000/svg", "stop");
            stop2.setAttribute("offset", "60%");
            stop2.setAttribute("stop-color", "#edf4feff");

            grad.appendChild(stop1);
            grad.appendChild(stopMid);
            grad.appendChild(stop2);
            defs.appendChild(grad);
          }

          const serializer = new XMLSerializer();
          const svgStr = serializer.serializeToString(doc.documentElement);
          setSvgMarkup(svgStr);
          setIsLoaded(true);
        } catch {
          setSvgMarkup(txt);
          setIsLoaded(true);
        }
      })
      .catch(() => {
        // non-critical
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Animate the gradient (3s loop) diagonally if present and motion allowed
  React.useEffect(() => {
    if (prefersReducedMotion) return;
    const container = containerRef.current;
    if (!container) return;
    const grad = container.querySelector<SVGLinearGradientElement>("#epilogo-stroke-gradient");
    if (!grad) return;

    const duration = 300000; // ms
    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const t = ((ts - start) % duration) / duration; // 0..9
      // Move steadily; repeat spreadMethod creates seamless loop
      const dx = t; // 0 -> 1
      const dy = -t; // 0 -> -1
      grad.setAttribute("gradientTransform", `translate(${dx.toFixed(3)}, ${dy.toFixed(3)})`);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [prefersReducedMotion, svgMarkup]);

  return interactive ? (
    <Link
      href="/"
      aria-label="Epi:Logos Home"
      className={className ?? "fixed top-3 left-3 z-50 select-none"}
      style={{
        ["--logo-stroke" as any]: strokeColor,
        ["--logo-stroke-start" as any]: "#122036",
        ["--logo-stroke-end" as any]: strokeColor,
        ["--logo-stroke-width" as any]: strokeWidth,
        width: size,
        height: size,
      }}
    >
      <div
        ref={containerRef}
        className="block"
        role="img"
        aria-hidden={false}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
      <style jsx>{`
        /* Ensure the SVG scales and uses current theme colors */
        :global(svg#svg) {
          display: block;
          width: 100% !important;
          height: 100% !important;
          opacity: ${'${isLoaded ? 1 : 0}'};
          transition: opacity 180ms ease-out;
        }
        /* Remove fills to avoid embedded background blocks; draw outlines using theme color */
        :global(svg#svg path),
        :global(svg#svg rect),
        :global(svg#svg circle),
        :global(svg#svg polygon),
        :global(svg#svg polyline) {
          fill: none !important;
          stroke: var(--logo-stroke);
          stroke-width: var(--logo-stroke-width);
          stroke-linecap: round;
          stroke-linejoin: round;
          shape-rendering: geometricPrecision;
          animation: ${prefersReducedMotion ? 'none' : 'strokePulse 3s ease-in-out infinite'};
        }
        @keyframes strokePulse {
          0% { stroke: var(--logo-stroke-start); }
          20% { stroke: var(--logo-stroke-end); }
          100% { stroke: var(--logo-stroke-start); }
        }
      `}</style>
    </Link>
  ) : (
    <div
      aria-label="Epi:Logos Logo"
      className={className ?? "select-none"}
      style={{
        ["--logo-stroke" as any]: strokeColor,
        ["--logo-stroke-start" as any]: "#d8d8d8ff",
        ["--logo-stroke-end" as any]: strokeColor,
        ["--logo-stroke-width" as any]: strokeWidth,
        width: size,
        height: size,
      }}
    >
      <div
        ref={containerRef}
        className="block"
        role="img"
        aria-hidden={false}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
      <style jsx>{`
        :global(svg#svg) {
          display: block;
          width: 100% !important;
          height: 100% !important;
        }
        :global(svg#svg path),
        :global(svg#svg rect),
        :global(svg#svg circle),
        :global(svg#svg polygon),
        :global(svg#svg polyline) {
          fill: none !important;
          stroke: var(--logo-stroke);
          stroke-width: var(--logo-stroke-width);
          stroke-linecap: round;
          stroke-linejoin: round;
          shape-rendering: geometricPrecision;
          animation: ${prefersReducedMotion ? 'none' : 'strokePulse 3s ease-in-out infinite'};
        }
        @keyframes strokePulse {
          0% { stroke: var(--logo-stroke-start); }
          50% { stroke: var(--logo-stroke-end); }
          100% { stroke: var(--logo-stroke-start); }
        }
      `}</style>
    </div>
  );
}
