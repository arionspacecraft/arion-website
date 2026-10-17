# ARION 사이트 작업 인수인계

기준일: 2026-10-18. 폴더를 이동하거나 다른 컴퓨터·대화에서 이어갈 때 이 문서와 [AGENTS.md](AGENTS.md)를 먼저 확인합니다. 정확한 최신 버전은 원격 `main`과 GitHub Actions의 성공한 배포를 기준으로 판단합니다.

## 저장소와 현재 범위

- 공식 저장소: https://github.com/arionspacecraft/arion-website
- 운영 주소: https://arionspacecraft.github.io/arion-website/
- 운영 브랜치: `main`. 원격 쓰기는 **arionspacecraft로 인증된 GitHub 연결**을 확인한 뒤 수행합니다. 개인 계정으로 대체하지 않습니다.
- 기존 `main-site`는 초기 디자인을 보존한 별도 비공개 저장소입니다. 그 폴더의 개인 계정 원격에 운영 사이트를 올리지 않습니다. 폴더 이름만으로 저장소를 판단하지 마세요.
- 라이트 테마는 사용자 검토를 거쳐 **운영 배포가 승인**됐습니다. 이전 기록의 ‘로컬 전용·미배포’는 과거 상태입니다. `codex/system-theme-preview`는 초기 작업 이력 보존용 로컬 브랜치이며 이후 작업은 최신 `main`에서 이어갑니다.
- 이 인수인계에서는 파일을 이동하거나 삭제하지 않았습니다. 정리 시 기존 파일·미커밋 변경을 보존하고, 삭제·재배치 전 사용자에게 확인합니다.

## 새 위치에서 이어가기

1. 이동 전 개발 서버를 실행한 터미널에서 `Ctrl+C`로 종료합니다. 실제 이동은 사용자가 지정한 폴더로 진행합니다.
2. 현재 체크아웃을 옮긴다면 숨김 폴더 **`.git`까지 포함한 저장소 폴더 전체**를 보존합니다. 이동 전 `git status`에서 미커밋·미추적 파일도 확인합니다. `.env.local`이 있다면 비밀 파일로 따로 보존하며 Git에 올리지 않습니다.
3. `node_modules`와 `dist`는 다시 만들 수 있지만 이 문서가 기존 파일 삭제를 지시하는 것은 아닙니다. 새로 복제할 경우 로컬 전용 브랜치와 미커밋·미추적 파일은 따라오지 않으므로 먼저 보존합니다.
4. 새 폴더를 편집기/Codex 작업 폴더로 다시 열고, 이전 절대 경로 대신 해당 폴더에서 아래 명령을 실행합니다. Node.js **24**를 권장합니다.

```powershell
git status --short --branch
git remote -v
git fetch origin main
git log -3 --oneline
node --version
```

`origin`이 위 공식 저장소인지 확인합니다. 작업 트리가 깨끗하고 기존 변경을 보존한 상태에서 최신 운영 버전으로 이어갑니다.

```powershell
git switch main
git pull --ff-only origin main
npm ci
npm test
npm run dev -- --host 127.0.0.1 --port 5173
```

`--ff-only`가 실패하면 강제 초기화하지 말고 로컬 커밋 차이를 먼저 확인합니다. 기존 작업을 옮기지 않고 새 체크아웃이 필요한 경우 원하는 상위 폴더에서 `git clone https://github.com/arionspacecraft/arion-website.git`을 실행할 수 있습니다. 로컬 기본 주소는 `http://127.0.0.1:5173/`이며 공개 사이트 주소는 폴더 위치와 무관합니다.

## 유지해야 할 동작

