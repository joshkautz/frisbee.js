import { PLAYERS_PER_TEAM, FIELD_WIDTH } from "@/constants";
import type { TeamProps } from "@/types";
import { Player } from "./Player";

export function Team({ color, startZ }: TeamProps) {
  const spacing = FIELD_WIDTH / (PLAYERS_PER_TEAM + 1);

  return (
    <group>
      {Array.from({ length: PLAYERS_PER_TEAM }, (_, i) => {
        const x = -FIELD_WIDTH / 2 + spacing * (i + 1);
        return <Player key={i} position={[x, 0, startZ]} color={color} />;
      })}
    </group>
  );
}
