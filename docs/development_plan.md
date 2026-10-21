# 개발 계획서

기능 정의는 [functions.md](functions.md), 시각 언어는 [editorial_blue_design_theme.md](editorial_blue_design_theme.md)를 따른다. 이 문서는 그 둘을 **어떻게 만들지**를 정한다.

## 1. 원칙

- 앱 코드는 작게 유지한다. 의존성은 React, Vite, TypeScript, Vitest, 폰트 외에는 추가하지 않는다.
- Unit 구성·Keep 순환 같은 핵심 규칙은 UI와 분리된 **순수 함수 한 파일**에 모으고, 이 파일만 테스트한다.
- 앱 개발과 단어 데이터 제작은 **별도 트랙**으로 병행한다. 앱은 샘플 데이터로 먼저 완성한다.

## 2. 프로젝트 구조

```
engvoca3000/
├─ docs/
├─ data/
│  ├─ source/oxford3000.csv     # 원본 목록: word, pos, cefr
│  └─ levels/a1.json …b2.json   # 등급별 생성·검수 완료 데이터
├─ scripts/
│  └─ build-data.mjs            # 검증 + 병합 → src/data/words.json
├─ src/
│  ├─ data/words.json           # 앱이 읽는 최종 데이터 (빌드 산출물)
│  ├─ lib/
│  │  ├─ study.ts               # Unit 구성, Keep, 판정, 진행률 (순수 함수)
│  │  ├─ study.test.ts
│  │  ├─ storage.ts             # localStorage 읽기/쓰기
│  │  └─ speech.ts              # Web Speech API 래퍼
│  ├─ screens/
│  │  ├─ Home.tsx               # Unit 목록 + 이어서 학습
│  │  ├─ Study.tsx              # 학습 모드 / 복습 모드 (mode prop)
│  │  └─ Search.tsx             # 검색 + 단어 보기
│  ├─ components/
│  │  ├─ WordCard.tsx           # 단어·뜻·예문 표시 (모든 화면 공용)
│  │  └─ VerdictBar.tsx         # 알아요 / Keep 버튼
│  ├─ App.tsx                   # hash 라우팅, 진행 상태 보유
│  ├─ main.tsx
│  └─ styles.css                # 디자인 토큰 + 전체 스타일
└─ index.html
```

## 3. 데이터

### 3.1 타입

```ts
type Cefr = 'A1' | 'A2' | 'B1' | 'B2';

interface Word {
  id: string;            // 소문자 영어 원형. 품사가 여러 개여도 단어당 1개
  word: string;
  pos: string[];         // ['noun', 'verb']
  cefr: Cefr;
  meanings: string[];    // 1~3개, 첫 번째가 대표 뜻
  examples: { en: string; ko: string }[]; // 정확히 3개
}
```

`words.json`은 `Word[]`이며 배열 순서가 학습 순서다(A1 → B2, 등급 안에서 알파벳순). Unit `n`(1부터)은 `words.slice((n-1)*10, n*10)`이다.

### 3.2 제작 파이프라인

1. **원본 목록:** Oxford 3000 목록을 `data/source/oxford3000.csv`(word, pos, cefr)로 정리한다. 같은 단어의 여러 품사는 한 줄로 합친다.
2. **초안 생성:** Codex가 [codex_data_task.md](codex_data_task.md) 지시에 따라 등급별 뜻·예문을 만들어 `data/levels/a1.json` 형태로 저장한다.
3. **자동 검증:** `node scripts/build-data.mjs`가 아래를 검사하고 통과하면 `src/data/words.json`을 생성한다. `--check` 옵션은 검사만 하고 파일을 쓰지 않는다(Codex용).
   - 필수 필드 존재, 빈 문자열 없음
   - `examples`가 정확히 3개, `meanings`가 1~3개
   - `id` 중복 없음, `cefr` 값 유효
   - 예문에 해당 단어(또는 변화형)가 없으면 **경고**만 출력 (불규칙 변화 때문에 오류로 처리하지 않음)
4. **수동 검수:** 등급별로 훑어보며 어색한 뜻·예문을 고친다. 검수가 끝난 등급만 병합한다.

**주의:** 등급 데이터를 앱에 넣은 뒤에는 그 등급 안의 단어 순서·개수를 바꾸지 않는다. Unit 번호가 밀린다. 뜻·예문 문구 수정은 자유롭다. 다음 등급은 뒤에 추가만 한다.

**저작권:** Oxford 3000 목록은 Oxford University Press 소유다. 개인 학습용으로만 쓰고, Vercel 배포 URL은 공개 홍보하지 않는다.

