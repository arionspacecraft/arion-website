export type RecruitRound = {
  title: string
  start: string // YYYY-MM-DD
  end: string // YYYY-MM-DD (마감일 포함)
  applyUrl: string
}

// 새 모집이 열리면 여기에 추가한다. 모집 상태는 날짜로 자동 계산된다.
export const rounds: RecruitRound[] = [
  { title: '2026 신입 부원 모집', start: '2026-04-23', end: '2026-04-25', applyUrl: '' },
]

export const seeking = [
  { title: '항공우주에 끌리는 분', body: '관심만으로도 충분합니다.' },
  { title: '직접 만들고 싶은 분', body: '설계부터 제작까지 함께합니다.' },
  { title: '열정 있는 분', body: '경험 없어도 괜찮습니다.' },
]

export const steps = [
  { title: '지원', body: '지원서 제출' },
  { title: '면접', body: '지원자 개별 공지' },
  { title: '최종 합류', body: '함께 우주를 향해' },
]

// TODO: 실제 FAQ로 교체
export const faq = [
  { q: '로켓 관련 경험이 없어도 지원할 수 있나요?', a: '네. 경험보다 관심과 열정을 봅니다.' },
  { q: '전공 제한이 있나요?', a: '없습니다. 다양한 전공의 부원이 함께합니다.' },
  { q: '활동은 얼마나 자주 하나요?', a: '팀별 정기 모임과 전체 모임이 있으며, 자세한 일정은 합류 후 안내합니다.' },
]
