export type Team = {
  name: string
  nameEn: string
  summary: string
  tasks: string[]
}

// TODO: 실제 팀 구성으로 교체
export const teams: Team[] = [
  {
    name: '추진',
    nameEn: 'Propulsion',
    summary: '로켓 모터를 설계하고 연소 시험을 수행합니다.',
    tasks: ['추진제 제조', '그레인 · 노즐 설계', '지상 연소 시험'],
  },
  {
    name: '구조',
    nameEn: 'Structure',
    summary: '기체를 설계하고 제작합니다.',
    tasks: ['기체 3D 설계', '공력 해석(CFD)', '회수 장치'],
  },
  {
    name: '전장',
    nameEn: 'Avionics',
    summary: '비행 컴퓨터와 계측 시스템을 개발합니다.',
    tasks: ['비행 컴퓨터 · PDB', '센서 · 텔레메트리', '데이터 분석'],
  },
  {
    name: '운영',
    nameEn: 'Operations',
    summary: '동아리 운영과 대외 활동을 담당합니다.',
    tasks: ['홍보 · 모집', '예산 · 안전 관리', '대외 협력'],
  },
]
