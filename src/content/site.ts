export const site = {
  name: 'ARION',
  nameKo: '아리온',
  org: 'DGIST',
  tagline: '온 우주를 탐구하다',
  description: 'DGIST 최초, 로켓을 직접 설계하고 발사하는 항공우주 동아리',
  founded: 2026,
  // 비어 있는 항목은 화면에 표시되지 않는다.
  contact: {
    email: '',
    instagram: '',
    location: '대구경북과학기술원(DGIST)',
    leaders: [
      { role: '대표', name: '길한겸', phone: '010-3222-6091', email: 'hangyum070907@dgist.ac.kr' },
      { role: '부대표', name: '정우진', phone: '010-3184-3270', email: 'jeromesone@dgist.ac.kr' },
    ],
  },
}

export const nav = [
  { to: '/about', label: '소개' },
  { to: '/projects', label: '프로젝트' },
  { to: '/teams', label: '팀' },
  { to: '/news', label: '소식' },
  { to: '/recruit', label: '모집' },
  { to: '/qna', label: '문의' },
]
