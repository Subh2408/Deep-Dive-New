import { useEffect, useRef, useCallback } from 'react'
import { useStore } from '../../store'

const EX = { CW: 320, CH: 82, UW: 240, UH: 60, VGAP: 36, HGAP: 28, SKY: 70, ROOT_H: 36 }

function shortText(t, max) { return t && t.length > max ? t.slice(0, max - 1) + '…' : t || '' }

function buildLayout(theme, answers, sharedQuestion) {
  const nodes = [], edges = []
  const n = answers.length
  const cx = 500
  let y = EX.SKY + 20

  // Root
  nodes.push({ id: 'root', x: cx - 70, y, w: 140, h: EX.ROOT_H, type: 'root', answer: theme, question: null, unchosen: null })
  y += EX.ROOT_H + EX.VGAP

  for (let i = 0; i < n; i++) {
    const a = answers[i]
    const isAI = i >= 5, isLeaf = !!a.leaf
    const type = isLeaf ? 'leaf' : isAI ? 'ai' : 'anchor'
    const unchosen = a.opts ? (a.c === a.opts.l ? a.opts.r : a.opts.l) : null
    const dir = i % 2 === 0 ? 1 : -1
    const cxOff = cx + dir * -14

    // Chosen card
    const chosen = { id: `u${i}`, x: cxOff - EX.CW / 2, y, w: EX.CW, h: EX.CH, type, depth: i + 1, question: a.q, answer: a.c, unchosen }
    nodes.push(chosen)

    // Edge from previous
    const prev = i === 0 ? nodes[0] : nodes.find(nd => nd.id === `u${i - 1}`)
    if (prev) {
      const px = prev.x + prev.w / 2, py = prev.y + prev.h
      const tx = chosen.x + chosen.w / 2, ty = chosen.y
      edges.push({ x1: px, y1: py, x2: tx, y2: ty, cx: (px + tx) / 2, cy: (py + ty) / 2, type: 'trunk' })
    }

    // Unchosen card
    if (unchosen) {
      const ux = dir > 0 ? cxOff + EX.CW / 2 + EX.HGAP : cxOff - EX.CW / 2 - EX.HGAP - EX.UW
      const uy = y + (EX.CH - EX.UH) / 2
      nodes.push({ id: `ub${i}`, x: ux, y: uy, w: EX.UW, h: EX.UH, type: 'unchosen', depth: i + 1, question: a.q, answer: unchosen, unchosen: a.c })
      const bx = dir > 0 ? cxOff + EX.CW / 2 : cxOff - EX.CW / 2
      edges.push({ x1: bx, y1: y + EX.CH / 2, x2: ux + (dir > 0 ? 0 : EX.UW), y2: uy + EX.UH / 2, cx: bx + dir * EX.HGAP / 2, cy: y + EX.CH / 2, type: 'branch' })
    }
    y += EX.CH + EX.VGAP
  }

  // Convergence
  const convW = 300, convH = 72
  const last = nodes.filter(nd => nd.id.match(/^u\d+$/) && !nd.id.match(/^ub/)).pop()
  if (last) edges.push({ x1: last.x + last.w / 2, y1: last.y + last.h, x2: cx, y2: y + convH / 2, cx: (last.x + last.w / 2 + cx) / 2, cy: (last.y + last.h + y) / 2, type: 'trunk' })
  nodes.push({ id: 'conv', x: cx - convW / 2, y, w: convW, h: convH, type: 'convergence', depth: n + 1, question: sharedQuestion, answer: null, unchosen: null })
  y += convH + 60

  return { nodes, edges, worldW: cx * 2, worldH: y }
}

