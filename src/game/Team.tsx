import { Player } from "./Player";

const PLAYERS_PER_TEAM = 7;
const FIELD_WIDTH = 37;

interface TeamProps {
  color: number;
  startZ: number;
}

export function Team({ color, startZ }: TeamProps) {
  // Spread players evenly across the width of the field (X axis)
  const spacing = FIELD_WIDTH / (PLAYERS_PER_TEAM + 1);

  const players = Array.from({ length: PLAYERS_PER_TEAM }, (_, i) => {
    const x = -FIELD_WIDTH / 2 + spacing * (i + 1);
    return (
      <Player
        key={i}
        position={[x, 0, startZ]}
        color={color}
      />
    );
  });

  return <group>{players}</group>;
}
