import { useEffect, useRef } from 'react'
import { useStore } from '../store'

const PARALLAX = [0.008, 0.028, 0.065, 0.115, 0.19]

function rnd(a, b) { return a + Math.random() * (b - a) }

function genNormPts(n, rng, sc) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    const r = (0.72 + rng[i] * 0.56) * sc
    const da = (rng[i + n] - 0.5) * (Math.PI / n * 0.85)
    return { x: r * Math.cos(a + da), y: r * Math.sin(a + da) * 0.74 }
  })
}

function blobPath(ctx, pts, ox, oy, rx, ry) {
  const n = pts.length, last = pts[n - 1]
  ctx.beginPath()
  ctx.moveTo(ox + (last.x + pts[0].x) * rx * 0.5, oy + (last.y + pts[0].y) * ry * 0.5)
  for (let i = 0; i < n; i++) {
    const c = pts[i], nx = pts[(i + 1) % n]
    ctx.quadraticCurveTo(ox + c.x * rx, oy + c.y * ry, ox + (c.x + nx.x) * rx * 0.5, oy + (c.y + nx.y) * ry * 0.5)
  }
  ctx.closePath()
}

function makeTrees(W, H) {
  const trees = [], N = 7, mob = W < 600
  for (let layer = 0; layer < 5; layer++) {
    const n = mob ? 4 + layer * 2 : 6 + layer * 3
    for (let i = 0; i < n; i++) {
      const spread = 1.14 + layer * 0.1
      const h = H * (0.18 + layer * 0.038) * (0.55 + Math.random() * 0.78)
      const w = h * (0.22 + Math.random() * 0.2)
      const mk = () => Array.from({ length: N * 2 }, () => Math.random())
      trees.push({
        x: (i / n) * W * spread - W * (spread - 1) / 2 + (Math.random() - 0.5) * 60,
        baseY: H * (0.53 + layer * 0.05), h, w, layer,
        phase: Math.random() * Math.PI * 2,
        speed: 0.00022 + Math.random() * 0.00032,
        lean: 0, leanTarget: 0,
        trunkOff: (Math.random() - 0.5) * 0.14,
        blob: [genNormPts(N, mk(), 1), genNormPts(N, mk(), 0.82), genNormPts(N, mk(), 0.64)],
        rootA: [Math.random() * 0.4 - 0.7, Math.random() * 0.4 + 0.3],
      })
    }
  }
  return trees
}

function makeMotes(W, H) {
  return Array.from({ length: W < 600 ? 16 : 32 }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    r: 0.4 + Math.random() * 1.1,
    vx: (Math.random() - 0.5) * 0.12, vy: -0.04 - Math.random() * 0.08,
    a: Math.random() * 0.3, phase: Math.random() * Math.PI * 2,
  }))
}

function makeStars(W, H) {
  return Array.from({ length: 120 }, () => ({
    x: Math.random() * W, y: Math.random() * H * 0.54,
    r: 0.18 + Math.random() * 0.9,
    twinkle: Math.random() * Math.PI * 2,
    sp: 0.35 + Math.random() * 1.4,
    bright: Math.random() > 0.92,
  }))
}