### 3.3 샘플 데이터

앱 개발 초기에는 A1 앞쪽 30단어(3 Unit)만 손으로 채운 `words.json`으로 진행한다. 이 정도면 Keep이 여러 Unit에 걸쳐 따라오는 동작까지 확인할 수 있다.

## 4. 저장 구조 (localStorage)

키 하나(`engvoca3000:v1`)에 JSON 하나로 저장한다.

```ts
interface Progress {
  version: 1;
  words: Record<string, 'keep' | 'known'>;   // 없으면 미학습
  units: Record<number, UnitRecord>;           // 시작한 Unit만 존재
  settings: { showTranslation: boolean };
}

interface UnitRecord {
  cards: string[];   // 시작 시 확정한 카드 순서: 새 단어 → Keep 단어
  newCount: number;  // cards 앞쪽 몇 개가 이 Unit의 새 단어인지
  pos: number;       // 현재 카드 위치 (이어서 학습용)
  done: boolean;
}
```

- 복습 모드 대상은 `cards.slice(0, newCount)`. 시작 시 기록을 그대로 쓰므로 데이터가 바뀌어도 복습 대상이 흔들리지 않는다.
- 복습 모드 진행 위치는 저장하지 않는다. 10장이라 처음부터 다시 해도 부담이 없다.
- 상태가 바뀔 때마다 통째로 저장한다. 데이터가 작아(수십 KB) 성능 문제가 없다.
- 읽기 실패(JSON 깨짐, 접근 차단) 시 빈 진행 상태로 시작하되, 깨진 원본은 `engvoca3000:v1:broken`에 옮겨 둔다. 학습 기록을 조용히 덮어쓰지 않기 위해서다.

## 5. 핵심 로직 (`src/lib/study.ts`)

UI는 이 함수들만 호출한다. 모두 `Progress`를 받아 새 `Progress`를 반환하는 순수 함수다.

| 함수 | 동작 |
|---|---|
| `unitCount(words)` | 전체 Unit 수 = `ceil(words.length / 10)` |
| `startUnit(p, words, n)` | 기록이 있으면 그대로 반환. 없으면 Unit `n`의 새 단어 + 현재 `keep` 단어 전부(새 단어와 겹치는 것 제외)로 `cards`를 만들어 저장 |
| `judge(p, id, verdict)` | `words[id]`를 `'keep'` 또는 `'known'`으로 설정 |
| `move(p, n, pos)` | 현재 위치 저장 |
| `finishUnit(p, n)` | `done = true` |
| `nextUnit(p, words)` | 진행 중인 Unit이 있으면 그것, 없으면 기록이 없는 첫 Unit |
| `stats(p, words)` | 완료 Unit 수, 알아요 수, Keep 수 |

**Keep이 "다음 Unit부터" 나오는 이유:** Keep 단어 목록은 `startUnit` 시점에만 읽는다. 진행 중인 Unit의 `cards`는 이미 확정되어 있으므로, 이번 Unit에서 새로 Keep된 단어는 자연스럽게 다음 Unit에 들어간다. 별도 처리가 필요 없다.

**Unit 완료 조건:** 마지막 카드에서 판정하면 `finishUnit`. 이전 버튼으로 돌아가 판정을 바꾸는 것은 `judge`만 다시 호출한다.

**테스트 (`study.test.ts`, Vitest):** 아래 시나리오 하나를 끝까지 따라가는 테스트를 둔다.

1. Unit 1 시작 → 카드 10장
2. 3개 Keep, 7개 알아요 → Unit 1 완료
3. Unit 2 시작 → 카드 13장 (새 10 + Keep 3)
4. Keep 단어 중 1개 알아요, 1개 Keep 유지, 새 단어 1개 Keep
5. Unit 3 시작 → 카드 13장 (새 10 + 남은 Keep 2 + 새 Keep 1)
6. Unit 1을 다시 열면 복습 대상은 원래 새 단어 10개
7. `nextUnit`이 Unit 4를 가리킴

## 6. 화면과 라우팅

### 6.1 라우팅

URL hash로 화면을 나눈다. 라이브러리 없이 `hashchange` 이벤트 하나로 처리하며, 모바일 뒤로가기 버튼이 앱을 닫지 않고 이전 화면으로 돌아가게 하는 것이 목적이다.

| hash | 화면 |
|---|---|
| `#/` | 홈 |
| `#/unit/12` | Unit 12 (완료 여부에 따라 학습 모드 / 복습 모드 자동 선택) |
| `#/search` | 검색 |

`Progress`는 `App.tsx`가 `useState`로 보유하고, 변경 시 `useEffect`로 저장한다. 화면에는 props로 내려준다.

