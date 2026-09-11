"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import DottedMap from "dotted-map";

interface Dot {
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
}

const map = new DottedMap({ height: 100, grid: "diagonal" });
// Static (light-mode only, per the app's design tokens); computed once at
// module scope so it isn't rebuilt on every render/re-mount.
const SVG_MAP = map.getSVG({
  radius: 0.22,
  color: "#00000030",
  shape: "circle",
  backgroundColor: "transparent",
});
const MAP_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(SVG_MAP)}`;

function projectPoint(lat: number, lng: number) {
  return { x: (lng + 180) * (800 / 360), y: (90 - lat) * (400 / 180) };
}

function curvedPath(start: { x: number; y: number }, end: { x: number; y: number }) {
  const midX = (start.x + end.x) / 2;
  const midY = Math.min(start.y, end.y) - 50;
  return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
}

/** Decorative world map with animated flight paths, the auth hero's
 * background. `dots` are drawn once, in order, with a staggered delay. */
export function WorldMap({ dots, lineColor = "#9933ff" }: { dots: Dot[]; lineColor?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  return (
    <div className="relative aspect-[2/1] w-full">
      {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URI, not an optimizable asset */}
      <img
        src={MAP_DATA_URI}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none h-full w-full select-none [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)]"
      />
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
      >
        <defs>
          <linearGradient id="auth-map-path" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0" />
            <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {dots.map((dot, i) => {
          const start = projectPoint(dot.start.lat, dot.start.lng);
          const end = projectPoint(dot.end.lat, dot.end.lng);
          return (
            <motion.path
              key={`path-${i}`}
              d={curvedPath(start, end)}
              fill="none"
              stroke="url(#auth-map-path)"
              strokeWidth={1}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.5 * i, ease: "easeOut" }}
            />
          );
        })}

        {dots.map((dot, i) => (
          <g key={`points-${i}`}>
            {[dot.start, dot.end].map((p, j) => {
              const { x, y } = projectPoint(p.lat, p.lng);
              return (
                <g key={j}>
                  <circle cx={x} cy={y} r={2} fill={lineColor} />
                  <circle cx={x} cy={y} r={2} fill={lineColor} opacity={0.5}>
                    <animate attributeName="r" from="2" to="8" dur="1.5s" begin={`${0.5 * i}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" begin={`${0.5 * i}s`} repeatCount="indefinite" />
                  </circle>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}
