import { games } from "../core/games"
import GameCard from "./GameCard"

export default function GameGrid() {
  const classics = games.filter((g) => !g.isOriginal)
  const original = games.find((g) => g.isOriginal)

  return (
    <div className="grid">
      <div className="grid__classics">
        {classics.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </div>
      {original && (
        <div className="grid__original">
          <GameCard game={original} />
        </div>
      )}
    </div>
  )
}
