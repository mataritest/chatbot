# 에스테틱 예약 챗봇 - 카카오 스킬 서버

카카오 i 오픈빌더용 스킬 서버입니다. Node.js + Express 기반이며, Render에 배포합니다.

## 기능

- **예약하기**: 고객 정보(이름/연락처/직업) 수집 → Google Sheets 저장 → "아키텍트님" 호칭 적용 → 네이버 예약 버튼
- **오시는 길**: 위치 및 주차 안내
- **프라이빗 컨시어지**: 1:1 상담 연결

## 스킬 엔드포인트

**카카오 스킬 URL (단일 엔드포인트):**
```
POST /skill
```

서버가 액션명/블록명/발화 내용을 기준으로 자동 분기 처리합니다.

---

## 배포 가이드

### 1. Google Cloud 설정

1. **Google Sheets API 활성화**
   - Google Cloud Console → API 및 서비스 → 라이브러리
   - "Google Sheets API" 검색 → 사용 설정

2. **서비스 계정 생성 및 키 다운로드**
   - IAM 및 관리자 → 서비스 계정 → 새로 만들기
   - 키 탭 → 키 추가 → 새 키 만들기 → JSON 선택

3. **Google Spreadsheet 공유**
   - 스프레드시트에서 공유 → 서비스 계정 이메일 추가 (편집자 권한)

### 2. Render 배포

1. GitHub에 코드 푸시
2. Render에서 Web Service 생성
3. **Secret Files** 설정:
   - Filename: `[서비스계정이름].json`
   - 키 파일 내용 전체 붙여넣기

4. Build/Start 설정:
   - Build Command: `npm install`
   - Start Command: `npm start`

### 3. 카카오 i 오픈빌더 스킬 등록

1. 스킬 → 스킬 생성
2. URL: `https://[your-app].onrender.com/skill`
3. 블록에 스킬 연결

---

## 로컬 테스트

```bash
npm install
npm start
# 브라우저에서 http://localhost:3000/test 접속
```

---

## 파일 구조

```
├── package.json          # 프로젝트 설정
├── index.js              # 메인 서버 (단일 /skill 엔드포인트)
├── config/sheets.js      # Google Sheets 연동
├── skills/               # 스킬 핸들러
├── utils/                # 유틸리티 함수
├── public/test.html      # 테스트 페이지
└── .gitignore            # Git 제외 파일
```
