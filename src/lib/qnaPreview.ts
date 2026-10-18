export const QNA_PREVIEW_STORAGE_KEY = 'arion-qna-preview-v1'

export type PreviewQuestion = {
  id: string
  nickname: string
  title: string
  body: string
  createdAt: string
}

function isPreviewQuestion(value: unknown): value is PreviewQuestion {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<PreviewQuestion>
  return typeof item.id === 'string' && item.id.length > 0 &&
    typeof item.nickname === 'string' && item.nickname.length <= 40 &&
    typeof item.title === 'string' && item.title.trim().length > 0 && item.title.length <= 100 &&
    typeof item.body === 'string' && item.body.trim().length > 0 && item.body.length <= 2000 &&
    typeof item.createdAt === 'string' && Number.isFinite(Date.parse(item.createdAt))
}

export function readPreviewQuestions(): PreviewQuestion[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(QNA_PREVIEW_STORAGE_KEY) ?? '[]')
    return Array.isArray(stored) ? stored.filter(isPreviewQuestion) : []
  } catch {
    return []
  }
}

export function savePreviewQuestions(questions: PreviewQuestion[]): boolean {
  try {
    localStorage.setItem(QNA_PREVIEW_STORAGE_KEY, JSON.stringify(questions))
    return true
  } catch {
    return false
  }
}
