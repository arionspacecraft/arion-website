import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Section from '../components/Section'
import QnaAdminBoard from '../components/QnaAdminBoard'
import { getQnaApi } from '../lib/qna'
import { useLanguage } from '../lib/language'
import { usePageTitle } from '../lib/usePageTitle'
import '../styles/qna.css'

export default function QnaAdmin() {
  usePageTitle('Q&A 관리')
  const { t } = useLanguage()
  const api = getQnaApi()
  return <>
    <PageHeader eyebrow="ARION TEAM" title="Q&A 관리" lead="접수된 질문을 확인하고 답변을 게시합니다." />
    {api ? <QnaAdminBoard api={api} /> : <Section className="qna"><p>{t('게시판 서버 연결을 준비하고 있습니다.')}</p><Link to="/qna">{t('공개 Q&A 보기')}</Link></Section>}
  </>
}
