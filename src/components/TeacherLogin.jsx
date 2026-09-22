import { useState } from 'react'

export default function TeacherLogin({ onSuccess, onBack }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  function submit(e) {
    e.preventDefault()
    if (code === '9') {
      setError('')
      onSuccess()
    } else {
      setError('הקוד לא נכון. נסי שוב 🙂')
      setCode('')
    }
  }

  return (
    <div className="screen narrow">
      <button className="back-button" onClick={onBack}>← חזרה</button>
      <div className="login-card">
        <div className="teacher-icon">👩‍🏫</div>
        <h1>כניסת מורה</h1>
        <p>הכניסי את קוד הגישה</p>
        <form onSubmit={submit}>
          <input
            autoFocus
            inputMode="numeric"
            type="password"
            value={code}
            onChange={e => setCode(e.target.value)}
            className="pin-input"
            aria-label="קוד מורה"
            maxLength={10}
          />
          <button className="primary-button" type="submit">כניסה</button>
        </form>
        {error && <div className="error-box">{error}</div>}
      </div>
    </div>
  )
}
