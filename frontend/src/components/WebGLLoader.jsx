import { useEffect, useRef, useState, useCallback } from 'react'

// Pixel art character drawn on canvas 2D
const PIXEL = 4
const HAIR_COLOR = '#0066FF'
const FACE_COLOR = '#00AAFF'
const SKIN_COLOR = '#D4A574'
const GLOW_COLOR = 'rgba(0, 102, 255, 0.6)'
const BG_COLOR = '#050810'

// Head sprite (16x16 grid)
const HEAD = [
  '................',
  '....bbbbbbbb....',
  '...bbbbbbbbbb...',
  '..bBBbBBBBbBBb..',
  '..bBbBBBBBbBbB..',
  '.bBbBBBBBBBBbBb.',
  '.bbbbBBBBBBbbb..',
  '..ssssssssssss..',
  '..s..ssss..ss...',
  '..s........s....',
  '..s........s....',
  '..ss......ss....',
  '...sssssssss....',
  '....sssssss.....',
  '.....sssss......',
  '................',
]

const b = (c) => c === 'b'
const B = (c) => c === 'B'
const s = (c) => c === 's'

function drawPixelChar(ctx, cx, cy, scale, time, flicker) {
  const px = PIXEL * scale
  const ox = cx - (16 * px) / 2
  const oy = cy - (16 * px) / 2

  // glow behind
  const glowR = 40 * scale + Math.sin(time * 3) * 5
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR)
  grad.addColorStop(0, 'rgba(0,102,255,0.35)')
  grad.addColorStop(0.5, 'rgba(0,60,200,0.15)')
  grad.addColorStop(1, 'transparent')
  ctx.fillStyle = grad
  ctx.fillRect(cx - glowR, cy - glowR, glowR * 2, glowR * 2)

  for (let y = 0; y < HEAD.length; y++) {
    for (let x = 0; x < HEAD[y].length; x++) {
      const ch = HEAD[y][x]
      if (ch === '.') continue

      // flicker: randomly skip pixels
      if (flicker && Math.random() < 0.08) continue

      let color
      if (b(ch)) color = HAIR_COLOR
      else if (B(ch)) color = FACE_COLOR
      else if (s(ch)) color = SKIN_COLOR
      else continue

      ctx.fillStyle = color
      ctx.fillRect(ox + x * px, oy + y * px, px, px)
    }
  }

  // neon outline glow on hair pixels
  ctx.shadowColor = '#0066FF'
  ctx.shadowBlur = 8 * scale
  for (let y = 0; y < HEAD.length; y++) {
    for (let x = 0; x < HEAD[y].length; x++) {
      const ch = HEAD[y][x]
      if (b(ch)) {
        ctx.fillStyle = HAIR_COLOR
        ctx.fillRect(ox + x * px, oy + y * px, px, px)
      }
    }
  }
  ctx.shadowBlur = 0
}

function drawGlitchLine(ctx, w, h, time) {
  const count = 3 + Math.floor(Math.random() * 4)
  for (let i = 0; i < count; i++) {
    const y = Math.random() * h
    const lineH = 1 + Math.random() * 3
    const offset = (Math.random() - 0.5) * 20
    const alpha = 0.1 + Math.random() * 0.3
    ctx.fillStyle = `rgba(0,102,255,${alpha})`
    ctx.fillRect(offset, y, w, lineH)
  }
}

function drawScanlines(ctx, w, h, time) {
  ctx.fillStyle = 'rgba(0,0,0,0.04)'
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1)
  }
}

