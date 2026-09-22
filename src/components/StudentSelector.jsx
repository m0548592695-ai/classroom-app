import { useEffect, useState } from 'react'
import { listStudents } from '../lib/api'

export default function StudentSelector({ onSelect, onBack }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadStudents() {
      try {
        const data = await listStudents()
        setStudents(data)
      } catch (e) {
        setError(e.message || 'לא הצלחתי לטעון את התלמידים.')
      } finally {
        setLoading(false)
      }
    }

    loadStudents()
  }, [])

  return (
    <div className="screen">
      <button className="back-button" onClick={onBack}>
        ← חזרה
      </button>

      <div className="hero">
        <div className="hero-flower">🌸</div>
        <h1>מי אתה?</h1>
        <p>בחר/י את השם שלך</p>
      </div>

      {loading && (
        <div className="loading-text">
          טוען תלמידים…
        </div>
      )}

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="student-grid">
          {students.map(student => (
            <button
              key={student.id}
              className="student-card"
              style={{
                '--flower-color': student.color
              }}
              onClick={() => onSelect(student)}
            >
              <div className="student-flower">
                {student.flower}
              </div>

              <strong>
                {student.name}
              </strong>
            </button>
          ))}
        </div>
      )}

      {!loading && !error && students.length === 0 && (
        <div className="empty-card">
          עדיין לא נוספו תלמידים.
        </div>
      )}
    </div>
  )
}
