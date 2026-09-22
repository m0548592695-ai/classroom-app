import { supabase, STORAGE_BUCKET, isSupabaseConfigured } from './supabase'

export function assertConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase עדיין לא הוגדר. העתיקי את .env.example ל-.env והכניסי את פרטי הפרויקט.')
  }
}

export async function uploadFile(file, folder) {
  assertConfigured()
  const safeName = file.name.replace(/[^\w\u0590-\u05FF.-]+/g, '_')
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || 'application/octet-stream'
  })
  if (error) throw error
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return { path, url: data.publicUrl }
}

export async function deleteStorageFile(path) {
  assertConfigured()
  if (!path) return
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path])
  if (error) throw error
}

export async function listTasks() {
  assertConfigured()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createTask({ title, file }) {
  const uploaded = await uploadFile(file, 'tasks')
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title,
      file_name: file.name,
      file_type: file.type,
      file_url: uploaded.url,
      storage_path: uploaded.path
    })
    .select()
    .single()
  if (error) {
    await deleteStorageFile(uploaded.path).catch(() => {})
    throw error
  }
  return data
}

export async function listSubmissions() {
  assertConfigured()
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('submitted_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function submitWork({ studentId, taskId, title, blob }) {
  const file = new File([blob], `${studentId}-${taskId}-${Date.now()}.png`, { type: 'image/png' })
  const uploaded = await uploadFile(file, `submissions/${studentId}`)
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      student_id: studentId,
      task_id: taskId,
      task_title: title,
      image_url: uploaded.url,
      storage_path: uploaded.path
    })
    .select()
    .single()
  if (error) {
    await deleteStorageFile(uploaded.path).catch(() => {})
    throw error
  }
  return data
}

export async function deleteSubmission(submission) {
  await deleteStorageFile(submission.storage_path)
  const { error } = await supabase
    .from('submissions')
    .delete()
    .eq('id', submission.id)
  if (error) throw error
}

export async function deleteTask(task) {
  await deleteStorageFile(task.storage_path)
  const { error: submissionError } = await supabase
    .from('submissions')
    .select('id, storage_path')
    .eq('task_id', task.id)
  if (submissionError) throw submissionError

  const { data: related } = await supabase
    .from('submissions')
    .select('id, storage_path')
    .eq('task_id', task.id)

  for (const submission of related || []) {
    await deleteStorageFile(submission.storage_path).catch(() => {})
  }

  const { error: deleteSubsError } = await supabase
    .from('submissions')
    .delete()
    .eq('task_id', task.id)
  if (deleteSubsError) throw deleteSubsError

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', task.id)
  if (error) throw error
}
export async function listStudents() {
  assertConfigured()

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error

  return data || []
}
export async function createStudent({ name, flower, color, loginCode }) {
  assertConfigured()

  const id = `student-${crypto.randomUUID()}`

  const { data, error } = await supabase
    .from('students')
    .insert({
      id,
      name,
      flower,
      color,
      login_code: loginCode
    })
    .select()
    .single()

  if (error) throw error

  return data
}

export async function updateStudent({
  id,
  name,
  flower,
  color,
  loginCode
}) {
  assertConfigured()

  const { data, error } = await supabase
    .from('students')
    .update({
      name,
      flower,
      color,
      login_code: loginCode
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data
}

export async function deleteStudent(id) {
  assertConfigured()

  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id)

  if (error) throw error
}
