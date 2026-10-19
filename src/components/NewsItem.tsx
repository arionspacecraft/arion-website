import { useLanguage } from '../lib/language'
import { Link } from 'react-router-dom'
import type { NewsPost } from '../content/news'
import { formatDate } from '../lib/recruit'

export default function NewsItem({ post }: { post: NewsPost }) {
  const { t } = useLanguage()
  return (
    <li className="news-item">
      <Link to={`/news/${post.slug}`} className="news-item__link">
        <span className="badge news-item__category">{t(post.category)}</span>
        <div className="news-item__body"><h3>{t(post.title)}</h3><p className="muted">{t(post.summary)}</p></div>
        <time className="news-item__date" dateTime={post.date}>{formatDate(post.date)}</time>
        <span className="news-item__arrow" aria-hidden="true">↗</span>
      </Link>
    </li>
  )
}