- 한국어가 기본이며 상단 EN / 한국어 전환은 현재 경로를 유지합니다. 언어 선택은 `arion-language`에 저장합니다. 영문 이름은 **Hangyum Gil / Woojin Jung**입니다.
- 프로젝트 이름·설명은 **영어 모드에서도 노션 원문 그대로** 표시합니다. 상태·메뉴·버튼 등 사이트 UI만 번역합니다. 노션 영문 이름·설명 칸은 보존하지만 조회·배포에 사용하지 않습니다.
- 운영 테마는 기기 설정에 따라 자동 전환하며 열려 있는 동안의 변경도 반영합니다. 다크는 기존 색상, 라이트는 파랑·청록·금색·보라의 천체 입자와 밝은 배경을 사용합니다.
- 개발 서버에서만 `?theme=light` / `?theme=dark`와 왼쪽 아래 미리보기 선택기를 사용할 수 있습니다. 운영과 빌드 미리보기에서는 URL을 무시하고 항상 기기 설정을 따릅니다.
- 홈 전체 스크롤과 우주 비행을 연결합니다. 여섯 단계는 IGNITION → EARTH + MOON → SOLAR SYSTEM → MILKY WAY → LOCAL GROUP → COSMIC WEB입니다. 천체는 배너 사이 여백 중앙에 오기 전에 완성됩니다.
- 태양계 이름표는 각 행성 오른쪽 가까이에서 부드럽게 따라가며 충돌을 피합니다. 지구 기준 참고 거리를 유지합니다. 실제 천체력·우주선 거리·물리 시뮬레이션이 아닙니다.
- 동작 줄이기 설정에서는 처음 정지합니다. PLAY로 재생할 수 있고, 정지 중에도 스크롤로 장면을 볼 수 있습니다. 테마 변경은 비행 시간·스크롤·이름표 위치를 초기화하지 않습니다.
- 기존 30fps 제한, 크기 변경 시에만 도착점 측정, Canvas 크기·글자 폭 캐시, 화면 밖·비활성 탭의 렌더 중지를 유지합니다. 사용자 기기에서의 실제 FPS 개선율은 측정하지 않았습니다.
- 메인 문구는 ‘우주를 향한 도전’, 포인트 컬러는 `#030627`, 팀은 동체·추진·항공전자·회수·행정입니다. 기존 연락처와 그 외 콘텐츠는 유지합니다.

## 주요 수정 파일

| 파일 | 담당 |
|---|---|
| `src/content/home.ts`, `site.ts`, `teams.ts`, `news.ts`, `recruit.ts` | 문구·연락처·팀·소식·모집 |
| `src/content/english.ts` | 정적 문구 영문 사전 |
| `src/components/LanguageProvider.tsx`, `src/lib/language.ts` | 언어 선택과 번역 |
| `src/components/ThemePreview.tsx` | 운영 기기 테마 감지 + 개발 전용 선택기 |
| `src/styles/theme-preview.css` | 운영 라이트 테마 및 개발 선택기 스타일 |
| `src/components/FlightJourney.tsx` | 스크롤·단계·Canvas 프레임과 테마 재그리기 |
| `src/components/particleUniverse.ts` | 천체·로켓 입자·색상·실제 Canvas 렌더 |
| `src/lib/solarAtlas.ts`, `mobileAtlas.ts` | 행성 이름표 추적·충돌 회피, 모바일 배치 |
| `src/lib/flightJourney.ts`, `src/content/celestialDistances.ts` | 장면 구성·거리 |
| `src/pages/Home.tsx`, `src/styles/journey.css` | 홈 배너와 비행 여백 |
| `notion.config.json`, `scripts/notion-projects.mjs` | 공개 필드 매핑·대외비 필터 |
| `scripts/sync-notion-projects.mjs` | 생성 데이터 갱신 |
| `.github/workflows/deploy.yml`, `scripts/create-route-pages.mjs` | 배포·예약 동기화·직접 진입 경로 |
| `tests/`, `vitest.config.ts` | 회귀 검사·토큰 없는 공개 프로젝트 fixture |

`ThemePreview`와 `theme-preview.css`는 기존 파일명이며 운영 테마도 담당합니다. 이름만 보고 실험 파일로 제거하지 마세요. `ParticleField.tsx`, 초기 `flightRenderer.ts`도 참고용으로 보존되어 있습니다. 자세한 표현·거리 출처는 [README.md](README.md)에 있습니다.

## 노션과 비밀값

