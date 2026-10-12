import { Link } from 'react-router-dom'
import type { NewsPost } from '../content/news'
import { formatDate } from '../lib/recruit'

export default function NewsItem({ post }: { post: NewsPost }) {
  return (
    <li className="news-item">
      <Link to={`/news/${post.slug}`} className="news-item__link">
        <p className="card__meta">
          <span className="badge">{post.category}</span>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </p>
        <div className="news-item__body"><h3>{post.title}</h3><p className="muted">{post.summary}</p></div>
        <span className="news-item__arrow" aria-hidden="true">↗</span>
      </Link>
    </li>
  )
}
