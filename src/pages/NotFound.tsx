import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Section from '../components/Section'
import { usePageTitle } from '../lib/usePageTitle'

export default function NotFound() {
  usePageTitle('페이지를 찾을 수 없습니다')

  return (
    <>
      <PageHeader eyebrow="404" title="페이지를 찾을 수 없습니다" />
      <Section>
        <Link to="/" className="button">
          홈으로
        </Link>
      </Section>
    </>
  )
}
