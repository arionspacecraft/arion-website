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
- 스크롤 우주 비행: `src/components/FlightJourney.tsx`가 IGNITION → EARTH + MOON → SOLAR SYSTEM → MILKY WAY → LOCAL GROUP → COSMIC WEB의 여섯 단계를 제어합니다. 첫 화면은 일반적인 한 화면 높이이며, 소개·프로젝트·팀·소식·모집을 읽는 **홈페이지 전체 스크롤**에 배경의 비행이 맞춰집니다. 별도의 긴 고정 비행 구간은 없습니다.
- 배경은 클릭과 스크롤을 가로채지 않는 고정 Canvas입니다. 본문은 어두운 반투명 바탕 위에서 자연스럽게 스크롤됩니다. 오른쪽 아래의 현재 단계 표시를 열면 여섯 단계의 페이지 위치로 이동할 수 있으며, 옆의 `PAUSE` / `PLAY`로 움직임을 조절합니다.
- 우주 그래픽: `src/components/particleUniverse.ts`. 로켓·천체·궤도·은하·우주 구조를 모두 점으로 그리며, 같은 마우스 반응 반경 **120px**·최대 변위 **175px**를 공유합니다. 반경은 이전 240px의 절반이고, 모바일도 기존 화면 폭 비례 반경의 절반으로 적용합니다. 기존 `ParticleField.tsx`와 첫 버전 `flightRenderer.ts`는 참고용으로 보존했습니다.
- 연속 카메라: 하나의 중첩 좌표계와 로그 줌으로 같은 지구·태양·은하가 점차 작아집니다. 스크롤 변화에는 감쇠를 적용합니다. 전경의 ARION 로켓과 분사 입자·흐르는 별은 마지막 장면까지 비행감을 이어갑니다. 로켓은 가시성을 위한 비행 표식으로, 실제 거리 비율을 따르지 않습니다.
- 천체 이름과 연결선은 실제 그려진 위치에 붙으며 화면 경계와 다른 라벨을 피합니다. `EARTH`는 태양계로 넘어가도 동일한 지구를 가리킵니다. 이름·단계·카탈로그 표기는 영어입니다.
- 천체는 전체 배경을 활용하도록 확대했습니다. 천체명은 데스크톱 15px·모바일 12px, 보조 카탈로그는 11px·9px입니다. 장면별 문구·단계 위치·행성 속도·천체 목록은 `src/lib/flightJourney.ts`, 화면 배치는 `src/styles/journey.css`에서 관리합니다. 스크롤 길이는 실제 홈페이지 콘텐츠 높이에 따라 정해집니다.
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

개발 브랜치를 선택해 수동 실행하면 실제 노션 동기화와 빌드만 검증합니다. 사이트 배포는 `main`에서만 실행됩니다.

이후 매시 2분부터 5분 간격(2·7·12·17·22·27·32·37·42·47·52·57분)에 자동으로 동기화·배포합니다. GitHub 실행 지연과 빌드 시간을 포함하므로 노션 수정이 즉시 반영되지는 않습니다. 빠른 반영이 필요하면 위 워크플로를 수동 실행합니다. 매 main push에도 갱신합니다. 공개 저장소의 예약 작업은 저장소 활동이 60일 동안 없으면 GitHub에서 중지할 수 있으므로 Actions에서 활성 상태를 확인하세요.

태그 속성·대외비 옵션이 삭제되거나, 읽기 권한이 사라지거나, 일부 페이지만 읽힌 경우 **이전 데이터를 재사용하지 않고 프로젝트 목록을 비운 새 사이트를 배포**합니다. 배포 후 워크플로 실패로 표시하여 관리자가 확인할 수 있습니다. 빌드·배포 자체가 실패하면 기존 사이트가 유지되므로 Actions 실패 알림을 확인하세요. 이미 공개된 내용을 다른 사람이 저장한 사본까지 회수할 수는 없습니다.

