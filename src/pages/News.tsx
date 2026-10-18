import { useLanguage } from '../lib/language'
import FilterTabs from '../components/FilterTabs'
import NewsItem from '../components/NewsItem'
import PageHeader from '../components/PageHeader'
import Section from '../components/Section'
import { sortedNews } from '../content/news'
import { newsCategoryFilters } from '../content/navigationFilters'
import { useQueryFilter } from '../lib/useQueryFilter'
import { usePageTitle } from '../lib/usePageTitle'

export default function News() {
  const { t } = useLanguage()
  usePageTitle('소식')
  const [category, setCategory] = useQueryFilter('category', newsCategoryFilters)
  const shown = category ? sortedNews.filter((p) => p.category === category) : sortedNews

  return (
    <>
      <PageHeader eyebrow="News" title={t("소식")} lead="공지와 활동 기록" />
      <Section>
        <FilterTabs options={newsCategoryFilters.map(option => option.value)} value={category} onChange={setCategory} />
        {shown.length > 0 ? (
          <ul className="news-list">
            {shown.map((post) => (
              <NewsItem key={post.slug} post={post} />
            ))}
          </ul>
        ) : (
          <p className="empty">{t("해당하는 소식이 없습니다.")}</p>
        )}
      </Section>
    </>
  )
}
