import { useMemo } from 'react'
import { STUDENTS } from '../data/students'

export default function TaskList({ student, tasks, submissions, onSelect, onBack }) {
  const completed = useMemo(
    () => new Set(submissions.filter(s => s.student_id === student.id).map(s => s.task_id)),
    [submissions, student.id]
  )
  const pending = tasks.filter(task => !completed.has(task.id))

  return (
    <div className="screen task-screen">
      <button className="back-button" onClick={onBack}>← החלפת תלמיד</button>

      <div className="student-welcome">
        <div className="big-student-flower" style={{ background: student.color }}>
          {student.flower}
        </div>
        <div>
          <h1>שלום {student.name}! 🌸</h1>
          <p>בחר/י משימה שאת/ה רוצה לעשות</p>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="all-done">
          <div className="celebration">🎉</div>
          <h2>כל הכבוד, {student.name}!</h2>
          <p>אין לך עוד משימות כרגע.</p>
          <small>כשהמורה תעלה משימה חדשה, היא תופיע כאן.</small>
        </div>
      ) : (
        <div className="task-grid">
          {pending.map(task => (
            <button className="task-card" key={task.id} onClick={() => onSelect(task)}>
              <div className="task-icon">{task.file_type?.includes('pdf') ? '📄' : '📝'}</div>
              <div>
                <strong>{task.title}</strong>
                <span>{task.file_type?.includes('pdf') ? 'דף PDF' : 'דף עבודה'}</span>
              </div>
              <span className="task-arrow">←</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