### 6.2 화면별 구현

**Home**
- 상단: 큰 제목, 진행률(완료 Unit / 전체, 알아요 / 전체 단어), 현재 Keep 수, **이어서 학습** 버튼(가장 눈에 띄는 단일 버튼).
- Unit 목록: 등급별 소제목(A1, A2 …) 아래 Unit 행. 행 = 번호, 상태 표시, 완료 시 `8/10`. 약 300행이므로 가상 스크롤 없이 그대로 렌더링해도 충분하다.
- 처음 열면 진행 중인 Unit 근처로 스크롤.

**Study (학습 모드)**
- 상단: 뒤로(홈), `Unit 12`, 진행 표시 `7 / 13 · 새 단어 10 + Keep 3`.
- `WordCard`: 뜻과 예문을 모두 펼친 상태. Keep으로 넘어온 단어는 단어 위에 `KEEP` 라벨.
- 하단 `VerdictBar`: Keep / 알아요. 판정 후 다음 카드로 이동.
- 마지막 카드 판정 후 같은 화면에서 완료 요약: 알아요 수, Keep 수, 다음 Unit으로 넘어갈 Keep 단어 목록, **다음 Unit** 버튼, 홈 버튼.

**Study (복습 모드)**
- `WordCard`를 접힌 상태로 시작(단어·품사·발음만). 탭 또는 Space로 펼친다.
- 펼치기 전에는 `VerdictBar` 대신 **정답 보기** 버튼을 같은 자리에 둔다. 펼친 뒤에 판정할 수 있다.
- 완료 요약: `알아요 8 / 10`, 다시 Keep된 단어 목록.

**Search**
- 상단 검색창(진입 시 자동 포커스), 아래 결과 목록. 빈 검색어일 때 "Keep 단어" 필터 토글.
- 결과 행 탭 → 같은 화면에서 `WordCard` 표시(판정 버튼 없음).

### 6.3 공용 컴포넌트

**WordCard** — props: `word`, `revealed`, `isKeep`, `showTranslation`.
- 예문 번역은 문장별로 접힘 상태를 내부 `useState`로 관리. 카드가 바뀌면 `key={word.id}`로 초기화.
- 단어 옆, 각 예문 옆에 발음 버튼.

**VerdictBar** — props: `onKeep`, `onKnown`. 모바일에서는 화면 하단 고정, 각 버튼 높이 56px 이상.

### 6.4 입력

- **키보드:** `Study`에서 `keydown` 리스너 하나. Space(펼치기), ←/→(이전/다음), 1(Keep), 2(알아요), P(단어 발음). 입력창에 포커스가 있으면 무시.
- **스와이프:** Pointer Events로 가로 이동 50px 이상이면 이전/다음. 세로 스크롤과 겹치지 않도록 가로 이동이 세로보다 클 때만 처리.
- **발음 (`speech.ts`):** `speechSynthesis.cancel()` 후 `lang = 'en-US'`로 재생. en-US 음성이 있으면 우선 선택. API가 없는 브라우저에서는 발음 버튼을 숨긴다.

## 7. 디자인 적용

### 7.1 컬러 토큰

테마의 블루 팔레트를 역할 토큰으로 옮긴다. 대비비는 기본 배경(`--bg`) 기준 계산값이다.

```css
:root {
  --bg:             #EEF1FB; /* Blue Off-White */
  --surface:        #F8F9FD; /* Near White: 카드 */
  --text:           #253F86; /* Deep Blue, 대비 약 8.6:1 */
  --text-secondary: #55628F; /* 보조 텍스트, 약 5.2:1 */
  --accent:         #3653AC; /* Primary Blue: 주요 버튼, 선택 상태 */
  --on-accent:      #FFFFFF; /* accent 배경 위 글자, 약 7.1:1 */
  --accent-soft:    #C4CEEA; /* Pale Blue: 구분선, 진행 막대 배경 */
  --muted:          #8096D1; /* Muted Blue: 장식 전용, 텍스트 사용 금지 (약 2.8:1) */
  --known:          #1E7A4F; /* 알아요, 약 4.7:1 */
  --keep:           #A8540A; /* Keep, 약 4.7:1 */
  --focus:          #3653AC;
}
```

- 알아요 / Keep은 테마 원칙대로 브랜드 블루와 다른 색을 쓰고, 색만으로 구분하지 않도록 **항상 텍스트 라벨**을 함께 표시한다.
- 컴포넌트에서는 `var(--토큰)`만 쓰고 hex 값을 직접 쓰지 않는다. 버튼 글자색도 `#fff`가 아니라 `var(--on-accent)`로 지정한다.
- 다크 모드는 만들지 않는다. 필요해지면 `@media (prefers-color-scheme: dark)` 안에서 위 토큰 값만 재정의한다. 이때 `--accent`가 밝은 블루로 바뀌므로 `--on-accent`는 어두운 색으로 바꾼다.

