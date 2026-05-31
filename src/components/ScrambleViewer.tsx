import { useEffect, useRef } from "react";
import type { CubeEvent } from "../lib/types";

interface ScrambleViewerProps {
  scramble: string;
  event: CubeEvent;
}

// Maps WCA event IDs to cubing.js TwistyPlayer puzzle strings
const PUZZLE_MAP: Record<CubeEvent, string> = {
  "333":    "3x3x3",
  "222":    "2x2x2",
  "444":    "4x4x4",
  "555":    "5x5x5",
  "666":    "6x6x6",
  "777":    "7x7x7",
  "333bf":  "3x3x3",
  "333fm":  "3x3x3",
  "333oh":  "3x3x3",
  "333mbf": "3x3x3",
  "444bf":  "4x4x4",
  "555bf":  "5x5x5",
  "clock":  "clock",
  "minx":   "megaminx",
  "pyram":  "pyraminx",
  "skewb":  "skewb",
  "sq1":    "square1",
};

export function ScrambleViewer({ scramble, event }: ScrambleViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    import("cubing/twisty").then(({ TwistyPlayer }) => {
      if (cancelled || !container) return;

      container.innerHTML = "";

      const player = new TwistyPlayer({
        puzzle: PUZZLE_MAP[event] ?? "3x3x3",
        alg: scramble,
        hintFacelets: "none",
        background: "none",
        controlPanel: "none",
      });

      (player as unknown as HTMLElement).style.width = "100%";
      (player as unknown as HTMLElement).style.height = "100%";

      container.appendChild(player as unknown as Node);
    });

    return () => {
      cancelled = true;
      if (container) container.innerHTML = "";
    };
  }, [scramble, event]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-lg overflow-hidden"
    />
  );
}
