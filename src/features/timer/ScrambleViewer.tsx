import { useEffect, useRef } from "react";
import type { CubeEvent } from "../../domain/types";

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

      // Safe: clearing the container before appending a new TwistyPlayer node
      container.textContent = "";

      const puzzle = (PUZZLE_MAP[event] ?? "3x3x3") as "3x3x3";
      const player = new TwistyPlayer({
        puzzle,
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
      // Safe cleanup: removes the cubing.js web component
      if (container) container.textContent = "";
    };
  }, [scramble, event]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div
        ref={containerRef}
        className="h-full aspect-square rounded-lg overflow-hidden"
      />
    </div>
  );
}
