"use client";

import { useEffect, useRef } from "react";
import rough from "roughjs";
import type { RoughSVG } from "roughjs/bin/svg";
import type { Options } from "roughjs/bin/core";

type Draw = (rc: RoughSVG) => SVGElement | SVGElement[];

/** An <svg> whose contents are drawn by Rough.js, so lines look sketched by hand. */
export function Rough({
  width,
  height,
  draw,
  seed = 1,
  redrawKey,
  className,
  style,
}: {
  width: number;
  height: number;
  draw: Draw;
  seed?: number;
  /** Change this to redraw (e.g. when a checkbox flips). */
  redrawKey?: string | number | boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const drawRef = useRef(draw);

  // Runs before the drawing effect below, so it always draws with the latest callback.
  useEffect(() => {
    drawRef.current = draw;
  });

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const rc = rough.svg(svg, { options: { seed } });
    const nodes = drawRef.current(rc);
    svg.replaceChildren(...(Array.isArray(nodes) ? nodes : [nodes]));
  }, [width, height, seed, redrawKey]);

  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className={className}
      style={style}
    />
  );
}

/** A curved hand-drawn arrow through `points`, with a two-stroke head at the end. */
export function roughArrow(rc: RoughSVG, points: [number, number][], options: Options = {}): SVGElement[] {
  const [x1, y1] = points[points.length - 2]!;
  const [x2, y2] = points[points.length - 1]!;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 12;
  const wing = (offset: number): [number, number] => [
    x2 - head * Math.cos(angle + offset),
    y2 - head * Math.sin(angle + offset),
  ];
  const opts = { roughness: 1.6, strokeWidth: 2.2, ...options };
  return [
    rc.curve(points, opts),
    rc.linearPath([wing(0.5), [x2, y2], wing(-0.5)], opts),
  ];
}
