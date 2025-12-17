require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// 스킬 모듈 임포트
const reservationSkill = require('./skills/reservation');
const directionSkill = require('./skills/direction');
const conciergeSkill = require('./skills/concierge');

const app = express();

// CORS 설정 (테스트용)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// JSON 파싱 미들웨어
app.use(bodyParser.json());

// 정적 파일 서빙 (테스트 페이지)
app.use('/public', express.static(path.join(__dirname, 'public')));

// 테스트 페이지 리다이렉트
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

// 헬스 체크 엔드포인트 (Render 배포 확인용)
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '에스테틱 챗봇 스킬 서버가 정상 작동 중입니다.',
    endpoints: [
      'POST /skill/reservation - 예약하기',
      'POST /skill/direction - 오시는 길',
      'POST /skill/concierge - 프라이빗 컨시어지'
    ]
  });
});

// 카카오 스킬 엔드포인트
app.post('/skill/reservation', reservationSkill);
app.post('/skill/direction', directionSkill);
app.post('/skill/concierge', conciergeSkill);

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 스킬 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📋 엔드포인트:`);
  console.log(`   - POST /skill/reservation`);
  console.log(`   - POST /skill/direction`);
  console.log(`   - POST /skill/concierge`);
});
