# 에스테틱 예약 챗봇 - 카카오 스킬 서버

카카오 i 오픈빌더용 스킬 서버입니다. Node.js + Express 기반이며, Render에 배포합니다.

## 기능

- **예약하기**: 고객 정보(이름/연락처/직업) 수집 → Google Sheets 저장 → "아키텍트님" 호칭 적용 → 네이버 예약 버튼
- **오시는 길**: 위치 및 주차 안내
- **프라이빗 컨시어지**: 1:1 상담 연결

## 스킬 엔드포인트

| 엔드포인트 | 설명 |
|-----------|------|
| `POST /skill/reservation` | 예약하기 |
| `POST /skill/direction` | 오시는 길 |
| `POST /skill/concierge` | 프라이빗 컨시어지 |

---

## 배포 가이드

### 1. Google Cloud 설정 (이미 완료)

서비스 계정: `test-db-project@zippy-sublime-444718-f5.iam.gserviceaccount.com`

**추가 필요 작업:**

1. **Google Sheets API 활성화**
   - [Google Cloud Console](https://console.cloud.google.com/) → API 및 서비스 → 라이브러리
   - "Google Sheets API" 검색 → 사용 설정

2. **서비스 계정 키 생성**
   - IAM 및 관리자 → 서비스 계정 → `test-db-project` 클릭
   - 키 탭 → 키 추가 → 새 키 만들기 → JSON 선택
   - 다운로드된 JSON 파일에서 `client_email`과 `private_key` 값 복사

3. **Google Spreadsheet 생성 및 공유**
   - 새 스프레드시트 생성
   - 첫 번째 시트 이름을 `고객DB`로 변경
   - 공유 → `test-db-project@zippy-sublime-444718-f5.iam.gserviceaccount.com` 추가 (편집자 권한)
   - 스프레드시트 URL에서 ID 복사 (예: `https://docs.google.com/spreadsheets/d/[여기가_ID]/edit`)

### 2. GitHub 레포지토리 설정

```bash
cd "d:\업무\IMH\외주\에스테틱 챗봇"
git init
git add .
git commit -m "Initial commit: 카카오 스킬 서버"
git remote add origin https://github.com/YOUR_USERNAME/esthetic-chatbot.git
git push -u origin main
```

### 3. Render 배포

1. [Render](https://render.com) 가입/로그인
2. New → Web Service → GitHub 연결
3. 레포지토리 선택
4. 설정:
   - **Name**: esthetic-chatbot
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

5. **Environment Variables** 설정:

| Key | Value |
|-----|-------|
| `GOOGLE_CLIENT_EMAIL` | `test-db-project@zippy-sublime-444718-f5.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | (JSON 키 파일의 private_key 값) |
| `SPREADSHEET_ID` | (스프레드시트 ID) |
| `NAVER_BOOKING_URL` | (네이버 예약 URL) |

6. Create Web Service 클릭

### 4. 카카오 i 오픈빌더 스킬 등록

1. [카카오 i 오픈빌더](https://i.kakao.com) 접속
2. 챗봇 생성 또는 선택
3. 스킬 → 스킬 생성
4. URL: `https://your-app.onrender.com/skill/reservation`
5. 블록에 스킬 연결

---

## 로컬 테스트

```bash
# 의존성 설치
npm install

# .env 파일 생성 (.env.example 참고)
cp .env.example .env
# .env 파일 편집하여 실제 값 입력

# 서버 실행
npm start

# 테스트 (PowerShell)
Invoke-RestMethod -Uri "http://localhost:3000/skill/reservation" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"userRequest":{"utterance":"홍길동 / 010-1234-5678 / IT사업가"}}'
```

---

## 파일 구조

```
에스테틱 챗봇/
├── package.json          # 프로젝트 설정
├── index.js              # 메인 서버
├── config/
│   └── sheets.js         # Google Sheets 연동
├── skills/
│   ├── reservation.js    # 예약하기 스킬
│   ├── direction.js      # 오시는 길 스킬
│   └── concierge.js      # 프라이빗 컨시어지 스킬
├── utils/
│   └── kakaoResponse.js  # 카카오 응답 헬퍼
├── .env.example          # 환경변수 예시
├── .gitignore            # Git 제외 파일
└── README.md             # 이 문서
```
