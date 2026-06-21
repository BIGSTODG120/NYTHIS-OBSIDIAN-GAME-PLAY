import { useAppStore } from "./core/store"
import HubShell from "./ui/HubShell"
import CosmicCanvas from "./ui/CosmicCanvas"
import PongRoot from "./scenes/pong"
import SnakeRoot from "./scenes/snake"
import BreakRoot from "./scenes/break"
import SweepRoot from "./scenes/sweep"
import DriftRoot from "./scenes/drift"
import StackRoot from "./scenes/stack"
import SpireRoot from "./scenes/spire"

export default function App() {
  const activeScene = useAppStore((s) => s.activeScene)

  let scene
  if (activeScene === "pong") scene = <PongRoot />
  else if (activeScene === "snake") scene = <SnakeRoot />
  else if (activeScene === "break") scene = <BreakRoot />
  else if (activeScene === "sweep") scene = <SweepRoot />
  else if (activeScene === "drift") scene = <DriftRoot />
  else if (activeScene === "stack") scene = <StackRoot />
  else if (activeScene === "spire") scene = <SpireRoot />
  else scene = <HubShell />

  return (
    <>
      <CosmicCanvas />
      {scene}
    </>
  )
}
