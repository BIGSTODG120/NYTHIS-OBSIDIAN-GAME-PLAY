import { useAppStore } from "../core/store"
import type { GameCardData } from "../core/games"

interface GameCardProps { game: GameCardData }

export default function GameCard({ game }: GameCardProps) {
  const isLive = game.status === "LIVE"
  const setActiveScene = useAppStore((s) => s.setActiveScene)

  return (
    <button
      type="button"
      data-testid={`game-card-${game.id}`}
      className={`card ${isLive ? "card--live" : "card--forging"} ${game.isOriginal ? "card--original" : ""}`}
      aria-disabled={!isLive}
      aria-label={`${game.title} - ${isLive ? "play" : `coming in Pass ${game.pass}`}`}
      onClick={() => {
        if (!isLive) {
          console.info(`[hub] ${game.title} is being forged in Pass ${game.pass}.`)
          return
        }
        if (game.id === "pong")  { setActiveScene("pong");  return }
        if (game.id === "snake") { setActiveScene("snake"); return }
        if (game.id === "break") { setActiveScene("break"); return }
        if (game.id === "sweep") { setActiveScene("sweep"); return }
        if (game.id === "drift") { setActiveScene("drift"); return }
        if (game.id === "stack") { setActiveScene("stack"); return }
        if (game.id === "spire") { setActiveScene("spire"); return }
        console.info(`[hub] launching ${game.title}...`)
      }}
    >
      {game.isOriginal && <div className="card__star">ORIGINAL</div>}
      <div className="card__head">
        <div className="card__title">{game.title}</div>
        <div className="card__origin">{game.origin} <span className="card__year">- {game.originYear}</span></div>
      </div>
      <div className="card__upgrades">
        <div className="card__upgrade">{game.upgrades[0].label}</div>
        <div className="card__upgrade">{game.upgrades[1].label}</div>
      </div>
      <div className={`card__status ${isLive ? "card__status--live" : ""}`}>
        {isLive ? "PLAY" : `PASS ${game.pass} - FORGING`}
      </div>
    </button>
  )
}