- 기준 설정은 `notion.config.json`입니다. 프로젝트 DB의 **공개 태그** 다중 선택에 **대외비**가 붙으면 목록·상세 경로·배포 데이터에서 제외합니다. 태그가 없으면 공개됩니다.
- 공개 필드는 프로젝트명·상태·설명·발사 예정일뿐입니다. 본문·회의록·관련 업무·담당자·멘션·첨부파일은 내보내지 않습니다. 설명에는 공개 가능한 소개만 작성합니다.
- 배포 토큰은 GitHub 저장소의 Actions **Repository secret `NOTION_TOKEN`**입니다. 폴더를 이동해도 이 설정은 유지됩니다. 토큰을 채팅·문서·Git에 적지 않습니다.
- 로컬은 토큰 없이 실행·테스트·빌드할 수 있으나 프로젝트 목록은 비어 있습니다. 실제 로컬 동기화가 필요할 때만 `.env.local`에 설정합니다. 생성되는 `src/content/notion-projects.generated.ts`도 Git 제외 대상입니다.
- 태그 스키마·권한·페이지 읽기가 실패하면 이전 공개 데이터를 재사용하지 않고 빈 프로젝트 목록을 배포한 뒤 Actions를 실패로 표시합니다. 빌드·배포 자체가 실패하면 이전 사이트가 남으므로 실패 원인을 확인합니다.
- 현재 예약은 매시 2·7·12·…·57분입니다. 대기·빌드 시간 때문에 정확히 5분 안에 보인다는 보장은 없습니다. 빠른 갱신은 GitHub Actions의 Run workflow를 사용합니다.

## 검증과 배포

```powershell
npm test
npm run lint
$env:SITE_BASE_PATH = '/arion-website/'
npm run build
Remove-Item Env:SITE_BASE_PATH
git diff --check
```

환경 변수 해제는 파일 삭제가 아닙니다. 기본 경로로 개발할 때 배포용 경로가 남지 않도록 위 설정을 해제합니다. 기존 lint 경고 3개는 Footer의 Date 사용 및 Motion/ParticleField의 export 관련 경고이며 새 오류·경고와 구분합니다.

데스크톱·390px 모바일에서 홈의 천체·라벨, 양 테마, 영어 연락처, 메뉴, 노션 원문을 확인합니다. 자동 테마 초기값·실시간 변경, 운영 URL 무시·선택기 숨김, 정지 Canvas 위치 유지는 `tests/ThemePreview.test.tsx`가 검사합니다. 브라우저 오류도 확인합니다. 실제 휴대폰 하드웨어 검증과 브라우저 크기 검증은 구분해서 기록합니다.

검증 후 arionspacecraft 계정 연결을 확인하고 원격 `main`에 반영합니다. main 변경은 [Deploy ARION to GitHub Pages](https://github.com/arionspacecraft/arion-website/actions/workflows/deploy.yml)를 실행합니다. 브랜치 수동 실행은 검증만 하며 운영 배포는 main에서만 수행합니다. 배포 성공뿐 아니라 노션 동기화 결과, 운영 URL의 변경 사항, 로컬 HEAD와 원격 main 일치도 확인합니다.

## 작업 기록과 다음 세션에 줄 문장

작업 완료 후 기존 Obsidian 노트 **ARION 홈페이지 운영과 노션 연동**에 변경 내용·커밋·배포 결과·검증 범위를 추가합니다. 보관함을 옮겼다면 그 노트의 새 위치를 찾아 이어 쓰고, 과거 기록은 보존하되 최신 상태를 구분합니다. 이 문서와 README는 저장소와 함께 이동하지만 Obsidian 보관함은 별도입니다.

다른 곳에서 이어갈 때 다음 문장을 전달할 수 있습니다.

> 이 폴더는 ARION 공식 홈페이지 저장소입니다. AGENTS.md와 HANDOFF.md를 읽고 git status/remote/현재 브랜치부터 확인해 주세요. 원격은 arionspacecraft/arion-website이며 쓰기는 아리온 계정으로만 합니다. 자동 라이트·다크 테마는 운영 배포 승인됐고 노션 프로젝트는 영어에서도 원문을 유지합니다. 기존 파일을 임의로 삭제하지 말고, 작업 후 기존 Obsidian 운영 노트도 갱신해 주세요.
