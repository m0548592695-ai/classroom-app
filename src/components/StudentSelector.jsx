import { useEffect, useState } from 'react'
import { listStudents } from '../lib/api'

export default function StudentSelector({ onSelect, onBack }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedStudent, setSelectedStudent] = useState(null)
  const [loginCode, setLoginCode] = useState('')
  const [loginError, setLoginError] = useState('')

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

  function selectStudent(student) {
    setSelectedStudent(student)
    setLoginCode('')
    setLoginError('')
  }

  function goBackToStudents() {
    setSelectedStudent(null)
    setLoginCode('')
    setLoginError('')
  }

  function handleLogin(event) {
    event.preventDefault()

    if (loginCode.length !== 2) {
      setLoginError('יש להכניס קוד בן 2 ספרות.')
      return
    }

    if (loginCode !== selectedStudent.login_code) {
      setLoginError('הקוד שגוי. נסה שוב.')
      return
    }

    setLoginError('')
    onSelect(selectedStudent)
  }

  if (selectedStudent) {
    return (
      <div className="screen">
        <button
          className="back-button"
          onClick={goBackToStudents}
        >
          ← בחירת תלמיד אחר
        </button>

        <div className="hero">
          <div className="hero-flower">
            {selectedStudent.flower}
          </div>

          <h1>שלום {selectedStudent.name}! 👋</h1>

          <p>הכנס/י את הקוד האישי שלך</p>
        </div>

        <form
          className="student-login-form"
          onSubmit={handleLogin}
        >
          <input
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={loginCode}
            onChange={event => {
              setLoginCode(
                event.target.value
                  .replace(/\D/g, '')
                  .slice(0, 2)
              )
              setLoginError('')
            }}
            placeholder="••"
            autoFocus
            className="student-code-input"
          />

          {loginError && (
            <div className="error-box">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            className="student-login-button"
            disabled={loginCode.length !== 2}
          >
            כניסה 🚀
          </button>
        </form>
      </div>
    )
  }

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
              onClick={() => selectStudent(student)}
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
