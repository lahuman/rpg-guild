# Dockerfile

# [Stage 1] 빌드 단계 (Builder)
# Vite 최신 버전 요구사항(22.12+)을 충족하는 Node.js 22-alpine 사용
FROM node:24-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 설치를 위해 package.json 복사
COPY package*.json ./

# 모든 의존성 설치 (CI는 clean install로 더 빠르고 안정적)
RUN npm ci

# 소스 코드 전체 복사
COPY . .

# SvelteKit 빌드 (build 폴더 생성)
RUN npm run build

# 프로덕션 의존성만 남기고 제거 (이미지 크기 줄이기 위함)
RUN npm prune --production


# [Stage 2] 실행 단계 (Runner)
# 실행 환경도 동일하게 Node.js 22 버전 사용
FROM node:22-alpine AS runner

# 작업 디렉토리 설정
WORKDIR /app

# 프로덕션 환경 변수 설정
ENV NODE_ENV=production
ENV HOST=0.0.0.0

# 빌드 단계에서 생성된 결과물과 필요한 의존성만 복사
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .

# SvelteKit adapter-node의 기본 포트 3000 노출
EXPOSE 3000

# 서버 실행
CMD [ "node", "build" ]