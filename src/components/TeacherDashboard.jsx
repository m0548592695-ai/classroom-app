import { useEffect, useMemo, useState } from 'react'
import { Download, Trash2, LogOut, FileText, Users, RefreshCw } from 'lucide-react'
import { deleteSubmission, deleteTask, listSubmissions, listTasks } from '../lib/api'
import { STUDENTS } from '../data/students'
import TaskUploader from './TaskUploader'

function formatDate(value) {
  return new Intl.DateTimeFormat('he-IL', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

export default function TeacherDashboard({ onLogout }) {
  const [tasks, setTasks] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')

  async function refresh() {
    setBusy(true)
    setError('')
    try {
      const [t, s] = await Promise.all([listTasks(), listSubmissions()])
      setTasks(t)
      setSubmissions(s)
    } catch (e) {
      setError(e.message || 'לא הצלחתי לטעון את הנתונים.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const byStudent = useMemo(() => {
    return Object.fromEntries(
      STUDENTS.map(student => [
        student.id,
        submissions.filter(s => s.student_id === student.id)
      ])
    )
  }, [submissions])

  async function removeSubmission(item) {
    if (!confirm(`למחוק את התוצר של ${STUDENTS.find(s => s.id === item.student_id)?.name || 'התלמיד'}?`)) return
    try {
      await deleteSubmission(item)
      setSubmissions(prev => prev.filter(s => s.id !== item.id))
    } catch (e) {
      setError(e.message || 'המחיקה נכשלה.')
    }
  }

  async function removeTask(task) {
    if (!confirm(`למחוק את המשימה "${task.title}" ואת התוצרים שלה?`)) return
    try {
      await deleteTask(task)
      setTasks(prev => prev.filter(t => t.id !== task.id))
      setSubmissions(prev => prev.filter(s => s.task_id !== task.id))
    } catch (e) {
      setError(e.message || 'מחיקת המשימה נכשלה.')
    }
  }

  function download(url, name) {
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.target = '_blank'
    a.rel = 'noreferrer'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div className="teacher-page">
      <header className="teacher-header">
        <div>
          <h1>👩‍🏫 לוח המורה</h1>
          <p>ניהול משימות ותוצרים</p>
        </div>
        <div className="header-actions">
          <button className="tool-button" onClick={refresh}><RefreshCw size={18} /> רענון</button>
          <button className="tool-button" onClick={onLogout}><LogOut size={18} /> יציאה</button>
        </div>
      </header>

      <main className="teacher-content">
        {error && <div className="error-box">{error}</div>}

        <TaskUploader onCreated={task => setTasks(prev => [task, ...prev])} />

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <h2><FileText size={22} /> משימות פעילות</h2>
              <p>{tasks.length} משימות</p>
            </div>
          </div>

          {busy ? <div className="empty-card">טוען…</div> : tasks.length === 0 ? (
            <div className="empty-card">עדיין לא הועלו משימות.</div>
          ) : (
            <div className="task-admin-grid">
              {tasks.map(task => {
                const count = submissions.filter(s => s.task_id === task.id).length
                return (
                  <div className="task-admin-card" key={task.id}>
                    <div className="task-file-preview">
                      {task.file_type?.includes('pdf') ? '📄 PDF' : '🖼️ תמונה'}
                    </div>
                    <div className="task-admin-info">
                      <h3>{task.title}</h3>
                      <p>{task.file_name}</p>
                      <span>{count} מתוך {STUDENTS.length} תלמידים הגישו</span>
                    </div>
                    <button className="icon-danger" title="מחיקת משימה" onClick={() => removeTask(task)}>
                      <Trash2 size={20} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <h2><Users size={22} /> תוצרים לפי תלמיד</h2>
              <p>העבודות נשמרות בענן וניתן להוריד אותן בכל עת.</p>
            </div>
          </div>

          <div className="student-submissions-grid">
            {STUDENTS.map(student => (
              <div className="student-submissions-card" key={student.id}>
                <div className="student-heading">
                  <span className="mini-flower" style={{ background: student.color }}>{student.flower}</span>
                  <h3>{student.name}</h3>
                  <span className="count-badge">{byStudent[student.id].length}</span>
                </div>

                {byStudent[student.id].length === 0 ? (
                  <div className="no-submissions">עדיין אין תוצרים</div>
                ) : (
                  <div className="submission-list">
                    {byStudent[student.id].map(item => (
                      <div className="submission-card" key={item.id}>
                        <img src={item.image_url} alt={`העבודה של ${student.name}`} />
                        <div className="submission-meta">
                          <strong>{item.task_title}</strong>
                          <span>{formatDate(item.submitted_at)}</span>
                        </div>
                        <div className="submission-actions">
                          <button
                            className="icon-button"
                            title="הורדה"
                            onClick={() => download(item.image_url, `${student.name}_${item.task_title}.png`)}
                          >
                            <Download size={19} />
                          </button>
                          <button className="icon-danger" title="מחיקה" onClick={() => removeSubmission(item)}>
                            <Trash2 size={19} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
