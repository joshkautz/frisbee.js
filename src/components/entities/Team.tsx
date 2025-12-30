import { memo, useMemo } from "react";
import { ECS, homePlayers, awayPlayers } from "@/ecs";
import type { TeamProps } from "@/types";
import { Player } from "./Player";

export const Team = memo(function Team({ team, color }: TeamProps) {
  // Use the appropriate pre-defined query based on team
  const query = useMemo(
    () => (team === "home" ? homePlayers : awayPlayers),
    [team]
  );

  return (
    <group>
      {/* ECS.Entities automatically subscribes to entity changes - no polling! */}
      <ECS.Entities in={query}>
        {(entity) => <Player key={entity.id} entity={entity} color={color} />}
      </ECS.Entities>
    </group>
  );
});