### 7.2 타이포그래피

- 서체: **Pretendard** (한글·영문 모두 지원, OFL). npm `pretendard` 패키지로 self-host.
- 위계는 역할 단위로 정의한다.

| 역할 | 크기 | 굵기 | 쓰임 |
|---|---|---|---|
| Display | `clamp(2.75rem, 10vw, 5rem)` | 800 | 학습 카드의 영어 단어, 홈의 Unit 번호 |
| Title | `1.5rem` | 700 | 화면 제목, 완료 요약 숫자 |
| Body | `1.0625rem`, 행간 1.6 | 400 | 뜻, 예문 |
| Label | `0.8125rem`, 자간 0.04em, 대문자 | 600 | 품사, CEFR, KEEP 라벨 |

- 영어 단어를 화면에서 가장 크게 둔다. 에디토리얼 테마의 "대담한 제목"을 이 앱에서는 학습 대상 단어가 맡는다.
- 예문 영어는 Body, 한국어 번역은 Body 크기 + `--text-secondary`. 작은 글씨로 위계를 만들지 않는다.

### 7.3 레이아웃과 표면

- 콘텐츠 최대 폭 640px, 가운데 정렬. PC에서도 학습 카드는 이 폭을 유지하고 남는 공간은 여백으로 둔다.
- 카드 안 요소는 테두리 대신 간격으로 구분한다: 단어 블록 → 뜻 → 예문 3개 사이에 넉넉한 세로 간격.
- 카드 표면은 `--surface`, 모서리 12px, 그림자 없음.
- Unit 목록 행은 카드로 감싸지 않고 얇은 `--accent-soft` 구분선만 사용한다.

### 7.4 인터랙션

- 버튼 hover/active는 배경 농도만 바꾼다. 포커스는 `outline: 2px solid var(--focus)` + offset 2px.
- 카드 전환은 150ms 이하 opacity 전환만. `prefers-reduced-motion`이면 전환 없음.
- 모든 상태(완료, 진행 중, Keep, 알아요)는 hover 없이 보이도록 한다.

### 7.5 모바일 최적화

주 사용 환경은 휴대폰이다. 모바일을 마지막에 맞추는 것이 아니라 **모든 화면을 360px 폭 기준으로 먼저 만들고** PC로 넓힌다.

**기준 환경:** 폭 360px(소형 안드로이드) ~ 430px(대형 iPhone), 세로 방향. iOS Safari, Android Chrome.

**화면과 안전 영역**
- viewport: `width=device-width, initial-scale=1, viewport-fit=cover`. 사용자 확대는 막지 않는다(접근성).
- 높이는 `100dvh`를 쓴다. `100vh`는 주소창 때문에 하단이 잘리므로 쓰지 않는다.
- 하단 고정 `VerdictBar`: `padding-bottom: calc(12px + env(safe-area-inset-bottom))`. 상단 헤더도 `env(safe-area-inset-top)` 반영.
- 본문 하단 여백은 고정 바 높이만큼 확보해 마지막 예문이 가려지지 않게 한다.

**터치**
- 모든 버튼 터치 영역 최소 44×44px, 판정 버튼은 높이 56px 이상. 버튼 사이 간격 8px 이상.
- 자주 누르는 동작(판정, 정답 보기, 다음 Unit)은 화면 하단 엄지 영역에 둔다. 상단에는 정보와 뒤로가기만.
- `touch-action: manipulation`으로 더블탭 확대 지연을 없앤다.
- 기본 탭 하이라이트는 끄고(`-webkit-tap-highlight-color: transparent`) 대신 `:active` 상태를 직접 보여준다.
- hover 스타일은 `@media (hover: hover)` 안에만 둔다. 터치 기기에서 hover가 눌린 채 남는 문제를 막는다.

**스와이프**
- 카드 영역은 `touch-action: pan-y`로 세로 스크롤만 브라우저에 맡기고 가로 이동은 앱이 처리한다.
- 화면 가장자리 24px 안에서 시작한 스와이프는 무시한다. iOS/Android의 뒤로가기 제스처와 겹치지 않기 위해서다.

