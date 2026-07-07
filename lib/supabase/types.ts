export type StageStatus = 'not_started' | 'in_progress' | 'complete'

export type StageRow = {
  id: string
  user_id: string
  stage_number: number
  status: StageStatus
  artifact: Record<string, unknown>
  updated_at: string
}

export type MessageRow = {
  id: string
  user_id: string
  stage_number: number
  role: 'user' | 'assistant'
  content: string
  streaming: boolean
  created_at: string
}

export type SharedPitchRow = {
  id: string
  stage_row_id: string
  share_slug: string
  show_name: boolean
  student_name: string | null
  created_at: string
  enabled: boolean
}
