import { useEffect, useRef } from 'react'

type StarCol = 'w' | 'v' | 'c'
interface Star { x: number; y: number; r: number; a: number; tw: number; vx: number; vy: number; col: StarCol }
interface Streak { x: number; y: number; len: number; vx: number; vy: number; life: number; max: number }

const colorOf = (c: StarCol, a: number): string => {
  if (c === 'v') return `rgba(183, 138, 255, ${a})`
  if (c === 'c') return `rgba(140, 200, 255, ${a})`
  return `rgba(245, 243, 255, ${a})`
}

export default function CosmicCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    let raf = 0
    let W = 0, H = 0
    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    let far: Star[] = []
    let mid: Star[] = []
    let near: Star[] = []
    let streaks: Streak[] = []
    let phase = 0
    let last = performance.now()
    let running = true

    const rand = (a: number, b: number) => a + Math.random() * (b - a)

    const seed = () => {
      far = []; mid = []; near = []; streaks = []
      const density = (W * H) / (1280 * 720)
      const nFar = Math.floor(500 * density)
      const nMid = Math.floor(220 * density)
      const nNear = Math.floor(80 * density)
      for (let i = 0; i < nFar; i++) {
        far.push({ x: Math.random() * W, y: Math.random() * H, r: rand(0.4, 1.0), a: rand(0.5, 0.9), tw: 0, vx: rand(-0.003, 0.003), vy: rand(-0.001, 0.001), col: 'w' })
      }
      for (let i = 0; i < nMid; i++) {
        const roll = Math.random()
        const col: StarCol = roll < 0.25 ? 'v' : roll < 0.35 ? 'c' : 'w'
        mid.push({ x: Math.random() * W, y: Math.random() * H, r: rand(0.9, 1.8), a: rand(0.7, 1.0), tw: Math.random() * Math.PI * 2, vx: rand(-0.012, 0.012), vy: rand(-0.005, 0.005), col })
      }
      for (let i = 0; i < nNear; i++) {
        const col: StarCol = Math.random() < 0.4 ? 'v' : 'w'
        near.push({ x: Math.random() * W, y: Math.random() * H, r: rand(1.8, 3.2), a: rand(0.85, 1.0), tw: Math.random() * Math.PI * 2, vx: rand(-0.04, 0.04), vy: rand(-0.015, 0.015), col })
      }
    }

    const resize = () => {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = Math.floor(W * DPR)
      canvas.height = Math.floor(H * DPR)
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      seed()
    }

    const draw = (t: number) => {
      if (!running) return
      const dt = Math.min(t - last, 80)
      last = t
      phase += dt * 0.00003

      // Deep obsidian-violet base (visible, not pure black)
      ctx.fillStyle = '#0a0612'
      ctx.fillRect(0, 0, W, H)

      // Nebula 1 - PRIMARY violet (DOMINANT)
      const cx1 = W * (0.3 + Math.sin(phase) * 0.15)
      const cy1 = H * (0.4 + Math.cos(phase * 1.3) * 0.15)
      const g1 = ctx.createRadialGradient(cx1, cy1, 0, cx1, cy1, W * 0.7)
      g1.addColorStop(0, 'rgba(150, 95, 240, 0.55)')
      g1.addColorStop(0.3, 'rgba(130, 80, 220, 0.32)')
      g1.addColorStop(0.6, 'rgba(80, 50, 160, 0.14)')
      g1.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g1
      ctx.fillRect(0, 0, W, H)

      // Nebula 2 - CYAN ember
      const cx2 = W * (0.78 + Math.cos(phase * 0.9) * 0.18)
      const cy2 = H * (0.62 + Math.sin(phase * 1.1) * 0.18)
      const g2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, W * 0.6)
      g2.addColorStop(0, 'rgba(70, 150, 230, 0.4)')
      g2.addColorStop(0.4, 'rgba(50, 110, 190, 0.18)')
      g2.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g2
      ctx.fillRect(0, 0, W, H)

      // Nebula 3 - violet bloom anchor
      const cx3 = W * (0.5 + Math.sin(phase * 1.7) * 0.12)
      const cy3 = H * (0.22 + Math.cos(phase * 0.7) * 0.12)
      const g3 = ctx.createRadialGradient(cx3, cy3, 0, cx3, cy3, W * 0.4)
      g3.addColorStop(0, 'rgba(210, 170, 255, 0.42)')
      g3.addColorStop(0.5, 'rgba(170, 120, 240, 0.16)')
      g3.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g3
      ctx.fillRect(0, 0, W, H)

      // PRIMARY galaxy spiral - bottom-left, BRIGHT
      ctx.save()
      ctx.translate(W * 0.18, H * 0.78)
      ctx.rotate(phase * 0.4)
      for (let s = 0; s < 160; s++) {
        const ang = s * 0.42
        const rad = s * 0.95
        const alpha = (1 - s / 160) * 0.7
        ctx.fillStyle = `rgba(210, 170, 255, ${alpha})`
        ctx.beginPath()
        ctx.arc(Math.cos(ang) * rad, Math.sin(ang) * rad, 1.2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()

      // SECONDARY spiral - top-right, counter-rotating
      ctx.save()
      ctx.translate(W * 0.85, H * 0.18)
      ctx.rotate(-phase * 0.5)
      for (let s = 0; s < 100; s++) {
        const ang = s * 0.5
        const rad = s * 0.7
        const alpha = (1 - s / 100) * 0.6
        ctx.fillStyle = `rgba(170, 210, 255, ${alpha})`
        ctx.beginPath()
        ctx.arc(Math.cos(ang) * rad, Math.sin(ang) * rad, 1.0, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()

      // Far stars
      for (const s of far) {
        s.x += s.vx * dt; s.y += s.vy * dt
        if (s.x < 0) s.x += W; if (s.x > W) s.x -= W
        if (s.y < 0) s.y += H; if (s.y > H) s.y -= H
        ctx.fillStyle = `rgba(245, 243, 255, ${s.a})`
        ctx.fillRect(s.x, s.y, s.r, s.r)
      }

      // Mid stars with twinkle
      for (const s of mid) {
        s.x += s.vx * dt; s.y += s.vy * dt
        s.tw += dt * 0.003
        if (s.x < 0) s.x += W; if (s.x > W) s.x -= W
        if (s.y < 0) s.y += H; if (s.y > H) s.y -= H
        const a = s.a * (0.7 + Math.sin(s.tw) * 0.3)
        ctx.fillStyle = colorOf(s.col, a)
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Near stars with glow halo
      for (const s of near) {
        s.x += s.vx * dt; s.y += s.vy * dt
        s.tw += dt * 0.005
        if (s.x < -5) s.x = W + 5; if (s.x > W + 5) s.x = -5
        if (s.y < -5) s.y = H + 5; if (s.y > H + 5) s.y = -5
        const a = s.a * (0.6 + Math.sin(s.tw) * 0.4)
        ctx.fillStyle = colorOf(s.col, a * 0.35)
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r * 3.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = colorOf(s.col, a)
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Light streaks
      if (Math.random() < 0.03) {
        streaks.push({ x: rand(-100, W * 0.6), y: rand(0, H * 0.6), len: rand(100, 220), vx: rand(0.4, 0.8), vy: rand(0.18, 0.35), life: 0, max: rand(700, 1400) })
      }
      for (let i = streaks.length - 1; i >= 0; i--) {
        const st = streaks[i]
        st.x += st.vx * dt; st.y += st.vy * dt
        st.life += dt
        const fade = 1 - st.life / st.max
        if (fade <= 0 || st.x > W + 200) { streaks.splice(i, 1); continue }
        const grad = ctx.createLinearGradient(st.x - st.len, st.y - st.len * 0.5, st.x, st.y)
        grad.addColorStop(0, 'rgba(183, 138, 255, 0)')
        grad.addColorStop(1, `rgba(245, 243, 255, ${fade})`)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(st.x - st.len, st.y - st.len * 0.5)
        ctx.lineTo(st.x, st.y)
        ctx.stroke()
      }

      raf = requestAnimationFrame(draw)
    }

    const onVisibility = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!running) {
        running = true
        last = performance.now()
        raf = requestAnimationFrame(draw)
      }
    }

    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)
    resize()
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