**글자**
- 입력창 글자 크기는 16px 이상. iOS가 입력창 포커스 시 화면을 자동 확대하는 것을 막는다.
- 긴 단어(12자 이상, 예: `responsibility`)는 Display 크기를 줄여 한 줄에 들어가게 한다. 단어 중간에서 줄바꿈하지 않는다.
- `text-size-adjust: 100%`로 가로 회전 시 글자 크기가 멋대로 커지는 것을 막는다.

**확인 방법**
- 매 마일스톤 완료 시 Chrome DevTools 360×640에서 확인하고, 배포 URL을 실제 휴대폰으로 열어 확인한다.
- 확인 항목: 가로 스크롤 없음, 하단 버튼이 홈 인디케이터에 가려지지 않음, 한 손 엄지로 판정 가능.

## 8. 마일스톤

각 단계는 "완료 기준"을 직접 써보고 확인한 뒤 넘어간다. **모든 단계의 완료 기준에는 7.5의 모바일 확인이 포함된다.**

| 단계 | 작업 | 완료 기준 |
|---|---|---|
| **M0. 셋업** | Vite + React + TS, Vitest, Pretendard, `styles.css` 토큰, 샘플 30단어, `build-data.mjs`, Vercel 연결 | 배포 URL에서 빈 홈 화면이 테마 색·서체로 보인다 |
| **M1. 핵심 로직** | `study.ts`, `storage.ts`, 5장 시나리오 테스트 | `npm test` 통과 |
| **M2. 학습 모드** | `WordCard`, `VerdictBar`, `Study`(학습), 완료 요약, 이어서 학습 | 샘플 3 Unit을 순서대로 학습하며 Keep 단어가 다음 Unit에 따라오고, 새로고침해도 같은 카드에서 이어진다 |
| **M3. 홈 + 복습** | `Home`, 진행률, hash 라우팅, `Study`(복습) | 완료 Unit을 누르면 복습 모드가 열리고, 뒤로가기로 홈에 돌아온다 |
| **M4. 사용성** | 발음, 키보드, 스와이프, `Search`, 실기기 세부 조정, 포커스·대비 점검 | 휴대폰에서 한 손으로 1 Unit을 끝낼 수 있고, PC에서 마우스 없이 1 Unit을 끝낼 수 있다 |
| **M5. 실데이터** | A1 데이터 반영 → 실사용 → A2·B1·B2 순서로 추가 | 전체 데이터가 `build-data.mjs` 검증을 통과하고 앱에 반영된다 |

**데이터 트랙**은 Codex가 `data` 브랜치에서 진행한다([codex_data_task.md](codex_data_task.md)). `build-data.mjs`는 데이터 형식의 기준이므로 앱 트랙 M0에서 먼저 만들어 `data` 브랜치에 반영한 뒤 Codex 작업을 시작한다. M4가 끝날 때 A1이 준비되어 있는 것을 목표로 한다.

M5 이후 2주 정도 실제로 매일 써본 뒤, [functions.md](functions.md) 4장의 부가 기능(백업/복원, PWA, Keep 상한) 중 필요하다고 느낀 것만 추가한다.

## 9. 배포

- Vercel에 GitHub 저장소를 연결하고 `main` 브랜치 push 시 자동 배포. 빌드 명령 `npm run build`, 출력 `dist`.
- 데이터는 번들에 포함되므로 별도 설정이 없다. `words.json` 약 1.5MB(gzip 후 약 400KB)로 첫 로드 이후에는 즉시 동작한다.

## 10. 커밋 규칙

**작업 단위 하나 = 커밋 하나.** 작업 단위는 8장 마일스톤의 작업 항목 하나(예: `study.ts`와 그 테스트, `WordCard`, hash 라우팅)다. 여러 단위를 한 커밋에 섞지 않는다.

| 트랙 | 브랜치 | 단위 | 메시지 예 |
|---|---|---|---|
| 앱 | `main` | 마일스톤 작업 항목 하나 | `feat(study): add unit composition and keep logic` |
| 데이터 | `data` | 100단어 | `data(a1): words 1-100` ([codex_data_task.md](codex_data_task.md) 5장) |

- 접두어: `feat`(기능), `fix`(버그), `style`(디자인·CSS), `chore`(설정·의존성), `docs`(문서), `data`(단어 데이터).
- 커밋 전에 `npm test`와 `npm run build`가 통과해야 한다. 실패한 상태로 커밋하지 않는다.
- 마일스톤이 끝나면 완료 기준을 확인한 뒤 태그를 단다: `m0`, `m1` …
- 데이터 등급이 끝나면 `data` 브랜치를 `main`에 병합하고, `node scripts/build-data.mjs`로 `words.json`을 갱신해 `data: merge a1 into words.json`으로 커밋한다.
