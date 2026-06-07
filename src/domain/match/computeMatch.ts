import type { MatchN, RoundResult } from "../types";

export interface MatchState {
  roundResults: RoundResult[];
  myWins: number;
  oppWins: number;
  winsNeeded: number;
  matchWinner: "me" | "opponent" | null;
  /** Round index still in progress (both haven't submitted yet), or null if match over */
  currentRound: number;
}

function compareRound(
  myT: number | null,
  oppT: number | null
): "me" | "opponent" | "tie" {
  if (myT === null && oppT === null) return "tie";
  if (myT === null) return "opponent";
  if (oppT === null) return "me";
  if (myT < oppT) return "me";
  if (oppT < myT) return "opponent";
  return "tie";
}

export function computeMatch(
  n: MatchN,
  myTimes: (number | null)[],
  oppTimes: (number | null)[]
): MatchState {
  const winsNeeded = Math.ceil(n / 2);
  const rounds = Math.min(myTimes.length, oppTimes.length);
  const roundResults: RoundResult[] = [];
  let myWins = 0;
  let oppWins = 0;
  let matchWinner: "me" | "opponent" | null = null;

  for (let i = 0; i < rounds; i++) {
    if (matchWinner) break;
    const myT = myTimes[i];
    const oppT = oppTimes[i];
    const winner = compareRound(myT, oppT);
    roundResults.push({ round: i + 1, myTime: myT, oppTime: oppT, winner });
    if (winner === "me") myWins++;
    else if (winner === "opponent") oppWins++;
    if (myWins >= winsNeeded) matchWinner = "me";
    else if (oppWins >= winsNeeded) matchWinner = "opponent";
  }

  const currentRound = matchWinner ? roundResults.length : Math.max(myTimes.length, oppTimes.length) + 1;

  return { roundResults, myWins, oppWins, winsNeeded, matchWinner, currentRound };
}
