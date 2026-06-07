import { useCallback, useEffect, useRef, useState } from "react";
import type { MatchN, Solve, SyncMessage } from "../../domain/types";
import { computeMatch } from "../../domain/match/computeMatch";
import type { MatchSyncHandler } from "../connection/syncProtocol";
import type { OpponentState } from "../../domain/types";

export interface UseRoomMatchOptions {
  opponent: OpponentState;
  sendSync: (msg: SyncMessage) => void;
}

export function useRoomMatch({ opponent, sendSync }: UseRoomMatchOptions) {
  const [matchN, setMatchN] = useState<MatchN>(3);
  const [myMatchTimes, setMyMatchTimes] = useState<(number | null)[]>([]);
  const [oppMatchTimes, setOppMatchTimes] = useState<(number | null)[]>([]);
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);
  const [myLastTime, setMyLastTime] = useState<number | null>(null);
  const [myFinished, setMyFinished] = useState(false);

  const prevOppSolveCountRef = useRef(0);

  const handleMatchSync = useCallback<MatchSyncHandler>((msg) => {
    if (msg.type === "MATCH_CONFIG") {
      setMatchN(msg.n as MatchN);
    }
    setMyMatchTimes([]);
    setOppMatchTimes([]);
    setCelebrationDismissed(false);
    prevOppSolveCountRef.current = 0;
  }, []);

  const { roundResults, myWins, oppWins, matchWinner } = computeMatch(
    matchN,
    myMatchTimes,
    oppMatchTimes
  );
  const matchOver = matchWinner !== null;

  useEffect(() => {
    if (opponent.solveCount > prevOppSolveCountRef.current) {
      prevOppSolveCountRef.current = opponent.solveCount;
      if (!matchOver) {
        setOppMatchTimes((prev) => [...prev, opponent.latestTime]);
      }
    }
  }, [opponent.solveCount, opponent.latestTime, matchOver]);

  const showCelebration =
    matchOver && !celebrationDismissed && opponent.connected;

  const recordSolve = useCallback(
    (solve: Solve) => {
      setMyLastTime(solve.finalTimeMs);
      setMyFinished(true);
      setTimeout(() => setMyFinished(false), 30_000);
      if (!matchOver) {
        setMyMatchTimes((prev) => [...prev, solve.finalTimeMs]);
      }
    },
    [matchOver]
  );

  const handleSetMatchN = useCallback(
    (n: MatchN) => {
      setMatchN(n);
      setMyMatchTimes([]);
      setOppMatchTimes([]);
      setCelebrationDismissed(false);
      prevOppSolveCountRef.current = 0;
      sendSync({ type: "MATCH_CONFIG", n });
    },
    [sendSync]
  );

  const handleResetMatch = useCallback(() => {
    setMyMatchTimes([]);
    setOppMatchTimes([]);
    setCelebrationDismissed(false);
    prevOppSolveCountRef.current = 0;
    sendSync({ type: "MATCH_RESET" });
  }, [sendSync]);

  const dismissCelebration = useCallback(() => {
    setCelebrationDismissed(true);
  }, []);

  const resetCelebrationOnPlayAgain = useCallback(() => {
    handleResetMatch();
    setCelebrationDismissed(false);
  }, [handleResetMatch]);

  return {
    matchN,
    myWins,
    oppWins,
    roundResults,
    matchWinner,
    matchOver,
    myLastTime,
    myFinished,
    showCelebration,
    myPendingRound: myMatchTimes.length > oppMatchTimes.length,
    oppPendingRound: oppMatchTimes.length > myMatchTimes.length,
    hasMatchProgress:
      myMatchTimes.length > 0 || oppMatchTimes.length > 0,
    handleMatchSync,
    recordSolve,
    handleSetMatchN,
    handleResetMatch,
    dismissCelebration,
    resetCelebrationOnPlayAgain,
  };
}