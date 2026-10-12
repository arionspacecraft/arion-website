export type ProjectStatus = '진행 중' | '완료' | '계획'

export type Project = {
  slug: string
  title: string
  status: ProjectStatus
  period: string
  summary: string
  body: string[]
  specs: [label: string, value: string][]
  links: { label: string; href: string }[]
  featured?: boolean
}

// TODO: 설명·제원은 초안이다. 실제 내용으로 교체할 것.
export const projects: Project[] = [
  {
    slug: 'i-class-motor',
    title: 'I-Class 고체 모터',
    status: '진행 중',
    period: '2026',
    summary: 'I 클래스 고체 로켓 모터 설계 및 제작',
    body: ['KNSB 추진제 기반 I 클래스 모터를 자체 설계하고 지상 연소 시험으로 성능을 검증합니다.'],
    specs: [
      ['등급', 'I Class'],
      ['추진제', 'KNSB'],
    ],
    links: [],
    featured: true,
  },
  {
    slug: 'flight-computer',
    title: '비행 컴퓨터 · PDB',
    status: '진행 중',
    period: '2026',
    summary: '자체 설계 비행 컴퓨터와 전원 분배 보드',
    body: ['비행 데이터 기록과 사출 제어를 담당하는 비행 컴퓨터와 전원 분배 보드(PDB)를 개발합니다.'],
    specs: [],
    links: [],
  },
  {
    slug: 'thrust-stand',
    title: '추력 측정 스탠드',
    status: '진행 중',
    period: '2026',
    summary: '로드셀 기반 지상 연소 시험 장비',
    body: ['로드셀을 캘리브레이션하여 모터 추력 곡선을 측정합니다.'],
    specs: [],
    links: [],
  },
  {
    slug: 'hybrid-study',
    title: '하이브리드 로켓 스터디',
    status: '계획',
    period: '2026.10 —',
    summary: '하이브리드 추진 연료·산화제 조합 연구',
    body: ['하이브리드 로켓의 연료·산화제 조합을 비교하고 차기 엔진 개발 방향을 정합니다.'],
    specs: [],
    links: [],
  },
]

export const projectStatuses: ProjectStatus[] = ['진행 중', '완료', '계획']
