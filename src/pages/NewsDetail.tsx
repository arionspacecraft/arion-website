import { Link, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Section from '../components/Section'
import { sortedNews } from '../content/news'
import { formatDate } from '../lib/recruit'
import { usePageTitle } from '../lib/usePageTitle'
import NotFound from './NotFound'

export default function NewsDetail() {
  const { slug } = useParams()
  const index = sortedNews.findIndex((p) => p.slug === slug)
  const post = sortedNews[index]
  usePageTitle(post?.title ?? '페이지를 찾을 수 없습니다')

  if (!post) return <NotFound />

  const newer = sortedNews[index - 1]
  const older = sortedNews[index + 1]

  return (
    <>
      <PageHeader eyebrow={`${post.category} · ${formatDate(post.date)}`} title={post.title} />
      <Section>
        <article className="prose">
          {post.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </article>
        <nav className="pager" aria-label="다른 소식">
          {older ? <Link to={`/news/${older.slug}`}>← {older.title}</Link> : <span />}
          <Link to="/news">목록</Link>
          {newer ? <Link to={`/news/${newer.slug}`}>{newer.title} →</Link> : <span />}
        </nav>
      </Section>
    </>
  )
}
