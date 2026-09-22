import { useState } from 'react'
import { createTask } from '../lib/api'

export default function TaskUploader({ onCreated }) {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!file) return setError('בחרי קובץ.')
    if (!title.trim()) return setError('כתבי שם קצר למשימה.')
    setBusy(true)
    setError('')
    try {
      const task = await createTask({ title: title.trim(), file })
      setTitle('')
      setFile(null)
      e.target.reset()
      onCreated(task)
    } catch (err) {
      setError(err.message || 'העלאת הקובץ נכשלה.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="upload-card" onSubmit={submit}>
      <div>
        <h2>➕ הוספת דף עבודה</h2>
        <p>אפשר להעלות תמונה או PDF.</p>
      </div>
      <input
        className="text-input"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="שם המשימה, למשל: דף חשבון 1"
      />
      <label className="file-picker">
        <span>📎 בחרי קובץ</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          onChange={e => setFile(e.target.files?.[0] || null)}
        />
      </label>
      {file && <div className="file-name">נבחר: {file.name}</div>}
      <button className="primary-button" disabled={busy}>
        {busy ? 'מעלה…' : 'העלאת משימה'}
      </button>
      {error && <div className="error-box">{error}</div>}
    </form>
  )
}
