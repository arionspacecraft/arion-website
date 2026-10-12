import { formatDate, getRecruitState } from '../lib/recruit'

// 모집 상태 한 줄 요약. 홈 배너와 모집 페이지에서 함께 쓴다.
export default function RecruitStatus() {
  const state = getRecruitState()

  if (state.status === 'open') {
    return (
      <p className="recruit-status" data-status="open">
        <span className="badge badge--accent">모집 중</span>
        {state.round.title} · {formatDate(state.round.end)} 마감 (
        {state.daysLeft === 0 ? '오늘 마감' : `D-${state.daysLeft}`})
      </p>
    )
  }

  if (state.status === 'upcoming') {
    return (
      <p className="recruit-status" data-status="upcoming">
        <span className="badge">모집 예정</span>
        {state.round.title} · {formatDate(state.round.start)} 시작 (D-{state.daysUntil})
      </p>
    )
  }

  return (
    <p className="recruit-status" data-status="closed">
      <span className="badge">모집 마감</span>
      다음 모집 일정은 추후 공지합니다.
    </p>
  )
}
