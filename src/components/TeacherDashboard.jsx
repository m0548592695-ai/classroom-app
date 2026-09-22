import { useEffect, useMemo, useState } from 'react'
import {
  Download,
  Trash2,
  LogOut,
  FileText,
  Users,
  RefreshCw,
  Plus,
  Pencil,
  UserPlus,
  X
} from 'lucide-react'

import {
  deleteSubmission,
  deleteTask,
  listSubmissions,
  listTasks,
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent
} from '../lib/api'

import TaskUploader from './TaskUploader'

function formatDate(value) {
  return new Intl.DateTimeFormat('he-IL', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

const FLOWERS = [
  { flower: '🌸', color: '#ec4899' },
  { flower: '🌼', color: '#eab308' },
  { flower: '🌷', color: '#3b82f6' },
  { flower: '🌺', color: '#8b5cf6' },
  { flower: '🌻', color: '#f97316' }
]

export default function TeacherDashboard({ onLogout }) {
  const [tasks, setTasks] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [students, setStudents] = useState([])

  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')

  const [showStudentForm, setShowStudentForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [savingStudent, setSavingStudent] = useState(false)

  const [studentForm, setStudentForm] = useState({
    name: '',
    loginCode: '',
    flower: '🌸',
    color: '#ec4899'
  })

  async function refresh() {
    setBusy(true)
    setError('')

    try {
      const [t, s, st] = await Promise.all([
        listTasks(),
        listSubmissions(),
        listStudents()
      ])

      setTasks(t)
      setSubmissions(s)
      setStudents(st)
    } catch (e) {
      setError(e.message || 'לא הצלחתי לטעון את הנתונים.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const byStudent = useMemo(() => {
    return Object.fromEntries(
      students.map(student => [
        student.id,
        submissions.filter(s => s.student_id === student.id)
      ])
    )
  }, [students, submissions])

  function openAddStudent() {
    setEditingStudent(null)

    setStudentForm({
      name: '',
      loginCode: '',
      flower: '🌸',
      color: '#ec4899'
    })

    setError('')
    setShowStudentForm(true)
  }

  function openEditStudent(student) {
    setEditingStudent(student)

    setStudentForm({
      name: student.name,
      loginCode: student.login_code || '',
      flower: student.flower,
      color: student.color
    })

    setError('')
    setShowStudentForm(true)
  }

  function closeStudentForm() {
    if (savingStudent) return

    setShowStudentForm(false)
    setEditingStudent(null)
  }

  function selectFlower(item) {
    setStudentForm(prev => ({
      ...prev,
      flower: item.flower,
      color: item.color
    }))
  }

  async function saveStudent(event) {
    event.preventDefault()

    const name = studentForm.name.trim()
    const loginCode = studentForm.loginCode.trim()

    if (!name) {
      setError('צריך להזין שם לתלמיד.')
      return
    }

    if (!/^\d{2}$/.test(loginCode)) {
      setError('קוד הכניסה חייב להכיל 2 ספרות.')
      return
    }

    setSavingStudent(true)
    setError('')

    try {
      if (editingStudent) {
        const updated = await updateStudent({
          id: editingStudent.id,
          name,
          flower: studentForm.flower,
          color: studentForm.color,
          loginCode
        })

        setStudents(prev =>
          prev.map(student =>
            student.id === updated.id ? updated : student
          )
        )
      } else {
        const created = await createStudent({
          name,
          flower: studentForm.flower,
          color: studentForm.color,
          loginCode
        })

        setStudents(prev => [...prev, created])
      }

      closeStudentForm()
    } catch (e) {
      setError(e.message || 'שמירת התלמיד נכשלה.')
    } finally {
      setSavingStudent(false)
    }
  }

  async function removeStudent(student) {
    const studentSubmissions = byStudent[student.id] || []

    if (studentSubmissions.length > 0) {
      setError(
        `אי אפשר למחוק את ${student.name} כי קיימים לו ${studentSubmissions.length} תוצרים.`
      )
      return
    }

    if (!confirm(`למחוק את התלמיד/ה "${student.name}"?`)) {
      return
    }

    try {
      setError('')

      await deleteStudent(student.id)

      setStudents(prev =>
        prev.filter(item => item.id !== student.id)
      )
    } catch (e) {
      setError(e.message || 'מחיקת התלמיד נכשלה.')
    }
  }

  async function removeSubmission(item) {
    const student = students.find(s => s.id === item.student_id)

    if (!confirm(`למחוק את התוצר של ${student?.name || 'התלמיד'}?`)) {
      return
    }

    try {
      await deleteSubmission(item)
      setSubmissions(prev => prev.filter(s => s.id !== item.id))
    } catch (e) {
      setError(e.message || 'המחיקה נכשלה.')
    }
  }

  async function removeTask(task) {
    if (!confirm(`למחוק את המשימה "${task.title}" ואת התוצרים שלה?`)) {
      return
    }

    try {
      await deleteTask(task)

      setTasks(prev => prev.filter(t => t.id !== task.id))
      setSubmissions(prev =>
        prev.filter(s => s.task_id !== task.id)
      )
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
          <p>ניהול תלמידים, משימות ותוצרים</p>
        </div>

        <div className="header-actions">
          <button className="tool-button" onClick={refresh}>
            <RefreshCw size={18} />
            רענון
          </button>

          <button className="tool-button" onClick={onLogout}>
            <LogOut size={18} />
            יציאה
          </button>
        </div>
      </header>

      <main className="teacher-content">

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {/* =========================
            ניהול תלמידים
        ========================== */}

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <h2>
                <Users size={22} />
                ניהול תלמידים
              </h2>

              <p>
                {students.length} תלמידים במערכת
              </p>
            </div>

            <button
              className="tool-button"
              onClick={openAddStudent}
            >
              <UserPlus size={18} />
              הוספת תלמיד
            </button>
          </div>

          {busy ? (
            <div className="empty-card">
              טוען תלמידים…
            </div>
          ) : students.length === 0 ? (
            <div className="empty-card">
              עדיין לא נוספו תלמידים.
            </div>
          ) : (
            <div className="student-management-grid">
              {students.map(student => {
                const studentSubmissions =
                  byStudent[student.id] || []

                return (
                  <div
                    className="student-management-card"
                    key={student.id}
                  >
                    <div
                      className="management-flower"
                      style={{
                        background: student.color
                      }}
                    >
                      {student.flower}
                    </div>

                    <div className="management-student-info">
                      <strong>{student.name}</strong>

                      <span>
                        קוד כניסה: {student.login_code}
                      </span>

                      {studentSubmissions.length > 0 && (
                        <small>
                          {studentSubmissions.length} תוצרים
                        </small>
                      )}
                    </div>

                    <div className="management-actions">
                      <button
                        className="icon-button"
                        title="עריכת תלמיד"
                        onClick={() =>
                          openEditStudent(student)
                        }
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        className="icon-danger"
                        title="מחיקת תלמיד"
                        onClick={() =>
                          removeStudent(student)
                        }
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* =========================
            טופס תלמיד
        ========================== */}

        {showStudentForm && (
          <section className="dashboard-section student-form-section">
            <div className="section-heading">
              <div>
                <h2>
                  {editingStudent
                    ? '✏️ עריכת תלמיד'
                    : '➕ תלמיד חדש'}
                </h2>

                <p>
                  {editingStudent
                    ? 'עדכני את פרטי התלמיד'
                    : 'הוסיפי תלמיד חדש לכיתה'}
                </p>
              </div>

              <button
                className="icon-button"
                onClick={closeStudentForm}
                disabled={savingStudent}
                title="סגירה"
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="student-form"
              onSubmit={saveStudent}
            >
              <label>
                שם התלמיד
                <input
                  type="text"
                  value={studentForm.name}
                  onChange={event =>
                    setStudentForm(prev => ({
                      ...prev,
                      name: event.target.value
                    }))
                  }
                  placeholder="לדוגמה: יונתן"
                  autoFocus
                />
              </label>

              <label>
                קוד כניסה
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={studentForm.loginCode}
                  onChange={event =>
                    setStudentForm(prev => ({
                      ...prev,
                      loginCode: event.target.value
                        .replace(/\D/g, '')
                        .slice(0, 4)
                    }))
                  }
                  placeholder="4 ספרות"
                />

                <small>
                  התלמיד ישתמש בקוד הזה כדי להיכנס לחשבון שלו.
                </small>
              </label>

              <div className="flower-picker">
                <strong>בחרי פרח:</strong>

                <div className="flower-options">
                  {FLOWERS.map(item => (
                    <button
                      type="button"
                      key={item.flower}
                      className={`flower-option ${
                        studentForm.flower === item.flower
                          ? 'selected'
                          : ''
                      }`}
                      style={{
                        '--flower-color': item.color
                      }}
                      onClick={() =>
                        selectFlower(item)
                      }
                    >
                      {item.flower}
                    </button>
                  ))}
                </div>
              </div>

              <div className="student-form-actions">
                <button
                  type="button"
                  className="tool-button"
                  onClick={closeStudentForm}
                  disabled={savingStudent}
                >
                  ביטול
                </button>

                <button
                  type="submit"
                  className="tool-button primary"
                  disabled={savingStudent}
                >
                  <Plus size={18} />

                  {savingStudent
                    ? 'שומר…'
                    : editingStudent
                      ? 'שמירת שינויים'
                      : 'הוספת תלמיד'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* =========================
            העלאת משימה
        ========================== */}

        <TaskUploader
          onCreated={task =>
            setTasks(prev => [task, ...prev])
          }
        />

        {/* =========================
            משימות
        ========================== */}

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <h2>
                <FileText size={22} />
                משימות פעילות
              </h2>

              <p>{tasks.length} משימות</p>
            </div>
          </div>

          {busy ? (
            <div className="empty-card">
              טוען…
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-card">
              עדיין לא הועלו משימות.
            </div>
          ) : (
            <div className="task-admin-grid">
              {tasks.map(task => {
                const count = submissions.filter(
                  s => s.task_id === task.id
                ).length

                return (
                  <div
                    className="task-admin-card"
                    key={task.id}
                  >
                    <div className="task-file-preview">
                      {task.file_type?.includes('pdf')
                        ? '📄 PDF'
                        : '🖼️ תמונה'}
                    </div>

                    <div className="task-admin-info">
                      <h3>{task.title}</h3>

                      <p>{task.file_name}</p>

                      <span>
                        {count} מתוך {students.length} תלמידים הגישו
                      </span>
                    </div>

                    <button
                      className="icon-danger"
                      title="מחיקת משימה"
                      onClick={() =>
                        removeTask(task)
                      }
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* =========================
            תוצרים לפי תלמיד
        ========================== */}

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <h2>
                <Users size={22} />
                תוצרים לפי תלמיד
              </h2>

              <p>
                העבודות נשמרות בענן וניתן להוריד אותן בכל עת.
              </p>
            </div>
          </div>

          <div className="student-submissions-grid">
            {students.map(student => {
              const studentSubmissions =
                byStudent[student.id] || []

              return (
                <div
                  className="student-submissions-card"
                  key={student.id}
                >
                  <div className="student-heading">
                    <span
                      className="mini-flower"
                      style={{
                        background: student.color
                      }}
                    >
                      {student.flower}
                    </span>

                    <h3>{student.name}</h3>

                    <span className="count-badge">
                      {studentSubmissions.length}
                    </span>
                  </div>

                  {studentSubmissions.length === 0 ? (
                    <div className="no-submissions">
                      עדיין אין תוצרים
                    </div>
                  ) : (
                    <div className="submission-list">
                      {studentSubmissions.map(item => (
                        <div
                          className="submission-card"
                          key={item.id}
                        >
                          <img
                            src={item.image_url}
                            alt={`העבודה של ${student.name}`}
                          />

                          <div className="submission-meta">
                            <strong>
                              {item.task_title}
                            </strong>

                            <span>
                              {formatDate(
                                item.submitted_at
                              )}
                            </span>
                          </div>

                          <div className="submission-actions">
                            <button
                              className="icon-button"
                              title="הורדה"
                              onClick={() =>
                                download(
                                  item.image_url,
                                  `${student.name}_${item.task_title}.png`
                                )
                              }
                            >
                              <Download size={19} />
                            </button>

                            <button
                              className="icon-danger"
                              title="מחיקה"
                              onClick={() =>
                                removeSubmission(item)
                              }
                            >
                              <Trash2 size={19} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

      </main>
    </div>
  )
}
