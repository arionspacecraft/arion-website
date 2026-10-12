export type Team = {
  name: string
  nameEn: string
  summary: string
  tasks: string[]
}

export const teams: Team[] = [
  {
    name: '동체팀',
    nameEn: 'Airframe',
    summary: '로켓의 동체와 구조를 설계하고 제작합니다.',
    tasks: ['동체 설계 · 제작', '구조 해석', '기체 조립'],
  },
  {
    name: '추진팀',
    nameEn: 'Propulsion',
    summary: '로켓 모터를 설계하고 연소 시험을 수행합니다.',
    tasks: ['추진제 제조', '그레인 · 노즐 설계', '지상 연소 시험'],
  },
  {
    name: '항공전자팀',
    nameEn: 'Avionics',
    summary: '비행 컴퓨터와 계측 시스템을 개발합니다.',
    tasks: ['비행 컴퓨터 · PDB', '센서 · 텔레메트리', '데이터 분석'],
  },
  {
    name: '회수팀',
    nameEn: 'Recovery',
    summary: '비행을 마친 로켓의 안전한 귀환을 준비합니다.',
    tasks: ['회수 시스템 설계', '낙하산 · 전개 장치', '회수 시험'],
  },
  {
    name: '행정팀',
    nameEn: 'Administration',
    summary: '동아리 운영과 대외 활동을 담당합니다.',
    tasks: ['홍보 · 모집', '예산 · 일정 관리', '대외 협력'],
  },
]
