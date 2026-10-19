import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

export type QuestionDraft = { nickname: string; title: string; body: string }
export type PublicQuestion = QuestionDraft & {
  id: string
  created_at: string
  answer: string | null
  answered_at: string | null
}
export type QuestionPage = { questions: PublicQuestion[]; total: number }
export interface QnaApi {
  list(query: string, page: number): Promise<QuestionPage>
  submit(draft: QuestionDraft, requestId: string): Promise<string>
  answer(id: string, body: string): Promise<void>
  hide(id: string): Promise<void>
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>
  watchStaff(listener: (staff: boolean) => void): () => void
}
export const QNA_PAGE_SIZE = 20

export function qnaError(error: unknown): string {
  const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : ''
  if (message.includes('QNA_RATE_LIMIT')) return '잠시 후 다시 질문해 주세요. 1분에 1개, 하루에 10개까지 등록할 수 있습니다.'
  if (message.includes('QNA_FORBIDDEN')) return '답변 권한이 없습니다. 등록된 운영진 계정으로 로그인해 주세요.'
  if (message.includes('QNA_NOT_FOUND')) return '질문이 숨겨졌거나 더 이상 공개되지 않습니다. 목록을 새로고침해 주세요.'
  if (message.includes('QNA_INVALID')) return '입력 내용을 확인해 주세요. 빈 내용이나 제한을 넘는 글은 등록할 수 없습니다.'
  return '요청을 완료하지 못했습니다. 연결을 확인하고 다시 시도해 주세요. 작성 내용은 유지됩니다.'
}

export function createQnaApi(client: SupabaseClient): QnaApi {
  async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
    const { data, error } = await client.rpc(name, args)
    if (error) throw error
    return data as T
  }
  return {
    list: (query, page) => rpc('qna_list', { p_query: query.trim().slice(0, 100), p_page: page }),
    async submit(draft, requestId) {
      const { data, error } = await client.auth.getSession()
      if (error) throw error
      if (!data.session) {
        const result = await client.auth.signInAnonymously()
        if (result.error) throw result.error
      }
      return rpc<string>('qna_submit', { p_nickname: draft.nickname, p_title: draft.title, p_body: draft.body, p_request_id: requestId })
    },
    async answer(id, body) { await rpc('qna_answer', { p_id: id, p_body: body }) },
    async hide(id) { await rpc('qna_hide', { p_id: id }) },
    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw new Error('QNA_FORBIDDEN')
      if (!await rpc<boolean>('qna_is_staff')) {
        await client.auth.signOut({ scope: 'local' })
        throw new Error('QNA_FORBIDDEN')
      }
    },
    async signOut() {
      const { error } = await client.auth.signOut({ scope: 'local' })
      if (error) throw error
    },
    watchStaff(listener) {
      let active = true
      let revision = 0
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        const current = ++revision
        listener(false)
        // Do not call Auth methods synchronously from its locked callback.
        if (session && !session.user.is_anonymous) {
          queueMicrotask(() => {
            void rpc<boolean>('qna_is_staff').then(staff => {
              if (active && current === revision) listener(staff === true)
            }).catch(() => { if (active && current === revision) listener(false) })
          })
        }
      })
      return () => { active = false; revision++; data.subscription.unsubscribe() }
    },
  }
}

let api: QnaApi | null | undefined
export function getQnaApi(): QnaApi | null {
  if (api !== undefined) return api
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  api = url && key ? createQnaApi(createClient(url, key, {
    auth: { storageKey: 'arion-qna-auth', detectSessionInUrl: false },
  })) : null
  return api
}
