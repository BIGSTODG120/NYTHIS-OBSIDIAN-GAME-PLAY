import GameGrid from "./GameGrid"

const BASE = import.meta.env.BASE_URL

export default function HubShell() {
  return (
    <div className="hub">
      <header className="hub__header">
        <div className="hub__brand">
          <img
            src={`${BASE}brand/logo.png`}
            alt=""
            className="hub__logo"
            aria-hidden="true"
          />
          <div className="hub__wordmark">
            <span className="hub__wordmark-accent">NYTHIS</span>
            <span className="hub__wordmark-divider">|</span>
            <span className="hub__wordmark-main">OBSIDIAN GAME PLAY</span>
          </div>
        </div>
        <div className="hub__tagline">THE CLASSICS, SHARPENED.</div>
      </header>

      <main className="hub__main">
        <GameGrid />
      </main>

      <footer className="hub__footer">
        MIT - Open Source - github.com/bigstodg/nythis-obsidian-game-play
      </footer>
    </div>
  )
}
