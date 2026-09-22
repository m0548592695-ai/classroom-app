import { Eraser, Undo2, Trash2, PenLine, Highlighter } from 'lucide-react'

const COLORS = [
  { name: 'אדום', value: '#ef4444' },
  { name: 'כחול', value: '#2563eb' },
  { name: 'ירוק', value: '#16a34a' },
  { name: 'צהוב', value: '#eab308' },
  { name: 'שחור', value: '#111827' }
]

export default function DrawingToolbar({
  color, setColor, size, setSize, eraser, setEraser, undo, clear, onSubmit, submitting
}) {
  return (
    <div className="drawing-toolbar">
      <div className="toolbar-group">
        {COLORS.map(c => (
          <button
            key={c.value}
            className={`color-button ${color === c.value && !eraser ? 'selected' : ''}`}
            style={{ backgroundColor: c.value }}
            title={c.name}
            aria-label={c.name}
            onClick={() => { setColor(c.value); setEraser(false) }}
          />
        ))}
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button className={`tool-button ${size === 5 && !eraser ? 'selected' : ''}`} onClick={() => { setSize(5); setEraser(false) }}>
          <PenLine size={24} /> דק
        </button>
        <button className={`tool-button ${size >= 18 && !eraser ? 'selected' : ''}`} onClick={() => { setSize(24); setEraser(false) }}>
          <Highlighter size={24} /> עבה
        </button>
        <button className={`tool-button ${eraser ? 'selected danger' : ''}`} onClick={() => setEraser(true)}>
          <Eraser size={24} /> מחק
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button className="tool-button" onClick={undo}><Undo2 size={24} /> ביטול</button>
        <button className="tool-button" onClick={clear}><Trash2 size={24} /> ניקוי</button>
      </div>

      <button className="submit-button" disabled={submitting} onClick={onSubmit}>
        {submitting ? 'שולח...' : 'סיימתי! שלח למורה 🎉'}
      </button>
    </div>
  )
}
