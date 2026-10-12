# ARION 메인 사이트

DGIST 로켓 동아리 ARION의 공식 사이트. Vite + React + TypeScript 정적 사이트(백엔드 없음).

## 실행

```bash
npm install
npm run dev      # 개발 서버
npm run build    # dist/ 로 빌드
```

## 페이지

| 경로 | 내용 |
|---|---|
| `/` | 히어로, 컨셉, 활동, 대표 프로젝트, 최근 소식 3건, 모집 배너 |
| `/about` | 컨셉 · 비전 · 활동 내용 · 연혁 |
| `/projects`, `/projects/:slug` | 프로젝트 목록(상태 필터) · 상세(본문, 제원, 링크) |
| `/teams` | 팀 구성 |
| `/news`, `/news/:slug` | 소식 목록(분류 필터) · 상세(이전/다음 글) |
| `/recruit` | 모집 상태(날짜로 자동 계산) · 인재상 · 절차 · FAQ · 지원 링크 |
| `/contact` | 이메일 · 인스타그램 · 위치 |

## 구조

```
src/
  content/     문구와 데이터. 내용 수정은 여기서만 한다.
  lib/         모집 상태 계산, 페이지 제목
  components/  Layout, Header, Footer, Section 등 공용 컴포넌트
  pages/       라우트별 페이지
  styles/      tokens.css(디자인 토큰), base.css(공통 테마), flight.css(홈 비행 화면)
```

## 내용 수정

- 홈의 헤드라인·소개 문구: `src/content/home.ts`
- 포인트 컬러: `src/styles/tokens.css`의 `--color-accent` (`#030627`)
- 로켓 입자와 궤도 그래픽: `src/components/ParticleField.tsx`. `PARTICLE_INTERACTION`으로 반응 범위(240px)와 최대 변위(175px)를 조절합니다. 작은 화면에서는 화면 폭에 맞춰 조정됩니다. 헤더의 정지 버튼과 시스템의 동작 줄이기 설정을 지원하며, 화면 밖이나 비활성 탭에서는 렌더링을 멈춥니다.
- 프로젝트 그래픽은 디자인용 개념도이며 실제 기체·회로 도면이 아닙니다.

- 소식 추가: `src/content/news.ts` 배열에 항목 추가
- 프로젝트 추가: `src/content/projects.ts` (`featured: true`면 홈에 노출)
- 모집 열기: `src/content/recruit.ts`의 `rounds`에 기간과 `applyUrl`(지원 폼 링크) 추가.
  기간에 따라 모집 예정 / 모집 중 / 모집 마감이 자동 표시된다.
- 연락처: `src/content/site.ts`의 `contact` (빈 값은 화면에 표시되지 않음)

## GitHub Pages 배포

공개 사이트: https://arionspacecraft.github.io/arion-website/

운영 저장소와 배포 소유자는 `arionspacecraft/arion-website`입니다. 원격 수정·배포에는 `arionspacecraft`로 인증된 GitHub 연결을 사용합니다. 개인 계정 저장소로 만들거나 배포하지 않습니다.

`main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 자동 빌드·배포합니다.
저장소 Settings → Pages의 Source는 GitHub Actions로 설정합니다. Node.js 24를 사용합니다.

- `SITE_BASE_PATH`로 배포 경로를 지정합니다. 로컬 기본값은 `/`입니다.
- `scripts/create-route-pages.mjs`가 목록과 상세 페이지의 진입 파일을 생성하여 직접 접속·새로고침도 지원합니다.
- 프로젝트·소식이 추가되면 빌드 시 해당 경로도 자동 생성됩니다.
- 저장소에 들어 있는 예시 소식·제원과 비어 있는 연락처는 운영 시 실제 정보로 교체하세요.

## 로켓이 정지된 경우

기기의 ‘동작 줄이기’ 설정을 감지하면 처음에는 정지 화면을 표시합니다. 상단 ▶ 버튼이나 로켓 아래 ‘로켓 애니메이션 재생’을 누르면 이 방문 중에는 직접 선택한 재생 상태를 사용합니다. 페이지를 새로 열거나 새로고침하면 기기 설정을 다시 따릅니다. 화면 밖이나 비활성 탭에서는 계속 렌더링을 멈춥니다.