로컬 개발은 `.env.local`에 `NOTION_TOKEN=...`을 넣으면 됩니다. 파일과 생성된 `src/content/notion-projects.generated.ts`는 Git에서 제외됩니다. 토큰이 없으면 프로젝트가 비어 있는 상태로 개발·빌드할 수 있습니다. `npm test`는 실제 토큰 없이 공개 필터, 누락된 태그, 페이지 나눔 실패 등을 검사합니다.

## 로켓이 정지된 경우

기기의 ‘동작 줄이기’ 설정을 감지하면 처음에는 정지 화면을 표시합니다. 상단 ▶ 버튼이나 오른쪽 아래의 `PLAY`를 누르면 이 방문 중에는 직접 선택한 재생 상태를 사용합니다. 정지 중에도 본문 스크롤·단계 메뉴로 각 장면의 정지 화면을 볼 수 있으며, 확대·축소 대신 단계별로 전환됩니다. 페이지를 새로 열거나 새로고침하면 기기 설정을 다시 따릅니다.

Canvas 2D로 그리며 추가 그래픽 패키지나 WebGL에 의존하지 않습니다. 최대 30fps, 모바일 입자 수와 해상도 제한을 적용하고, 화면 밖이나 비활성 탭에서는 렌더링을 멈춥니다. Canvas를 지원하지 않으면 로켓 아이콘과 설명을 표시합니다.

## 우주 비행의 표현 범위

이 화면은 거리·천체 크기·시간을 각각 압축한 개념 연출이며 실제 비행 궤적이나 현재 천체 위치를 예측하는 시뮬레이터가 아닙니다. 지구 표면의 회전, 달의 공전과 동주기 자전, 8개 행성의 서로 다른 공전·자전 속도, 금성·천왕성의 역행 자전, 회전하는 나선 은하를 표현합니다. 우주 전체가 하나의 물체처럼 회전하도록 만들지는 않습니다. 천체 이름과 분류는 실제 자료를 참고했지만, 배치는 구도를 위해 구성한 개념도이며 관측 좌표가 아닙니다.

- MILKY WAY: SAGITTARIUS A*, ORION NEBULA (M42), OMEGA CENTAURI (NGC 5139).
- LOCAL GROUP: ANDROMEDA (M31), TRIANGULUM (M33), LARGE MAGELLANIC CLOUD와 우리 은하.
- COSMIC WEB: VIRGO CLUSTER (M87 포함), COMA CLUSTER (ABELL 1656), PERSEUS CLUSTER (ABELL 426). 이들은 은하단이며, 우리 은하 장면의 OMEGA CENTAURI는 구상성단입니다.

명칭 참고: [NASA 은하 중심](https://science.nasa.gov/mission/webb/science-overview/science-explainers/what-is-the-center-of-our-galaxy-like/), [M42](https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-42/), [Omega Centauri](https://science.nasa.gov/photojournal/pj-omega-centauri/), [Local Group](https://imagine.gsfc.nasa.gov/features/cosmic/local_group_info.html), [우주 거대 구조](https://science.nasa.gov/universe/galaxies/large-scale-structures/), [Coma Cluster](https://science.nasa.gov/photojournal/coma-cluster-of-galaxies/), [Perseus Cluster](https://imagine.gsfc.nasa.gov/features/cosmic/nearest_superclusters_info.html), [Virgo Cluster의 M87](https://science.nasa.gov/missions/hubble/nasas-hubble-space-telescope-probes-the-compact-nucleus-of-galaxy-m87/).

참고: [NASA 달의 동주기 자전](https://science.nasa.gov/moon/facts/), [NASA 행성 자료](https://cdaweb.gsfc.nasa.gov/pub/documents/archived_websites/pwg.gsfc.nasa.gov/stargaze/SplanetsA.htm), [NASA 우리 태양계와 은하](https://science.nasa.gov/solar-system/solar-system-facts/).
