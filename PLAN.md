# Nike Design System 전환 Plan

## 결정 사항
- **테마**: Nike Light (White 배경 #FFFFFF, Nike Black #111111)
- **Rank 색상**: Nike color ramp (red/orange/green/blue) systematic 선택으로 grade 표현

---

## 구현 순서

### Phase 1: Foundation — Design Tokens & CSS Variables
**목표**: 색상, typography, spacing system을 Nike 사양으로 전면 교체

**파일**:
- `src/routes/layout.css` — CSS 변수 전면 교체
- `src/app.css` — Tailwind import + Nike CSS foundations

**내용**:
1. CSS 변수 정의:
   - Nike Black `#111111`, White `#FFFFFF`
   - Greys: Snow `#FAFAFA`, Light Gray `#F5F5F5`, Hover Gray `#E5E5E5`, Dark Surface `#28282A`, Deep Charcoal `#1F1F21`
   - Text: Primary `#111111`, Secondary `#707072`, Disabled `#9E9EA0`
   - Semantic: Nike Red `#D30005`, Nike Orange `#D33918`, Success Green `#007D48`, Link Blue `#1151FF`
   - Border: Primary `#707072`, Secondary `#CACACB`
   - Spacing tokens: 4px 기반 4~80px 시스템
   - Border-radius: 0px(product), 8px(form), 20px(container), 24px(search), 30px(button pill)

2. Typography:
   - Display: `Oswald` (condensed uppercase 대체) + `font-weight: 500`, `line-height: 0.90`, `text-transform: uppercase`
   - Body: `Inter` (Helvetica 대체) + `font-weight: 400/500`
   - Google Fonts import: Oswald + Inter

3. Global CSS resets:
   - Background: `#FFFFFF`
   - Text: `#111111`
   - Flat elevation (no shadows anywhere)
   - Smooth transitions: `200ms ease`

**verify**: `npm run check` 통과 + `npm run dev` 실행 후 색상 변수 console.log로 확인

---

### Phase 2: Global Components
**목표**: 재사용 컴포넌트들을 Nike 스타일로 교체

**파일** (순서대로):
1. `src/lib/components/AppActionButton.svelte` — 버튼 교체
   - Primary: Nike Black bg, white text, 30px pill radius
   - Secondary: transparent bg, 1.5px `#CACACB` border, Nike Black text
   - Focus ring: `0 0 0 2px rgba(39, 93, 197, 1)`
   - Hover: background shift grey, no shadow, no lift

2. `src/lib/components/FormField.svelte` — 인풋 교체
   - Background: `#F5F5F5`
   - Border: 1px `#CACACB`, focus 시 `#111111`
   - Border-radius: 8px
   - Placeholder: `#707072`

3. `src/lib/components/ModalBase.svelte` — 모달 교체
   - Background: White, no shadow, no glow
   - Border-radius: 20px
   - Flat design, grey border optional
   - Focus trap 유지

4. `src/lib/components/ToastNotifications.svelte` — 토스트 교체
   - White background, semantic color left border only
   - Nike Red `#D30005` for error, Success Green `#007D48` for success, Link Blue `#1151FF` for info
   - Shadow 없음, flat design

5. `src/lib/components/MobileNav.svelte` — 네비게이션 교체
   - Background: `#FAFAFA` with top border `#CACACB`
   - Icon buttons: grey pill shape
   - Active indicator: Nike Black underline

**verify**: 각 컴포넌트 `npm run dev`에서 렌더링 확인

---

### Phase 3: Layout & Navigation
**목표**: 전역 레이아웃과 네비게이션 Nike 스타일 적용

**파일**:
- `src/routes/+layout.svelte` — root layout
  - Nav: sticky white, Nike Black text, 16px/500 Inter
  - Promotional banner: `#111111` bg, white text, 12px/500 Inter
  - Footer: flat, minimal, white/grey

**verify**: 모든 라우트에서 네비게이션 일관성 확인

---

### Phase 4: Feature Pages
**목표**: 각 페이지 페이지를 Nike retail 카탈로그 느낌으로 전환

**파일 및 변경점**:

1. `src/routes/+page.svelte` (Landing)
   - Hero section: full-bleed image, uppercase display headline (Oswald), pill button
   - Product grid: tight gaps (4-12px), no card shadows, no border radius on images
   - Section breaks: 48-80px

2. `src/routes/guilds/[guildId]/+page.svelte` (Dashboard)
   - Background: white
   - Stats panels: white cards, no shadow, 20px radius, 1px `#CACACB` border or inset divider
   - Primary action buttons: Nike Black pill
   - Section headings: Oswald, uppercase

3. `src/routes/guilds/[guildId]/missions/+page.svelte`
   - Mission cards: flat white cards, 20px radius, grey border
   - Status badges: pill shape, semantic colors (green=complete, orange=in-progress)
   - Character cards: image on top (no radius), text metadata below

4. `src/routes/guilds/[guildId]/logs/+page.svelte`
   - Log entries: flat list, 1px inset divider between items
   - Timestamps: 12px/500, `#707072`
   - No card shadows or glows

5. `src/routes/guilds/[guildId]/members/+page.svelte`
   - Member cards: Nike card pattern, white background, tight grid (4-12px gaps)
   - Rank displayed with Nike color ramp (functional accent only — no UI color beyond grey + systematic accents)

**verify**: 모든 페이지 Nike Light 테마 일관성 확인

---

### Phase 5: Feature Components
**목표**: 기능 컴포넌트 Nike 스타일 적용

**파일**:
1. `src/lib/components/CharacterCard.svelte`
   - White background, 20px radius, no shadow
   - Image: top, no border radius
   - Text: Nike Black title, grey metadata
   - Rank: Nike accent color pill badge
   - Hover: text underline, no lift

2. `src/lib/components/PointTransferModal.svelte` — gold transfer modal
   - Flat white, 20px radius
   - Input fields: Nike form style
   - Buttons: Nike pill buttons

3. `src/lib/components/MiniGameModal.svelte` — grade challenge
   - Flat white, 20px radius
   - Nike buttons
   - Progress indicator: grey bar, accent color fill

4. `src/lib/components/ShopManager.svelte`
   - Item grid: tight gaps, white cards, no shadows
   - Price: 14px/500, `#707072`
   - Add to cart: Nike Black pill button

**verify**: 모든 기능 정상 동작 + 디자인 일관성

---

### Phase 6: Rank/Grade Color System
**목표**: RPG rank를 Nike 색상 체계로 재정의

**파일**: `src/lib/stores/guild/constants.ts` + `src/lib/constants/guild-ui.ts`

**변경**: 20 Rank를 Nike 8색상 ramp에 매핑

|rank|색상|Nike ramp|
|---|---|---|
|Rank01-02|`#D30005` (Red)|Red 600-700|
|Rank03-05|`#D33918` (Orange)|Orange badge|
|Rank06-08|`#99470A` (Amber-Dark)|Orange ramp dark end|
|Rank09-11|`#007D48` (Green)|Green 600|
|Rank12-14|`#008E98` (Teal)|Teal 600|
|Rank15-16|`#1151FF` (Blue)|Blue 500 / 400|
|Rank17-18|`#6E0FF6` (Purple)|Purple 600|
|Rank19-20|`#ED1AA0` (Pink)|Pink 600|

**적용**: Rank badge, grade card borders, level indicator 색상만 적용. UI shell은 grey scale 유지.

---

## 외부 의존성
- Google Fonts: Oswald (display), Inter (body) 추가 필요

**추가** `src/app.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Oswald:wght@500&display=swap');
```

---

## 테스트 전략
1. Phase 완료마다 `npm run check` 통과 확인
2. Phase 완료마다 주요 用户 플로우 수동 테스트
3. 모든 터치포인트에서 Nike Light 디자인 적용 확인
4. Rank 색상 system 올바르게 작동하는지 확인