export function useForest(canvasRef) {
  // Live refs — updated each frame from store without re-running the effect
  const liveRef = useRef({
    screen: 'intro', depthVal: 0, aiLoading: false,
    myTrail: [], cameraZ: 0, cameraZStart: 0,
    cameraZTarget: 0, cameraZAnimTs: 0,
    mouseX: -999, mouseY: -999,
  })

  // Subscribe to store slices and keep liveRef in sync
  useEffect(() => useStore.subscribe(s => {
    const l = liveRef.current
    l.screen = s.screen
    l.depthVal = s.depthVal
    l.aiLoading = s.aiLoading
    l.myTrail = s.myTrail
    l.cameraZ = s.cameraZ
    l.cameraZStart = s.cameraZStart
    l.cameraZTarget = s.cameraZTarget
    l.cameraZAnimTs = s.cameraZAnimTs
  }), [])

  // Canvas state in a ref — never triggers re-render
  const canvasState = useRef({ trees: [], motes: [], stars: [], W: 0, H: 0, fogT: 0, rafId: null })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const cs = canvasState.current
    const live = liveRef.current
    const updateCameraZ = useStore.getState().updateCameraZ

    function resize() {
      cs.W = canvas.width = window.innerWidth
      cs.H = canvas.height = window.innerHeight
      cs.trees = makeTrees(cs.W, cs.H)
      cs.motes = makeMotes(cs.W, cs.H)
      cs.stars = makeStars(cs.W, cs.H)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', e => { live.mouseX = e.clientX; live.mouseY = e.clientY })

    function effPos(tree, ts) {
      const cz = live.cameraZ
      const breath = Math.sin(ts * 0.000082) * 0.004
      const z = cz + breath, pf = PARALLAX[tree.layer]
      const vpY = cs.H * 0.46
      return {
        x: tree.x + (tree.x - cs.W / 2) * z * pf,
        baseY: tree.baseY + Math.max(0, tree.baseY - vpY) * z * pf * 0.55,
        h: tree.h * (1 + z * pf * 1.6),
        w: tree.w * (1 + z * pf * 1.6),
      }
    }

    function drawTree(tree, sway, layer, pos) {
      const { W, H } = cs, f = 1 - layer * 0.1
      const isClr = live.screen === 'clearing'
      const base = isClr ? 18 + layer * 5 : 9 + layer * 4
      const [vr, vg, vb] = [base + 2, base + 6, base - 1]
      const rim = Math.max(0, 1 - live.depthVal * 1.6) * 18
      tree.lean += (tree.leanTarget - tree.lean) * 0.025
      const bx = pos.x + sway + tree.lean * 3
      const topX = pos.x + sway * 0.18 + tree.lean * 1.5
      const topY = pos.baseY - pos.h * 0.6
      const [crx, cry, to, tw] = [pos.w * 0.62, pos.h * 0.52, tree.trunkOff, pos.w * 0.14]
      ctx.beginPath()
      ctx.moveTo(bx - tw, pos.baseY)
      ctx.quadraticCurveTo(bx - tw * 0.5 + to * pos.w, pos.baseY - pos.h * 0.35, topX - tw * 0.2, topY + cry * 0.7)
      ctx.lineTo(topX + tw * 0.2, topY + cry * 0.7)
      ctx.quadraticCurveTo(bx + tw * 0.5 + to * pos.w, pos.baseY - pos.h * 0.35, bx + tw, pos.baseY)
      ctx.closePath()
      ctx.fillStyle = `rgba(${vr + 3},${vg},${vb},${0.80 * f})`; ctx.fill()
      tree.rootA.forEach((_, ri) => {
        const d = ri === 0 ? -1 : 1
        ctx.beginPath()
        ctx.moveTo(bx + d * tw * 0.6, pos.baseY)
        ctx.quadraticCurveTo(bx + d * (tw + pos.w * 0.25), pos.baseY + 2, bx + d * (tw + pos.w * 0.42), pos.baseY + 6)
        ctx.strokeStyle = `rgba(${vr + 3},${vg},${vb},${0.56 * f})`
        ctx.lineWidth = tw * 0.55; ctx.lineCap = 'round'; ctx.stroke()
      })
      const cols = [
        [vr, vg + 2, vb, 0.80 * f],
        [vr + 6, vg + 15, vb + 2, 0.74 * f],
        [vr + 14 + rim, vg + 22 + Math.round(rim * 0.5), vb + 6, 0.65 * f],
      ]
      tree.blob.forEach((pts, li) => {
        const [r, g, b, a] = cols[li]
        blobPath(ctx, pts, topX, topY, crx, cry)
        ctx.fillStyle = `rgba(${r},${g},${b},${a})`; ctx.fill()
      })
    }

    function drawSky(ts) {
      const { W, H } = cs, d = live.depthVal, sc = live.screen
      if (sc === 'clearing') {
        const sky = ctx.createLinearGradient(0, 0, 0, H * 0.62)
        sky.addColorStop(0, 'hsl(260,38%,8%)'); sky.addColorStop(0.28, 'hsl(240,32%,10%)')
        sky.addColorStop(0.52, 'hsl(20,48%,14%)'); sky.addColorStop(0.76, 'hsl(28,58%,18%)')
        sky.addColorStop(1, 'hsl(34,52%,20%)')
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * 0.63)
        const sg = ctx.createRadialGradient(W * 0.5, H * 0.6, 0, W * 0.5, H * 0.6, W * 0.7)
        sg.addColorStop(0, 'rgba(200,110,35,.45)'); sg.addColorStop(0.55, 'rgba(140,55,10,.07)'); sg.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H)
        const grd = ctx.createLinearGradient(0, H * 0.58, 0, H)
        grd.addColorStop(0, 'rgba(14,9,4,.98)'); grd.addColorStop(1, 'rgba(8,5,2,1)')
        ctx.fillStyle = grd; ctx.fillRect(0, H * 0.58, W, H)
        return
      }
      if (d < 0.38) {
        const t = d / 0.38
        const sky = ctx.createLinearGradient(0, 0, 0, H * 0.58)
        sky.addColorStop(0, `hsl(250,28%,${10 - t * 5}%)`); sky.addColorStop(0.32, `hsl(230,22%,${13 - t * 7}%)`)
        sky.addColorStop(0.58, `hsl(28,38%,${18 - t * 10}%)`); sky.addColorStop(1, `hsl(20,42%,${22 - t * 14}%)`)
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * 0.59)
        const glowA = 0.55 * (1 - t * 0.65)
        const g = ctx.createRadialGradient(W / 2, H * 0.59, 0, W / 2, H * 0.59, W * 0.68)
        g.addColorStop(0, `rgba(210,105,35,${glowA})`); g.addColorStop(0.42, `rgba(150,48,12,${glowA * 0.2})`); g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      } else if (d < 0.68) {
        const t = (d - 0.38) / 0.30
        const sky = ctx.createLinearGradient(0, 0, 0, H * 0.58)
        sky.addColorStop(0, `hsl(252,18%,${5 - t * 1.5}%)`); sky.addColorStop(0.82, `hsl(22,24%,${8 - t * 4}%)`); sky.addColorStop(1, `hsl(20,28%,${10 - t * 5}%)`)
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * 0.59)
        const emA = 0.22 * (1 - t * 0.7)
        const em = ctx.createRadialGradient(W / 2, H * 0.585, 0, W / 2, H * 0.585, W * 0.45)
        em.addColorStop(0, `rgba(180,80,25,${emA})`); em.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = em; ctx.fillRect(0, 0, W, H)
      } else {
        const t = (d - 0.68) / 0.32
        const sky = ctx.createLinearGradient(0, 0, 0, H * 0.58)
        sky.addColorStop(0, `hsl(228,${20 + t * 18}%,${4 + t * 7}%)`); sky.addColorStop(0.82, `hsl(22,${22 + t * 10}%,${7 + t * 5}%)`); sky.addColorStop(1, `hsl(20,${24 + t * 8}%,${9 + t * 4}%)`)
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * 0.59)
        const gb = ctx.createRadialGradient(W / 2, H * 0.56, 0, W / 2, H * 0.56, W * 0.52)
        gb.addColorStop(0, `rgba(55,80,180,${0.05 + t * 0.14})`); gb.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = gb; ctx.fillRect(0, 0, W, H)
      }
      const grd = ctx.createLinearGradient(0, H * 0.53, 0, H)
      grd.addColorStop(0, 'rgba(12,8,4,.98)'); grd.addColorStop(1, 'rgba(7,4,2,1)')
      ctx.fillStyle = grd; ctx.fillRect(0, H * 0.53, W, H)
    }

    function drawStars(ts) {
      const { H } = cs, d = live.depthVal
      if (live.screen === 'clearing' || d < 0.18) return
      let alpha = d < 0.42 ? (d - 0.18) / 0.24 : d < 0.68 ? 1 : 1 - (d - 0.68) / 0.32 * 0.35
      alpha = Math.max(0, Math.min(1, alpha))
      cs.stars.forEach(s => {
        const tw = 0.45 + 0.55 * Math.abs(Math.sin(s.twinkle + ts * 0.001 * s.sp))
        const a = (s.bright ? alpha * 0.95 * tw : alpha * 0.68 * tw)
        ctx.beginPath(); ctx.arc(s.x, s.y, s.bright ? s.r * 1.6 : s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(240,220,175,${a})`; ctx.fill()
      })
    }

    function drawPaths() {
      const { W, H } = cs
      if (live.screen === 'clearing') return
      const cx = W / 2, fork = H * 0.62
      const g0 = ctx.createLinearGradient(cx, H, cx, fork)
      g0.addColorStop(0, 'rgba(200,169,110,.13)'); g0.addColorStop(1, 'rgba(200,169,110,.02)')
      ctx.beginPath(); ctx.moveTo(cx - 28, H); ctx.quadraticCurveTo(cx - 7, H * 0.8, cx, fork)
      ctx.quadraticCurveTo(cx + 7, H * 0.8, cx + 28, H); ctx.fillStyle = g0; ctx.fill()
    }

    function drawTrail() {
      const { W, H } = cs, trail = live.myTrail
      if (!trail.length || live.screen === 'clearing') return
      const cx = W / 2, fork = H * 0.62
      ctx.save()
      trail.forEach((seg, i) => {
        const dir = seg === 'left' ? -1 : 1, ex = cx + dir * W * 0.2, ey = H * 0.44
        const a = Math.max(0.07, 0.48 - (trail.length - 1 - i) * 0.055)
        ctx.beginPath(); ctx.moveTo(cx, fork); ctx.quadraticCurveTo(cx + dir * W * 0.1, H * 0.54, ex, ey)
        ctx.strokeStyle = seg === 'leaf' ? `rgba(175,125,40,${a})` : `rgba(200,169,110,${a})`
        ctx.lineWidth = 0.8; ctx.setLineDash([3, 5]); ctx.lineDashOffset = -i * 9; ctx.stroke()
        ctx.setLineDash([])
        ctx.beginPath(); ctx.arc(ex, ey, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,169,110,${a * 0.8})`; ctx.fill()
      })
      ctx.restore()
    }

    function drawFog() {
      const { W, H, fogT } = cs
      if (live.screen === 'clearing') return
      const base = 0.018 + live.depthVal * 0.038
      [[0, 0], [1.8, 0.07], [3.4, 0.14]].forEach(([p, yo]) => {
        const dx = Math.sin(fogT + p) * 55, yc = H * (0.5 + yo)
        const g = ctx.createRadialGradient(W / 2 + dx, yc, 0, W / 2 + dx, yc, W * 0.5)
        g.addColorStop(0, `rgba(195,155,95,${base * (1 + yo * 3.5)})`); g.addColorStop(1, 'rgba(195,155,95,0)')
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      })
    }

    function drawMotes(ts) {
      const { W, H } = cs
      cs.motes.forEach(m => {
        if (live.mouseX > 0) {
          const dx = live.mouseX - m.x, dy = live.mouseY - m.y, dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 180 && dist > 0) { m.vx += dx / dist * 0.007; m.vy += dy / dist * 0.007 }
        }
        m.vx *= 0.98; m.vy *= 0.98; m.x += m.vx; m.y += m.vy
        if (m.y < 0) m.y = H * 0.82
        if (m.x < 0) m.x = W
        if (m.x > W) m.x = 0
        const fl = 0.3 + 0.7 * Math.abs(Math.sin(ts * 0.0007 + m.phase))
        const motA = live.screen === 'clearing' ? 0.6 : 0.3 + live.depthVal * 0.6
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(215,185,110,${m.a * fl * motA})`; ctx.fill()
      })
    }

    function updateCamera(ts) {
      if (live.cameraZ >= live.cameraZTarget) return
      const t = Math.min(1, (ts - live.cameraZAnimTs) / 920)
      const newZ = live.cameraZStart + (live.cameraZTarget - live.cameraZStart) * (1 - Math.pow(1 - t, 3))
      live.cameraZ = newZ
      if (t >= 1) live.cameraZ = live.cameraZTarget
      updateCameraZ(live.cameraZ)
    }

    function frame(ts) {
      cs.fogT = ts * 0.00017
      updateCamera(ts)
      ctx.clearRect(0, 0, cs.W, cs.H)
      drawSky(ts); drawStars(ts); drawPaths(); drawTrail()
      const sp = live.aiLoading ? 3.5 : 1
      for (let layer = 4; layer >= 0; layer--) {
        cs.trees.filter(t => t.layer === layer).forEach(t => {
          const sway = Math.sin(ts * t.speed * 1000 * sp + t.phase) * (layer < 2 ? 2 : 0.65)
          drawTree(t, sway, layer, effPos(t, ts))
        })
      }
      drawFog(); drawMotes(ts)
      cs.rafId = requestAnimationFrame(frame)
    }

    cs.rafId = requestAnimationFrame(frame)
    return () => {
      if (cs.rafId) cancelAnimationFrame(cs.rafId)
      window.removeEventListener('resize', resize)
    }
  }, [canvasRef])

  // Return leanTrees for the fork screen to call
  return {
    leanTrees: (dir) => {
      const { trees, W } = canvasState.current
      trees.forEach(t => {
        t.leanTarget = t.x < W / 2 ? (dir === -1 ? -0.8 : 0) : (dir === 1 ? 0.8 : 0)
      })
    },
  }
}
