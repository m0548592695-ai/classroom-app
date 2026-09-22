import { STUDENTS } from '../data/students'

export default function StudentSelector({ onSelect, onBack }) {
  return (
    <div className="screen">
      <button className="back-button" onClick={onBack}>← חזרה</button>
      <div className="hero">
        <div className="hero-flower">🌷</div>
        <h1>מי את/ה?</h1>
        <p>בחר/י את השם שלך</p>
      </div>
      <div className="student-grid">
        {STUDENTS.map(student => (
          <button
            key={student.id}
            className="student-card"
            style={{ '--flower-color': student.color }}
            onClick={() => onSelect(student)}
          >
            <span className="student-flower">{student.flower}</span>
            <strong>{student.name}</strong>
          </button>
        ))}
      </div>
    </div>
  )
}
