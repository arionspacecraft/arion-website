import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useLanguage } from '../lib/language'
import { qnaError } from '../lib/qna'
import type { QnaApi } from '../lib/qna'

export default function StaffLogin({ api, staff }: { api: QnaApi; staff: boolean }) {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)
  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current) return
    pending.current = true; setBusy(true); setError('')
    try { await api.signIn(email, password); setPassword('') }
    catch (cause) { setError(qnaError(cause)); setPassword('') }
    finally { pending.current = false; setBusy(false) }
  }
  async function signOut() {
    if (pending.current) return
    pending.current = true; setBusy(true); setError('')
    try { await api.signOut() } catch (cause) { setError(qnaError(cause)) }
    finally { pending.current = false; setBusy(false) }
  }
  return <div className="qna__staff-login">
    {staff ? <div className="qna__staff-actions"><span>{t('ARION 운영진으로 로그인했습니다.')}</span><button type="button" className="button" disabled={busy} onClick={() => void signOut()}>{t('로그아웃')}</button></div>
      : <details><summary>{t('운영진 로그인')}</summary><form className="qna__login-form" onSubmit={signIn}>
        <label className="qna__field" htmlFor="qna-email">{t('이메일')}<input id="qna-email" className="qna__input" type="email" required autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} disabled={busy} /></label>
        <label className="qna__field" htmlFor="qna-password">{t('비밀번호')}<input id="qna-password" className="qna__input" type="password" required autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} disabled={busy} /></label>
        <button className="button" type="submit" disabled={busy}>{t(busy ? '로그인 중…' : '로그인')}</button>
      </form></details>}
    {error && <p className="qna__status" role="alert">{t(error)}</p>}
  </div>
}
