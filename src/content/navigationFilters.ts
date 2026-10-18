import type { ProjectStatus } from './projects'
import type { NewsCategory } from './news'

export type NavigationFilter<T extends string> = { value: T; slug: string }

export const projectStatusFilters: NavigationFilter<ProjectStatus>[] = [
  { value: '진행 중', slug: 'in-progress' },
  { value: '완료', slug: 'completed' },
  { value: '계획', slug: 'planned' },
  { value: '아카이브', slug: 'archived' },
]

export const newsCategoryFilters: NavigationFilter<NewsCategory>[] = [
  { value: '공지', slug: 'announcements' },
  { value: '활동', slug: 'activities' },
  { value: '모집', slug: 'recruitment' },
]

export function readNavigationFilter<T extends string>(params: URLSearchParams, key: string, options: NavigationFilter<T>[]): T | null {
  return options.find(option => option.slug === params.get(key))?.value ?? null
}
