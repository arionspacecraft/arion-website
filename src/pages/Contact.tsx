import { useLanguage } from '../lib/language'
import PageHeader from '../components/PageHeader'
import ContactNavigation from '../components/ContactNavigation'
import '../styles/qna.css'
import Section from '../components/Section'
import { site } from '../content/site'
import { usePageTitle } from '../lib/usePageTitle'

export default function Contact() {
  const { t } = useLanguage()
  usePageTitle('직접 문의')
  const { email, instagram, location, leaders } = site.contact

  return (
    <>
      <PageHeader eyebrow="Contact" title={t("직접 문의")} lead="협업, 후원, 입부 문의 모두 환영합니다." />
      <ContactNavigation />
      <Section id="contact-info" eyebrow="CONTACT" title="직접 문의">
        <div className="grid grid--2 contact-people">
          {leaders.map((person) => (
            <article className="card contact-person" key={person.role}>
              <p className="eyebrow">{t(person.role)}</p>
              <h3 className="contact-person__name">{t(person.name)}</h3>
              <dl>
                <div><dt>{t("전화")}</dt><dd><a href={`tel:${person.phone.replaceAll('-', '')}`}>{person.phone}</a></dd></div>
                <div><dt>{t("이메일")}</dt><dd><a href={`mailto:${person.email}`}>{person.email}</a></dd></div>
              </dl>
            </article>
          ))}
        </div>
        <dl className="contact">
          {email && (
            <div>
              <dt>{t("이메일")}</dt>
              <dd>
                <a href={`mailto:${email}`}>{email}</a>
              </dd>
            </div>
          )}
          {instagram && (
            <div>
              <dt>{t("인스타그램")}</dt>
              <dd>
                <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer">
                  @{instagram}
                </a>
              </dd>
            </div>
          )}
          {location && (
            <div>
              <dt>{t("위치")}</dt>
              <dd>{t(location)}</dd>
            </div>
          )}
        </dl>
        {!email && !instagram && leaders.length === 0 && <p className="empty">{t("연락처는 곧 공개됩니다.")}</p>}
      </Section>
    </>
  )
}
