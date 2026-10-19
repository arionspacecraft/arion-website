import { useRef, useState } from 'react'
import { useLanguage } from '../lib/language'
import { qnaError } from '../lib/qna'
import type { QnaApi } from '../lib/qna'

export default function StaffLogin({ api }: { api: QnaApi }) {
  const { t } = useLanguage()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)
  async function signOut() {
    if (pending.current) return
    pending.current = true; setBusy(true); setError('')
    try { await api.signOut() } catch (cause) { setError(qnaError(cause)) }
    finally { pending.current = false; setBusy(false) }
  }
  return <div className="qna__staff-login">
    <div className="qna__staff-actions"><span>{t('ARION 운영진으로 로그인했습니다.')}</span><button type="button" className="button" disabled={busy} onClick={() => void signOut()}>{t('로그아웃')}</button></div>
    {error && <p className="qna__status" role="alert">{t(error)}</p>}
  </div>
}
