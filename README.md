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
- 프로젝트 추가·수정: 노션의 **프로젝트** 데이터베이스. 아래 연동 절차 참고.
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
- 저장소에 들어 있는 예시 소식은 운영 시 실제 정보로 교체하세요.

## 노션 프로젝트 연동

`notion.config.json`이 프로젝트 데이터베이스와 속성 이름을 지정합니다. 노션에서 `공개 태그`(다중 선택)에 **대외비**를 붙인 프로젝트는 홈페이지 목록, 숫자, 상세 경로, JavaScript 배포 파일에서 제외됩니다. 태그가 없는 항목은 공개됩니다. 새 비공개 프로젝트는 생성할 때부터 대외비를 지정하세요.

공개되는 값은 **프로젝트명, 상태, 설명, 발사 예정일**뿐입니다. 페이지 본문, 회의록·업무 관계, 담당자, 노션 링크, 첨부파일은 내보내지 않습니다. 설명에 적은 텍스트는 공개되므로 공개용 소개를 작성하세요. 상태 `기획 중`은 사이트에서 `계획`으로 표시합니다.

1. 노션에서 ARION 사이트용 내부 연결을 만들고 **콘텐츠 읽기**만 허용합니다. 사용자 정보·댓글·쓰기 권한은 필요하지 않습니다.
2. 그 연결에 **프로젝트 데이터베이스만** 접근을 허용합니다.
3. `arionspacecraft/arion-website` → Settings → Secrets and variables → Actions에 연결의 토큰을 **Repository secret `NOTION_TOKEN`**으로 저장합니다. 토큰을 소스 코드, 공개 변수, 채팅에 넣지 않습니다.
4. Actions → Deploy ARION to GitHub Pages → Run workflow로 최초 동기화를 실행합니다.

이후 매시 7·22·37·52분(UTC)에 자동으로 동기화·배포합니다. GitHub 실행 지연과 빌드 시간을 포함하므로 노션 수정이 즉시 반영되지는 않습니다. 빠른 반영이 필요하면 위 워크플로를 수동 실행합니다. 매 main push에도 갱신합니다. 공개 저장소의 예약 작업은 저장소 활동이 60일 동안 없으면 GitHub에서 중지할 수 있으므로 Actions에서 활성 상태를 확인하세요.

태그 속성·대외비 옵션이 삭제되거나, 읽기 권한이 사라지거나, 일부 페이지만 읽힌 경우 **이전 데이터를 재사용하지 않고 프로젝트 목록을 비운 새 사이트를 배포**합니다. 배포 후 워크플로 실패로 표시하여 관리자가 확인할 수 있습니다. 빌드·배포 자체가 실패하면 기존 사이트가 유지되므로 Actions 실패 알림을 확인하세요. 이미 공개된 내용을 다른 사람이 저장한 사본까지 회수할 수는 없습니다.

로컬 개발은 `.env.local`에 `NOTION_TOKEN=...`을 넣으면 됩니다. 파일과 생성된 `src/content/notion-projects.generated.ts`는 Git에서 제외됩니다. 토큰이 없으면 프로젝트가 비어 있는 상태로 개발·빌드할 수 있습니다. `npm test`는 실제 토큰 없이 공개 필터, 누락된 태그, 페이지 나눔 실패 등을 검사합니다.

## 로켓이 정지된 경우

기기의 ‘동작 줄이기’ 설정을 감지하면 처음에는 정지 화면을 표시합니다. 상단 ▶ 버튼이나 로켓 아래 ‘로켓 애니메이션 재생’을 누르면 이 방문 중에는 직접 선택한 재생 상태를 사용합니다. 페이지를 새로 열거나 새로고침하면 기기 설정을 다시 따릅니다. 화면 밖이나 비활성 탭에서는 계속 렌더링을 멈춥니다.
