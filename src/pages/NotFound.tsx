import { useLanguage } from '../lib/language'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Section from '../components/Section'
import { usePageTitle } from '../lib/usePageTitle'

export default function NotFound() {
  const { t } = useLanguage()
  usePageTitle('페이지를 찾을 수 없습니다')

  return (
    <>
      <PageHeader eyebrow="404" title={t("페이지를 찾을 수 없습니다")} />
      <Section>
        <Link to="/" className="button">{t("홈으로")} </Link>
      </Section>
    </>
  )
}
