import PageHeader from '../components/PageHeader'
import Section from '../components/Section'
import { site } from '../content/site'
import { usePageTitle } from '../lib/usePageTitle'

export default function Contact() {
  usePageTitle('문의')
  const { email, instagram, location, leaders } = site.contact

  return (
    <>
      <PageHeader eyebrow="Contact" title="문의" lead="협업, 후원, 입부 문의 모두 환영합니다." />
      <Section>
        <div className="grid grid--2 contact-people">
          {leaders.map((person) => (
            <article className="card contact-person" key={person.role}>
              <p className="eyebrow">{person.role}</p>
              <h2>{person.name}</h2>
              <dl>
                <div><dt>전화</dt><dd><a href={`tel:${person.phone.replaceAll('-', '')}`}>{person.phone}</a></dd></div>
                <div><dt>이메일</dt><dd><a href={`mailto:${person.email}`}>{person.email}</a></dd></div>
              </dl>
            </article>
          ))}
        </div>
        <dl className="contact">
          {email && (
            <div>
              <dt>이메일</dt>
              <dd>
                <a href={`mailto:${email}`}>{email}</a>
              </dd>
            </div>
          )}
          {instagram && (
            <div>
              <dt>인스타그램</dt>
              <dd>
                <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer">
                  @{instagram}
                </a>
              </dd>
            </div>
          )}
          {location && (
            <div>
              <dt>위치</dt>
              <dd>{location}</dd>
            </div>
          )}
        </dl>
        {!email && !instagram && leaders.length === 0 && <p className="empty">연락처는 곧 공개됩니다.</p>}
      </Section>
    </>
  )
}
