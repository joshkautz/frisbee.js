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
import { useStallCount } from "@/hooks";

/**
 * Screen reader announcer for game events.
 *
 * Uses an ARIA live region to announce:
 * - Score changes
 * - Phase transitions
 * - Possession changes
 * - Stall count status
 */
export const GameAnnouncer = memo(function GameAnnouncer() {
  const homeScore = useSimulationStore((s) => s.homeScore);
  const awayScore = useSimulationStore((s) => s.awayScore);
  const phase = useSimulationStore((s) => s.phase);
  const possession = useSimulationStore((s) => s.possession);
  const { count: stallCount, isActive: stallActive } = useStallCount();

  const prevHomeScore = useRef(homeScore);
  const prevAwayScore = useRef(awayScore);
  const prevPhase = useRef(phase);
  const prevPossession = useRef(possession);
  const prevStallActive = useRef(false);
  const prevStallCount = useRef(0);
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

    // Check for stalling state changes
    if (stallActive && !prevStallActive.current) {
      announcements.push("Defender marking. Stall count started.");
    } else if (!stallActive && prevStallActive.current) {
      announcements.push("Stall count stopped.");
    }

    // Announce high stall counts (7+) for urgency
    if (
      stallActive &&
      stallCount >= 7 &&
      stallCount !== prevStallCount.current
    ) {
      announcements.push(`Stall ${stallCount}!`);
    }

    // Update refs
    prevHomeScore.current = homeScore;
    prevAwayScore.current = awayScore;
    prevPhase.current = phase;
    prevPossession.current = possession;
    prevStallActive.current = stallActive;
    prevStallCount.current = stallCount;

    // Announce all messages
    if (announcementRef.current && announcements.length > 0) {
      announcementRef.current.textContent = announcements.join(" ");
    }
  }, [homeScore, awayScore, phase, possession, stallActive, stallCount]);

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
