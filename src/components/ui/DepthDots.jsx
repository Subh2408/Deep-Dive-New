import { useStore } from '../../store'

export default function DepthDots() {
  const screen = useStore(s => s.screen)
  const qi = useStore(s => s.qi)
  if (screen !== 'fork') return null
  return (
    <div id="depth-dots" className="visible">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className={`d-dot${i >= 5 ? ' ai' : ''}${i < qi ? ' done' : ''}`} />
      ))}
    </div>
  )
}
