export type ActivityLog = {
  id: string
  user_id: string | null
  action: string
  entity: string | null
  entity_id: string | null
  meta: any
  created_at: string
}

export type Grade = {
  id: string
  student_id: string
  subject_id: string
  term: string
  score: number
  max_score: number
  letter: string | null
  comments: string | null
  recorded_at: string
}
