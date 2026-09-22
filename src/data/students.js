export const STUDENTS = [
  { id: 'yanai', name: 'ינאי', flower: '🌸', color: '#ec4899' },
  { id: 'shilo', name: 'שילה', flower: '🌼', color: '#eab308' },
  { id: 'david', name: 'דוד', flower: '🌷', color: '#3b82f6' },
  { id: 'par', name: 'פאר', flower: '🌺', color: '#8b5cf6' },
  { id: 'lavi', name: 'לביא', flower: '🌻', color: '#f97316' }
]

export function getStudent(id) {
  return STUDENTS.find(s => s.id === id)
}
