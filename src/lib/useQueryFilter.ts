import { useSearchParams } from 'react-router-dom'
import { readNavigationFilter } from '../content/navigationFilters'
import type { NavigationFilter } from '../content/navigationFilters'

export function useQueryFilter<T extends string>(key: string, options: NavigationFilter<T>[]) {
  const [searchParams, setSearchParams] = useSearchParams()
  const value = readNavigationFilter(searchParams, key, options)
  const setValue = (nextValue: T | null) => {
    const nextParams = new URLSearchParams(searchParams)
    const slug = options.find(option => option.value === nextValue)?.slug
    if (slug) nextParams.set(key, slug)
    else nextParams.delete(key)
    setSearchParams(nextParams)
  }
  return [value, setValue] as const
}
