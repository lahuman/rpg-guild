# 🛡️ RPG Guild Manager

**"일상을 모험으로, 동료를 영웅으로."**

RPG Guild Manager는 단순한 할 일 관리(Todo)를 넘어, 우리가 작성하는 소설 속 등장인물(캐릭터)들이 퀘스트를 수행하고 성장하는 **게이미피케이션 협업 툴**입니다.

사용자(작가/플레이어)는 길드를 생성하고, 가상의 캐릭터들을 등록하여 그들이 미션을 수행하도록 지시합니다. 완료된 미션은 골드 보상으로 이어지며, 모인 골드로 상점을 이용하거나 캐릭터를 성장시킬 수 있습니다.

---

## ✨ Key Features (주요 기능)

### 1. 🏰 길드 시스템 (Guilds)
- **간편한 생성 & 초대:** 길드 이름만으로 생성하고, 대시보드에서 **초대 코드(ID)를 복사**하여 동료를 쉽게 초대할 수 있습니다.
- **자유로운 이동:** 언제든 길드를 **탈퇴**하고, 새로운 길드를 생성하거나 다른 길드로 가입할 수 있습니다.
- **실시간 대시보드:** 현재 멤버 수와 주요 메뉴(멤버, 퀘스트, 로그)로 빠르게 이동합니다.

### 2. 🧙‍♂️ 캐릭터 도감 (Characters)
- **가상 인물 관리:** 실제 유저가 아닌, '검사', '마법사', '힐러' 등 RPG 직업을 가진 캐릭터를 생성합니다.
- **성장과 보상:** 각 캐릭터는 개별적으로 골드 주머니를 가지며, 미션을 통해 부를 축적합니다.
- **CRUD:** 캐릭터의 이름, 직업, 설정을 자유롭게 수정하고 관리할 수 있습니다.

### 3. 📜 퀘스트 보드 (Missions)
- **다양한 의뢰:** '매일 운동하기', '회의 참석' 등 현실의 과제를 퀘스트로 등록합니다.
- **솔로 & 파티:** 혼자 수행하는 **Solo** 미션과, 여러 캐릭터가 협력해야 하는 **Party** 미션을 지원합니다.
- **수행 완료 처리:** 미션 완료 시 수행한 캐릭터들을 선택하면, 즉시 골드가 지급됩니다. (하루 한 번 제한, 중복 방지)

### 4. 💰 경제 및 상점 (Economy & Shop)
- **자율 상점 관리:** 길드원 누구나 상점에 **자신들이 원하는 보상(아이템)을 등록, 수정, 삭제**할 수 있습니다.
- **골드 소비:** 캐릭터가 모은 골드로 '휴식 1시간', '커피 쿠폰' 등 등록된 보상을 구매합니다.
- **투명한 거래:** 구매 즉시 로그가 기록되며, 골드가 차감됩니다.

### 5. 📜 활동 로그 (Activity Logs)
- **타임라인:** 미션 수행(수입)과 상점 이용(지출) 내역을 날짜별로 한눈에 확인할 수 있습니다.
- **투명성:** 누가 언제 어떤 캐릭터로 무엇을 했는지 기록되어 길드 운영의 투명성을 보장합니다.

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | SvelteKit, TypeScript, TailwindCSS |
| **Backend** | Firebase (Authentication, Firestore) |
| **State** | Svelte Stores (Reactive) |
| **Deploy** | Docker, Node.js Adapter |

---

## 🚀 Getting Started (로컬 실행)

### 1. Prerequisites
- Node.js (v18+)
- Firebase 프로젝트 생성 (Authentication, Firestore Database 활성화 필요)

### 2. Installation
```bash
# 저장소 클론
git clone [https://github.com/your-username/rpg-guild.git](https://github.com/your-username/rpg-guild.git)
cd rpg-guild

# 의존성 설치
npm install
```

### 3. Firebase Configuration
프로젝트 루트에 `.env` 파일을 생성하고 Firebase 설정 정보를 입력하세요.

```env
# .env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run Development Server
```bash
npm run dev
```
브라우저에서 `http://localhost:5173`으로 접속합니다.

---

## 🐳 Docker Deployment (운영 배포)

이 프로젝트는 `adapter-node`와 `Multi-stage build`를 사용하여 최적화된 Docker 이미지를 제공합니다.

### 1. Build Image
```bash
docker build -t rpg-guild-app .
```

### 2. Run Container
환경 변수 파일(`.env`)을 함께 주입하여 실행하는 것을 권장합니다.

```bash
docker run -d -p 3000:3000 --env-file .env --name rpg-guild-container rpg-guild-app
```

이제 `http://localhost:3000`에서 운영 버전을 확인할 수 있습니다.

---

## 📂 Project Structure

```
src/
├── lib/
│   ├── firebase.ts       # Firebase 초기화 및 Auth
│   └── stores/           # 비즈니스 로직 (State Management)
│       ├── userStore.ts    # 유저 정보 & 길드 탈퇴 로직
│       ├── guildStore.ts   # 길드, 캐릭터 로직
│       ├── missionStore.ts # 미션 생성, 수행, 트랜잭션
│       ├── itemStore.ts    # [NEW] 상점 아이템 관리
│       └── logStore.ts     # 통합 활동 로그 조회
├── routes/
│   ├── +page.svelte      # 랜딩 및 로그인/가입
│   └── guilds/
│       └── [guildId]/
│           ├── +page.svelte       # 길드 대시보드 (탈퇴, 초대코드)
│           ├── members/           # 캐릭터 관리 & 상점(구매/관리)
│           ├── missions/          # 퀘스트 보드
│           └── logs/              # 활동 내역 타임라인
```

---

## 🤝 Contributing

버그 제보나 기능 제안은 언제나 환영합니다! Issue를 등록하거나 Pull Request를 보내주세요.

## 📝 License

This project is licensed under the [MIT License](LICENSE).