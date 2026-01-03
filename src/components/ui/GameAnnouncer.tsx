/**
 * Game event announcer for screen readers.
 *
 * Announces game events (scores, turnovers, phase changes) using
 * ARIA live regions for accessibility.
 *
 * @module components/ui/GameAnnouncer
 */

import { memo, useEffect, useRef } from "react";
import { useSimulationStore } from "@/stores";

/**
 * Screen reader announcer for game events.
 *
 * Uses an ARIA live region to announce:
 * - Score changes
 * - Phase transitions
 * - Possession changes
 */
export const GameAnnouncer = memo(function GameAnnouncer() {
  const homeScore = useSimulationStore((s) => s.homeScore);
  const awayScore = useSimulationStore((s) => s.awayScore);
  const phase = useSimulationStore((s) => s.phase);
  const possession = useSimulationStore((s) => s.possession);

  const prevHomeScore = useRef(homeScore);
  const prevAwayScore = useRef(awayScore);
  const prevPhase = useRef(phase);
  const prevPossession = useRef(possession);
  const announcementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const announcements: string[] = [];

    // Check for score changes
    if (homeScore > prevHomeScore.current) {
      announcements.push(
        `Home team scores! Score is now Home ${homeScore}, Away ${awayScore}.`
      );
    }
    if (awayScore > prevAwayScore.current) {
      announcements.push(
        `Away team scores! Score is now Home ${homeScore}, Away ${awayScore}.`
      );
    }

    // Check for phase changes
    if (phase !== prevPhase.current) {
      const phaseMessages: Record<string, string> = {
        pull: "Pull phase: Disc being thrown into play.",
        playing: "Game in progress.",
        turnover: "Turnover! Possession has changed.",
        score: "Touchdown!",
      };
      if (phaseMessages[phase] && phase !== "score") {
        // Score already announced above
        announcements.push(phaseMessages[phase]);
      }
    }

    // Check for possession changes (not during score phase)
    if (possession !== prevPossession.current && phase === "playing") {
      const team = possession === "home" ? "Home" : "Away";
      announcements.push(`${team} team now has possession.`);
    }

    // Update refs
    prevHomeScore.current = homeScore;
    prevAwayScore.current = awayScore;
    prevPhase.current = phase;
    prevPossession.current = possession;

    // Announce all messages
    if (announcementRef.current && announcements.length > 0) {
      announcementRef.current.textContent = announcements.join(" ");
    }
  }, [homeScore, awayScore, phase, possession]);

  return (
    <div
      ref={announcementRef}
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0,
      }}
    />
  );
});
