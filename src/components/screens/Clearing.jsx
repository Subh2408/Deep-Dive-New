import { useStore } from '../../store'
import { themes } from '../../data/themes'

export default function Clearing() {
  const startTheme = useStore(s => s.startTheme)
  return (
    <div className="screen-clearing">
      <div className="clearing-instruction">choose where to go.</div>
      <div className="stones-grid">
        {themes.map((t, i) => (
          <button
            key={t.name}
            className="stone"
            style={{ animationDelay: `${0.08 + i * 0.07}s` }}
            onClick={() => startTheme(t.name)}
          >
            <div className="stone-glyph" style={{ color: t.color }}>{t.glyph}</div>
            <div className="stone-name">{t.name}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
