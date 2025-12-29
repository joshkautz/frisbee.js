import { Player } from "./Player";

const PLAYERS_PER_TEAM = 7;
const FIELD_WIDTH = 37;
const PLAYER_HEIGHT = 0.5;

interface TeamProps {
  color: number;
  startX: number;
}

export function Team({ color, startX }: TeamProps) {
  // Spread players evenly across the width of the field
  const spacing = FIELD_WIDTH / (PLAYERS_PER_TEAM + 1);

  const players = Array.from({ length: PLAYERS_PER_TEAM }, (_, i) => {
    const z = -FIELD_WIDTH / 2 + spacing * (i + 1);
    return (
      <Player
        key={i}
        position={[startX, PLAYER_HEIGHT / 2, z]}
        color={color}
      />
    );
  });

  return <group>{players}</group>;
}
