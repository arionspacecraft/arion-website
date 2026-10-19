import ContactNavigation from '../components/ContactNavigation'
import PageHeader from '../components/PageHeader'
import QnaBoard from '../components/QnaBoard'
import LiveQnaBoard from '../components/LiveQnaBoard'
import { getQnaApi } from '../lib/qna'
import { usePageTitle } from '../lib/usePageTitle'
import '../styles/qna.css'

export default function Qna() {
  usePageTitle('Q&A')
  const api = getQnaApi()
  return (
    <>
      <PageHeader eyebrow="Q&A" title="Q&A" lead="ARION에 궁금한 점을 남겨 주세요." />
      <ContactNavigation />
      {api ? <LiveQnaBoard api={api} /> : <QnaBoard />}
    </>
  )
}
