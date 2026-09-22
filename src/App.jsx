import { useState } from 'react'
import { isSupabaseConfigured } from './lib/supabase'
import { listSubmissions, listTasks, submitWork } from './lib/api'
import StudentSelector from './components/StudentSelector'
import TeacherLogin from './components/TeacherLogin'
import TeacherDashboard from './components/TeacherDashboard'
import TaskList from './components/TaskList'
import WorksheetViewer from './components/WorksheetViewer'
import { listSubmissions, listTasks, submitWork } from './lib/api'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [student, setStudent] = useState(null)
  const [task, setTask] = useState(null)
  const [tasks, setTasks] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadStudentData() {
    setLoading(true)
    setError('')

    try {
      const [t, s] = await Promise.all([
        listTasks(),
        listSubmissions()
      ])

      setTasks(t)
      setSubmissions(s)
    } catch (e) {
      setError(e.message || 'לא הצלחתי להתחבר למערכת.')
    } finally {
      setLoading(false)
    }
  }

  async function enterStudent(selected) {
    setStudent(selected)
    await loadStudentData()
    setScreen('tasks')
  }

  function downloadBlob(blob, studentName, taskTitle) {
    const date = new Date()
    const stamp = date.toISOString().slice(0, 19).replace(/[T:]/g, '-')
    const safeTask = taskTitle.replace(/[^\w\u0590-\u05FF-]+/g, '_')

    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${studentName}_${safeTask}_${stamp}.png`

    document.body.appendChild(a)
    a.click()
    a.remove()

    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  async function submitCurrentWork({ blob }) {
    try {
      const saved = await submitWork({
        studentId: student.id,
        taskId: task.id,
        title: task.title,
        blob
      })

      downloadBlob(blob, student.name, task.title)

      setSubmissions(prev => [saved, ...prev])

      setTask(null)
      setScreen('tasks')

      window.alert('כל הכבוד! העבודה נשלחה בהצלחה 🎉')
    } catch (e) {
      setError(e.message || 'אירעה שגיאה בשליחת העבודה.')
    }
  }

  /*
   * Supabase setup check
   */
  if (!isSupabaseConfigured) {
    return (
      <div className="screen">
        <div className="setup-card">
          <div className="setup-icon">🌸</div>

          <h1>הכיתה שלי</h1>
          <h2>כמעט מוכנים!</h2>

          <p>
            האפליקציה מוכנה, אבל עדיין לא חיברת אותה ל-Supabase.
            אחרי שתיצרי פרויקט ותמלאי את קובץ <code>.env</code>,
            האפליקציה תעבוד.
          </p>

          <div className="setup-steps">
            <div>1️⃣ צרי פרויקט Supabase</div>
            <div>2️⃣ הריצי את <code>supabase/schema.sql</code></div>
            <div>3️⃣ העתיקי <code>.env.example</code> ל-<code>.env</code></div>
            <div>4️⃣ הכניסי URL ו-Anon Key</div>
            <div>5️⃣ הריצי <code>npm run dev</code></div>
          </div>
        </div>
      </div>
    )
  }

  /*
   * Teacher area
   */
  if (screen === 'teacher') {
    return (
      <TeacherDashboard
        onLogout={() => setScreen('home')}
      />
    )
  }

  /*
   * Teacher login
   */
  if (screen === 'teacher-login') {
    return (
      <TeacherLogin
        onSuccess={() => setScreen('teacher')}
        onBack={() => setScreen('home')}
      />
    )
  }

  /*
   * Student selection
   */
  if (screen === 'student-select') {
    return (
      <StudentSelector
        onSelect={enterStudent}
        onBack={() => setScreen('home')}
      />
    )
  }

  /*
   * Worksheet screen
   *
   * IMPORTANT:
   * We explicitly use a "worksheet" screen.
   * This prevents the tasks screen from rendering again
   * after a student selects a task.
   */
  if (screen === 'worksheet' && task) {
    return (
      <WorksheetViewer
        task={task}
        student={student}
        onBack={() => {
          setTask(null)
          setScreen('tasks')
        }}
        onSubmitted={submitCurrentWork}
      />
    )
  }

  /*
   * Student task list
   */
  if (screen === 'tasks') {
    return (
      <TaskList
        student={student}
        tasks={tasks}
        submissions={submissions}
        onSelect={(selectedTask) => {
          setTask(selectedTask)
          setScreen('worksheet')
        }}
        onBack={() => {
          setStudent(null)
          setTask(null)
          setScreen('student-select')
        }}
      />
    )
  }

  /*
   * Home screen
   */
  return (
    <div className="home-screen">
      <div className="home-decoration flower-one">🌸</div>
      <div className="home-decoration flower-two">🌼</div>
      <div className="home-decoration flower-three">🌷</div>

      <div className="home-card">
        <div className="logo-flower">🌺</div>

        <h1>הכיתה שלי</h1>

        <p>
          משימות, ציורים והמון הצלחות! ✨
        </p>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {loading && (
          <div className="loading-text">
            טוען…
          </div>
        )}

        <div className="home-buttons">
          <button
            className="home-button student"
            onClick={() => setScreen('student-select')}
          >
            <span>🌸</span>
            <strong>כניסת תלמיד</strong>
          </button>

          <button
            className="home-button teacher"
            onClick={() => setScreen('teacher-login')}
          >
            <span>👩‍🏫</span>
            <strong>כניסת מורה</strong>
          </button>
        </div>
      </div>
    </div>
  )
}
