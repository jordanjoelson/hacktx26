"use client";

import { useEffect, useRef } from "react";
import rough from "roughjs";
import type { RoughSVG } from "roughjs/bin/svg";

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