export default function Explorer() {
  const theme = useStore(s => s.theme)
  const answers = useStore(s => s.answers)
  const sharedQuestion = useStore(s => s.sharedQuestion)
  const setScreen = useStore(s => s.setScreen)

  const canvasRef = useRef(null)
  const stateRef = useRef({ nodes: [], edges: [], worldW: 0, worldH: 0, panX: 0, panY: 0, zoom: 1, drag: false, dragSX: 0, dragSY: 0, dragPX: 0, dragPY: 0, pinch: false, pinchDist: 0, pinchZoom: 1, tapX: 0, tapY: 0, tapMoved: false, spawnT: 0, rafId: null, W: 0, H: 0, dpr: 1 })
  const panelRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const s = stateRef.current
    const dpr = s.dpr = Math.min(window.devicePixelRatio || 1, 2)
    const hh = document.querySelector('.explorer-header')?.offsetHeight || 50
    s.W = window.innerWidth; s.H = window.innerHeight - hh
    canvas.width = Math.round(s.W * dpr); canvas.height = Math.round(s.H * dpr)
    canvas.style.width = s.W + 'px'; canvas.style.height = s.H + 'px'
    const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr)

    const layout = buildLayout(theme, answers, sharedQuestion)
    s.nodes = layout.nodes; s.edges = layout.edges; s.worldW = layout.worldW; s.worldH = layout.worldH

    // Initial zoom to fit horizontally
    s.zoom = Math.min(1, (s.W - 40) / s.worldW)
    s.panX = (s.W - s.worldW * s.zoom) / 2
    s.panY = 12
    s.spawnT = 0

    const depthVal = useStore.getState().depthVal

    function drawSkyStrip(ctx, W) {
      const d = depthVal
      const gr = ctx.createLinearGradient(0, 0, 0, EX.SKY)
      if (d < 0.38) {
        gr.addColorStop(0, '#18102a'); gr.addColorStop(0.5, '#5a2468'); gr.addColorStop(0.8, '#a03828'); gr.addColorStop(1, '#e8a838')
      } else if (d < 0.68) {
        gr.addColorStop(0, '#0c0820'); gr.addColorStop(0.5, '#2e1858'); gr.addColorStop(0.8, '#701828'); gr.addColorStop(1, '#c06018')
      } else {
        gr.addColorStop(0, '#060510'); gr.addColorStop(0.5, '#1e1c50'); gr.addColorStop(0.8, '#483870'); gr.addColorStop(1, '#b09070')
      }
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, EX.SKY)
      // Horizon glow
      const hg = ctx.createRadialGradient(W / 2, EX.SKY, 0, W / 2, EX.SKY, W * 0.4)
      hg.addColorStop(0, 'rgba(200,100,30,.32)'); hg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = hg; ctx.fillRect(0, 0, W, EX.SKY)
      // Tree silhouettes
      ctx.fillStyle = '#0c1808'
      ;[40, 90, 145, 195, 250, 305, 380, 440, 495, 550, 605, 660, 720, 780, 840, 900].forEach((tx, i) => {
        const tr = 16 + (i * 9) % 16, th = 22 + (i * 13) % 22
        ctx.beginPath(); ctx.ellipse(tx, EX.SKY - th * 0.4, tr * 0.7, th * 0.65, 0, 0, Math.PI * 2); ctx.fill()
        ctx.fillRect(tx - tr * 0.1, EX.SKY - th * 0.15, tr * 0.2, th * 0.2)
      })
      // Ground band
      ctx.fillStyle = '#0e0c08'; ctx.fillRect(0, EX.SKY, W, 14)
    }

    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y)
      ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r)
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h)
      ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r)
      ctx.arcTo(x, y, x + r, y, r); ctx.closePath()
    }

    function wrapText(ctx, text, x, y, maxW, lh, maxL) {
      if (!text) return
      const words = text.split(' '); let line = '', lines = []
      for (const w of words) {
        const t = line ? line + ' ' + w : w
        if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; if (lines.length >= maxL) break } else line = t
      }
      if (line && lines.length < maxL) lines.push(line)
      lines.forEach((l, i) => ctx.fillText(l, x, y + i * lh))
    }

    function drawNode(ctx, node, op) {
      if (op <= 0) return
      ctx.save(); ctx.globalAlpha = op
      const { x, y, w, h, type, depth, question, answer, unchosen } = node
      const px = x + 12, pw = w - 24
      const borderC = type === 'unchosen' ? 'rgba(200,160,55,0.22)' : type === 'leaf' ? 'rgba(165,115,40,0.72)' : type === 'convergence' ? 'rgba(200,160,55,0.45)' : type === 'ai' ? 'rgba(80,180,120,0.55)' : 'rgba(200,160,55,0.62)'
      const fillC = type === 'unchosen' ? 'rgba(9,12,7,0.82)' : type === 'leaf' ? 'rgba(12,10,5,0.9)' : type === 'convergence' ? 'rgba(8,14,8,0.88)' : 'rgba(10,14,8,0.9)'
      ctx.fillStyle = fillC; roundRect(ctx, x, y, w, h, 5); ctx.fill()
      if (type === 'convergence') ctx.setLineDash([4, 4])
      ctx.strokeStyle = borderC; ctx.lineWidth = 0.8; roundRect(ctx, x, y, w, h, 5); ctx.stroke()
      ctx.setLineDash([])

      if (type === 'root') {
        ctx.fillStyle = `rgba(220,195,140,${op * 0.88})`; ctx.font = "300 italic 14px 'Cormorant Garamond',Georgia,serif"
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(answer || '', x + w / 2, y + h / 2)
      } else if (type === 'unchosen') {
        ctx.fillStyle = `rgba(200,160,55,${op * 0.22})`; ctx.font = "400 6.5px 'DM Sans',sans-serif"
        ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('ROAD NOT TAKEN', px, y + 8)
        ctx.strokeStyle = `rgba(200,160,55,${op * 0.08})`; ctx.lineWidth = 0.4
        ctx.beginPath(); ctx.moveTo(px, y + 18); ctx.lineTo(x + w - 12, y + 18); ctx.stroke()
        ctx.fillStyle = `rgba(200,185,145,${op * 0.3})`; ctx.font = "300 italic 11px 'Cormorant Garamond',Georgia,serif"
        ctx.textBaseline = 'top'; wrapText(ctx, answer, px, y + 22, pw, 14, 2)
      } else {
        const eyebrow = type === 'leaf' ? 'THE LEAF FELL HERE' : type === 'convergence' ? 'WHERE THE PATH ENDS' : type === 'ai' ? `QUESTION ${depth} · AI` : `QUESTION ${depth} · ANCHOR`
        const eyeC = type === 'leaf' ? `rgba(165,115,40,${op * 0.52})` : type === 'ai' ? `rgba(80,180,120,${op * 0.42})` : `rgba(200,160,55,${op * 0.42})`
        ctx.fillStyle = eyeC; ctx.font = "400 6.5px 'DM Sans',sans-serif"; ctx.textAlign = 'left'; ctx.textBaseline = 'top'
        ctx.fillText(eyebrow, px, y + 8)
        if (type === 'leaf') ctx.fillText('🍃', x + w - 22, y + 6)
        ctx.strokeStyle = `rgba(200,160,55,${op * 0.1})`; ctx.lineWidth = 0.4
        ctx.beginPath(); ctx.moveTo(px, y + 18); ctx.lineTo(x + w - 12, y + 18); ctx.stroke()
        if (type === 'convergence') {
          ctx.fillStyle = `rgba(240,228,190,${op * 0.65})`; ctx.font = "300 italic 13px 'Cormorant Garamond',Georgia,serif"; ctx.textBaseline = 'top'
          wrapText(ctx, question || 'tap to reveal', px, y + 24, pw, 16, 3)
        } else {
          ctx.fillStyle = `rgba(240,228,190,${op * 0.72})`; ctx.font = "300 italic 12px 'Cormorant Garamond',Georgia,serif"; ctx.textBaseline = 'top'
          wrapText(ctx, question || '', px, y + 24, pw, 14, 2)
          const pillY = y + h - 22, pillC = type === 'leaf' ? `rgba(165,115,40,${op * 0.14})` : type === 'ai' ? `rgba(80,180,120,${op * 0.12})` : `rgba(200,160,55,${op * 0.12})`
          ctx.fillStyle = pillC; roundRect(ctx, px, pillY, pw * 0.88, 13, 3); ctx.fill()
          ctx.strokeStyle = type === 'leaf' ? `rgba(165,115,40,${op * 0.35})` : type === 'ai' ? `rgba(80,180,120,${op * 0.32})` : `rgba(200,160,55,${op * 0.32})`
          ctx.lineWidth = 0.5; roundRect(ctx, px, pillY, pw * 0.88, 13, 3); ctx.stroke()
          ctx.fillStyle = type === 'leaf' ? `rgba(210,175,90,${op * 0.88})` : type === 'ai' ? `rgba(100,200,150,${op * 0.82})` : `rgba(215,185,125,${op * 0.88})`
          ctx.font = "300 9px 'Cormorant Garamond',Georgia,serif"; ctx.textBaseline = 'middle'
          ctx.fillText('→ ' + shortText(answer || '', 38), px + 6, pillY + 6.5)
          if (unchosen) {
            ctx.fillStyle = `rgba(200,185,145,${op * 0.22})`; ctx.font = "300 italic 9.5px 'Cormorant Garamond',Georgia,serif"; ctx.textBaseline = 'top'
            ctx.fillText(shortText(unchosen, 44), px, pillY + 15)
          }
        }
      }
      ctx.restore()
    }

    function drawEdge(ctx, edge, op) {
      if (op <= 0) return
      ctx.save()
      ctx.strokeStyle = edge.type === 'branch' ? `rgba(200,160,55,${op * 0.18})` : `rgba(200,160,55,${op * 0.45})`
      ctx.lineWidth = edge.type === 'branch' ? 0.7 : 1.6
      if (edge.type === 'branch') ctx.setLineDash([4, 5])
      ctx.beginPath(); ctx.moveTo(edge.x1, edge.y1); ctx.quadraticCurveTo(edge.cx, edge.cy, edge.x2, edge.y2); ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()
    }

    function clampPan() {
      const minX = s.W - s.worldW * s.zoom - 40, maxX = 40
      const minY = s.H - s.worldH * s.zoom - 40, maxY = 40
      s.panX = Math.max(minX, Math.min(maxX, s.panX))
      s.panY = Math.max(minY, Math.min(maxY, s.panY))
    }

    function screenToWorld(sx, sy) { return { x: (sx - s.panX) / s.zoom, y: (sy - s.panY) / s.zoom } }

    function hitTest(sx, sy) {
      const { x, y } = screenToWorld(sx, sy)
      return s.nodes.find(n => n.opacity > 0.5 && n.type !== 'root' && x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h) || null
    }

    function openPanel(node) {
      if (!panelRef.current) return
      const p = panelRef.current
      p.dataset.type = node.type
      p.querySelector('.panel-eyebrow').textContent =
        node.type === 'convergence' ? 'where the path ends' :
        node.type === 'leaf' ? 'the leaf fell here' :
        node.type === 'unchosen' ? `road not taken · question ${node.depth}` :
        node.type === 'ai' ? `AI · question ${node.depth}` :
        `question ${node.depth}`
      const qEl = p.querySelector('.panel-q')
      qEl.textContent = node.question || ''
      const ansEl = p.querySelector('.panel-answers')
      ansEl.innerHTML = ''
      if (node.type === 'convergence') {
        qEl.className = 'panel-conv-q'
      } else {
        qEl.className = 'panel-q'
        if (node.answer) ansEl.innerHTML = `<div class="panel-chosen"><div class="panel-dot"></div><div class="panel-chosen-text">${node.answer}</div></div>`
        if (node.unchosen) ansEl.innerHTML += `<div class="panel-unchosen">${node.unchosen}</div>`
      }
      p.classList.add('open')
      document.getElementById('panelDim').classList.add('open')
    }

    // Expose openPanel and hitTest via canvas dataset for event handlers
    canvas._hitTest = hitTest
    canvas._openPanel = openPanel

    // Assign opacity field to all nodes/edges for animation
    s.nodes.forEach(n => { n.opacity = 0 })
    s.edges.forEach(e => { e.opacity = 0 })

    function frame(ts) {
      s.spawnT = Math.min(1, s.spawnT + 0.018)
      const ctx2 = canvas.getContext('2d')
      ctx2.clearRect(0, 0, s.W, s.H)
      ctx2.fillStyle = '#0e0a04'; ctx2.fillRect(0, 0, s.W, s.H)

      // Spawn nodes/edges progressively
      const allItems = [...s.edges, ...s.nodes]
      allItems.forEach((item, i) => {
        const t = Math.max(0, s.spawnT - i * 0.035)
        item.opacity = Math.min(1, t * 2.5)
      })

      ctx2.save(); ctx2.translate(s.panX, s.panY); ctx2.scale(s.zoom, s.zoom)
      // Sky header
      drawSkyStrip(ctx2, s.worldW)
      // Edges
      s.edges.forEach(e => drawEdge(ctx2, e, e.opacity))
      // Nodes
      s.nodes.forEach(n => drawNode(ctx2, n, n.opacity))
      ctx2.restore()

      // Hint
      ctx2.fillStyle = 'rgba(200,180,140,0.18)'; ctx2.font = "300 9px 'DM Sans',sans-serif"
      ctx2.textAlign = 'right'; ctx2.textBaseline = 'bottom'
      ctx2.fillText('drag to pan · pinch to zoom', s.W - 14, s.H - 10)

      s.rafId = requestAnimationFrame(frame)
    }

    s.rafId = requestAnimationFrame(frame)

    // Events
    function onMouseDown(e) { s.drag = true; s.dragSX = e.clientX; s.dragSY = e.clientY; s.dragPX = s.panX; s.dragPY = s.panY; s.tapMoved = false }
    function onMouseMove(e) { if (!s.drag) return; const dx = e.clientX - s.dragSX, dy = e.clientY - s.dragSY; if (Math.hypot(dx, dy) > 4) s.tapMoved = true; s.panX = s.dragPX + dx; s.panY = s.dragPY + dy; clampPan() }
    function onMouseUp() { s.drag = false }
    function onClick(e) { if (s.tapMoved) return; const hit = canvas._hitTest(e.clientX, e.clientY); if (hit) canvas._openPanel(hit) }
    function onWheel(e) {
      const rect = canvas.getBoundingClientRect(), mx = e.clientX - rect.left, my = e.clientY - rect.top
      const oz = s.zoom; s.zoom = Math.max(0.32, Math.min(2.2, s.zoom * (e.deltaY < 0 ? 1.1 : 0.9)))
      s.panX = mx - (mx - s.panX) * (s.zoom / oz); s.panY = my - (my - s.panY) * (s.zoom / oz); clampPan()
    }
    function onTouchStart(e) {
      if (e.touches.length === 2) { s.pinch = true; s.drag = false; s.pinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); s.pinchZoom = s.zoom; return }
      s.drag = true; s.pinch = false; s.dragSX = e.touches[0].clientX; s.dragSY = e.touches[0].clientY; s.dragPX = s.panX; s.dragPY = s.panY; s.tapX = e.touches[0].clientX; s.tapY = e.touches[0].clientY; s.tapMoved = false
    }
    function onTouchMove(e) {
      e.preventDefault()
      if (e.touches.length === 2 && s.pinch) {
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
        const cx2 = (e.touches[0].clientX + e.touches[1].clientX) / 2, cy2 = (e.touches[0].clientY + e.touches[1].clientY) / 2
        const rect = canvas.getBoundingClientRect(), mx = cx2 - rect.left, my = cy2 - rect.top
        const oz = s.zoom; s.zoom = Math.max(0.32, Math.min(2.2, s.pinchZoom * (d / s.pinchDist)))
        s.panX = mx - (mx - s.panX) * (s.zoom / oz); s.panY = my - (my - s.panY) * (s.zoom / oz); clampPan(); return
      }
      if (!s.drag) return
      const dx = e.touches[0].clientX - s.dragSX, dy = e.touches[0].clientY - s.dragSY
      if (Math.hypot(dx, dy) > 6) s.tapMoved = true
      s.panX = s.dragPX + dx; s.panY = s.dragPY + dy; clampPan()
    }
    function onTouchEnd(e) {
      s.drag = false; s.pinch = false
      if (!s.tapMoved && e.changedTouches.length) { const hit = canvas._hitTest(e.changedTouches[0].clientX, e.changedTouches[0].clientY); if (hit) canvas._openPanel(hit) }
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('click', onClick)
    canvas.addEventListener('wheel', onWheel, { passive: true })
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      if (s.rafId) cancelAnimationFrame(s.rafId)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('click', onClick)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [theme, answers, sharedQuestion])

  function fitAll() {
    const s = stateRef.current
    s.zoom = Math.max(0.32, Math.min((s.W - 32) / s.worldW, (s.H - 32) / s.worldH))
    s.panX = (s.W - s.worldW * s.zoom) / 2
    s.panY = 12
  }

  function exportPath() {
    const s = stateRef.current
    const canvas = canvasRef.current
    if (!canvas) return
    const oc = document.createElement('canvas')
    oc.width = Math.round(s.worldW * s.dpr); oc.height = Math.round(s.worldH * s.dpr)
    const og = oc.getContext('2d'); og.scale(s.dpr, s.dpr)
    og.fillStyle = '#0e0a04'; og.fillRect(0, 0, s.worldW, s.worldH)
    // We just use the current canvas at reset zoom — quick approach
    const oz = s.zoom, opx = s.panX, opy = s.panY
    s.zoom = 1; s.panX = 0; s.panY = 0
    og.drawImage(canvas, 0, 0, s.worldW, s.worldH)
    s.zoom = oz; s.panX = opx; s.panY = opy
    og.fillStyle = 'rgba(200,180,140,.22)'; og.font = "300 11px 'DM Sans',sans-serif"
    og.textAlign = 'left'; og.textBaseline = 'bottom'; og.fillText(theme || '', 16, s.worldH - 10)
    og.textAlign = 'center'; og.fillText('Deep Dive', s.worldW / 2, s.worldH - 10)
    og.textAlign = 'right'; og.fillText(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), s.worldW - 16, s.worldH - 10)
    const lnk = document.createElement('a')
    lnk.download = `deep-dive-${(theme || 'path').toLowerCase()}.png`
    lnk.href = oc.toDataURL('image/png'); lnk.click()
  }

  function closePanel() {
    panelRef.current?.classList.remove('open')
    document.getElementById('panelDim')?.classList.remove('open')
  }

  return (
    <div className="screen-explorer">
      <div className="explorer-header">
        <div className="explorer-theme">{theme}</div>
        <div className="explorer-actions">
          <button className="exp-btn" onClick={fitAll}>⊞ fit all</button>
          <button className="exp-btn save" onClick={exportPath}>save as image</button>
          <button className="exp-btn" onClick={() => setScreen('convergence')}>← back</button>
        </div>
      </div>
      <canvas ref={canvasRef} id="explorerCanvas" style={{ touchAction: 'none' }} />
      <div className="panel-dim" id="panelDim" onClick={closePanel} />
      <div id="nodePanel" ref={panelRef}>
        <button className="panel-close" onClick={closePanel}>close ✕</button>
        <div className="panel-eyebrow" />
        <div className="panel-q" />
        <div className="panel-answers" />
      </div>
    </div>
  )
}
