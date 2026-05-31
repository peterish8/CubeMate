import type { CubeEvent } from "./types";

// cubing.js uses WCA event IDs directly — no mapping needed
export async function generateScramble(event: CubeEvent): Promise<string> {
  try {
    const { randomScrambleForEvent } = await import("cubing/scramble");
    const alg = await randomScrambleForEvent(event);
    return alg.toString();
  } catch (err) {
    console.warn("cubing.js scramble failed, using fallback", err);
    return generateFallbackScramble(event);
  }
}

// Fallback random-move scrambles per event family
function generateFallbackScramble(event: CubeEvent): string {
  const suffixes = ["", "'", "2"];
  const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  const configs: Partial<Record<CubeEvent, { moves: string[]; len: number }>> = {
    "333":    { moves: ["U","D","L","R","F","B"], len: 20 },
    "333oh":  { moves: ["U","D","L","R","F","B"], len: 20 },
    "333bf":  { moves: ["U","D","L","R","F","B"], len: 20 },
    "333fm":  { moves: ["U","D","L","R","F","B"], len: 20 },
    "333mbf": { moves: ["U","D","L","R","F","B"], len: 20 },
    "222":    { moves: ["U","L","F"], len: 11 },
    "444":    { moves: ["U","D","L","R","F","B","Uw","Dw","Lw","Rw","Fw","Bw"], len: 40 },
    "444bf":  { moves: ["U","D","L","R","F","B","Uw","Dw","Lw","Rw","Fw","Bw"], len: 40 },
    "555":    { moves: ["U","D","L","R","F","B","Uw","Dw","Lw","Rw","Fw","Bw"], len: 60 },
    "555bf":  { moves: ["U","D","L","R","F","B","Uw","Dw","Lw","Rw","Fw","Bw"], len: 60 },
    "666":    { moves: ["U","D","L","R","F","B","Uw","Dw","Lw","Rw","Fw","Bw","3Uw","3Dw"], len: 80 },
    "777":    { moves: ["U","D","L","R","F","B","Uw","Dw","Lw","Rw","Fw","Bw","3Uw","3Dw"], len: 100 },
    "pyram":  { moves: ["U","L","R","B","u","l","r","b"], len: 11 },
    "skewb":  { moves: ["U","L","R","B"], len: 11 },
    "minx":   { moves: ["U","R","D","L","F","BL","BR","DR","DL","B"], len: 70 },
    "sq1":    { moves: ["U","D"], len: 11 },
    "clock":  { moves: ["UR","UL","DR","DL","U","R","D","L","ALL"], len: 12 },
  };

  const cfg = configs[event] ?? { moves: ["U","D","L","R","F","B"], len: 20 };
  const result: string[] = [];
  let last = "";
  for (let i = 0; i < cfg.len; i++) {
    let face: string;
    do { face = rand(cfg.moves); } while (face === last);
    last = face;
    result.push(face + rand(suffixes));
  }
  return result.join(" ");
}