export default function WebGLLoader({ onComplete }) {
  const canvasRef = useRef(null)
  const [fadeOut, setFadeOut] = useState(false)
  const doneRef = useRef(false)

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    setFadeOut(true)
    setTimeout(() => onComplete?.(), 700)
  }, [onComplete])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) { finish(); return }

    let w, h
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const start = performance.now()
    let raf
    const TOTAL = 3.5

    const draw = () => {
      const elapsed = (performance.now() - start) / 1000
      const p = elapsed / TOTAL

      // reset transform
      ctx.setTransform(Math.min(window.devicePixelRatio, 2), 0, 0, Math.min(window.devicePixelRatio, 2), 0, 0)

      // clear
      ctx.fillStyle = BG_COLOR
      ctx.fillRect(0, 0, w, h)

      const cx = w / 2
      const cy = h / 2

      if (p < 0.45) {
        // ─── PHASE 1: Character appears, bobs, glitches ───
        const phase1 = p / 0.45
        const scale = Math.min(1, phase1 * 1.5)
        const bobY = Math.sin(elapsed * 4) * 6
        const flickerOn = Math.sin(elapsed * 12) > -0.3

        drawPixelChar(ctx, cx, cy + bobY, scale, elapsed, flickerOn)
        drawGlitchLine(ctx, w, h, elapsed)

        // occasional full-screen glitch flash
        if (Math.random() < 0.03) {
          ctx.fillStyle = 'rgba(0,102,255,0.08)'
          ctx.fillRect(0, 0, w, h)
        }

      } else if (p < 0.55) {
        // ─── PHASE 2: Glitch transition (white flash) ───
        const phase2 = (p - 0.45) / 0.1
        const flash = Math.sin(phase2 * Math.PI)

        // white flash
        ctx.fillStyle = `rgba(255,255,255,${flash * 0.9})`
        ctx.fillRect(0, 0, w, h)

        // glitch lines during flash
        if (Math.random() < 0.5) {
          drawGlitchLine(ctx, w, h, elapsed)
        }

        // character fading out
        if (phase2 < 0.7) {
          const bobY = Math.sin(elapsed * 4) * 6
          ctx.globalAlpha = 1 - phase2
          drawPixelChar(ctx, cx, cy + bobY, 1, elapsed, true)
          ctx.globalAlpha = 1
        }

      } else if (p < 0.85) {
        // ─── PHASE 3: Brand text on dark ───
        const phase3 = (p - 0.55) / 0.3
        const textAlpha = Math.min(1, phase3 * 3)

        ctx.globalAlpha = textAlpha

        // logo box
        const boxW = 260
        const boxH = 80
        const boxX = cx - boxW / 2
        const boxY = cy - boxH / 2

        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        ctx.shadowColor = '#0066FF'
        ctx.shadowBlur = 30
        roundRect(ctx, boxX, boxY, boxW, boxH, 12)
        ctx.fill()
        ctx.shadowBlur = 0

        // "S" icon
        ctx.fillStyle = '#1D9E75'
        roundRect(ctx, boxX + 20, boxY + 16, 48, 48, 10)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.font = "bold 26px 'Space Grotesk', sans-serif"
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('S', boxX + 44, boxY + 40)

        // text
        ctx.fillStyle = '#111'
        ctx.font = "700 22px 'Space Grotesk', sans-serif"
        ctx.textAlign = 'left'
        ctx.fillText('Schema', boxX + 80, boxY + 32)
        ctx.fillStyle = '#1D9E75'
        ctx.fillText('Morph', boxX + 158, boxY + 32)
        ctx.fillStyle = '#111'
        ctx.fillText(' AI', boxX + 222, boxY + 32)

        ctx.fillStyle = '#666'
        ctx.font = "400 11px 'Inter', sans-serif"
        ctx.fillText('Graph-first microservice discovery', boxX + 80, boxY + 54)

        // subtle glitch on text
        if (Math.random() < 0.08) {
          ctx.fillStyle = 'rgba(0,102,255,0.15)'
          ctx.fillRect(boxX, boxY + Math.random() * boxH, boxW, 2)
        }

        ctx.globalAlpha = 1
        drawScanlines(ctx, w, h, elapsed)

      } else {
        // ─── PHASE 4: Fade out ───
        const phase4 = (p - 0.85) / 0.15
        const fade = 1 - phase4

        ctx.globalAlpha = fade

        const boxW = 260
        const boxH = 80
        const boxX = cx - boxW / 2
        const boxY = cy - boxH / 2

        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        ctx.shadowColor = '#0066FF'
        ctx.shadowBlur = 30
        roundRect(ctx, boxX, boxY, boxW, boxH, 12)
        ctx.fill()
        ctx.shadowBlur = 0

        ctx.fillStyle = '#1D9E75'
        roundRect(ctx, boxX + 20, boxY + 16, 48, 48, 10)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.font = "bold 26px 'Space Grotesk', sans-serif"
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('S', boxX + 44, boxY + 40)

        ctx.fillStyle = '#111'
        ctx.font = "700 22px 'Space Grotesk', sans-serif"
        ctx.textAlign = 'left'
        ctx.fillText('Schema', boxX + 80, boxY + 32)
        ctx.fillStyle = '#1D9E75'
        ctx.fillText('Morph', boxX + 158, boxY + 32)
        ctx.fillStyle = '#111'
        ctx.fillText(' AI', boxX + 222, boxY + 32)

        ctx.fillStyle = '#666'
        ctx.font = "400 11px 'Inter', sans-serif"
        ctx.fillText('Graph-first microservice discovery', boxX + 80, boxY + 54)

        ctx.globalAlpha = 1
      }

      if (elapsed >= TOTAL) { finish(); return }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [finish])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: '#000',
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.7s ease-out',
      pointerEvents: fadeOut ? 'none' : 'auto',
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  )
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
