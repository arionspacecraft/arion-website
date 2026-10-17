import snapshot from './notion-projects.generated.ts'

export type ProjectStatus = '진행 중' | '완료' | '계획' | '아카이브'

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

export const projects = snapshot.projects as Project[]
export const projectsAvailable = snapshot.state === 'ready'
export const projectsEmptyMessage = projectsAvailable
  ? '공개된 프로젝트를 준비하고 있습니다.'
  : '프로젝트 정보를 업데이트하고 있습니다. 잠시 후 다시 방문해 주세요.'
export const projectStatuses: ProjectStatus[] = ['진행 중', '완료', '계획', '아카이브']
