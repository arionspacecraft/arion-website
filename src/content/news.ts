export type NewsCategory = '공지' | '활동' | '모집'

export type NewsPost = {
  slug: string
  title: string
  date: string // YYYY-MM-DD
  category: NewsCategory
  summary: string
  body: string[]
}

// TODO: 예시 글이다. 실제 소식으로 교체할 것. 새 글은 배열에 추가만 하면 된다.
export const news: NewsPost[] = [
  {
    slug: 'hybrid-study-start',
    title: '하이브리드 로켓 스터디 시작',
    date: '2026-10-01',
    category: '활동',
    summary: '하이브리드 추진 연료·산화제 비교 스터디를 시작했습니다.',
    body: ['하이브리드 로켓의 연료·산화제 조합을 비교하는 스터디를 시작했습니다.'],
  },
  {
    slug: 'club-booth',
    title: '동아리 부스 운영',
    date: '2026-09-09',
    category: '활동',
    summary: '교내 부스에서 ARION의 활동을 소개했습니다.',
    body: ['교내 부스를 운영하며 ARION의 로켓과 활동을 소개했습니다.'],
  },
  {
    slug: 'recruit-2026',
    title: '2026 신입 부원 모집',
    date: '2026-04-23',
    category: '모집',
    summary: 'ARION과 함께 DGIST 최초의 역사를 만들어갈 신입 부원을 모집합니다.',
    body: [
      '지원 기간: 2026.04.23 — 04.25',
      '면접 일정은 지원자에게 개별 공지합니다.',
    ],
  },
]

export const newsCategories: NewsCategory[] = ['공지', '활동', '모집']

export const sortedNews = [...news].sort((a, b) => b.date.localeCompare(a.date))
