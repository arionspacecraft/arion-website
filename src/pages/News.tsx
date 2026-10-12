import { useState } from 'react'
import FilterTabs from '../components/FilterTabs'
import NewsItem from '../components/NewsItem'
import PageHeader from '../components/PageHeader'
import Section from '../components/Section'
import { newsCategories, sortedNews } from '../content/news'
import type { NewsCategory } from '../content/news'
import { usePageTitle } from '../lib/usePageTitle'

export default function News() {
  usePageTitle('소식')
  const [category, setCategory] = useState<NewsCategory | null>(null)
  const shown = category ? sortedNews.filter((p) => p.category === category) : sortedNews

  return (
    <>
      <PageHeader eyebrow="News" title="소식" lead="공지와 활동 기록" />
      <Section>
        <FilterTabs options={newsCategories} value={category} onChange={setCategory} />
        {shown.length > 0 ? (
          <ul className="news-list">
            {shown.map((post) => (
              <NewsItem key={post.slug} post={post} />
            ))}
          </ul>
        ) : (
          <p className="empty">해당하는 소식이 없습니다.</p>
        )}
      </Section>
    </>
  )
}
