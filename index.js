require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// 스킬 핸들러 임포트
const reservationHandler = require('./skills/reservation');
const directionHandler = require('./skills/direction');
const conciergeHandler = require('./skills/concierge');
const { simpleText } = require('./utils/kakaoResponse');

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

// 테스트 페이지
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

// 헬스 체크 엔드포인트
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '에스테틱 챗봇 스킬 서버가 정상 작동 중입니다.',
    endpoint: 'POST /skill'
  });
});

/**
 * 카카오 스킬 단일 엔드포인트
 * 블록명/액션명으로 분기 처리
 */
app.post('/skill', async (req, res) => {
  try {
    const { action, userRequest } = req.body;

    // 액션명 또는 블록명 추출
    const actionName = action?.name || '';
    const blockName = action?.clientExtra?.block_name || action?.detailParams?.block_name?.value || '';
    const utterance = userRequest?.utterance || '';

    console.log(`📩 스킬 호출 - 액션: ${actionName}, 블록: ${blockName}, 발화: "${utterance}"`);

    // 액션/블록명으로 분기 처리
    // 예약하기 관련
    if (actionName.includes('reservation') ||
      blockName.includes('예약') ||
      utterance.includes('/')) {
      return reservationHandler(req, res);
    }

    // 오시는 길 관련
    if (actionName.includes('direction') ||
      blockName.includes('오시는') ||
      blockName.includes('위치') ||
      utterance.includes('오시는') ||
      utterance.includes('위치') ||
      utterance.includes('주소')) {
      return directionHandler(req, res);
    }

    // 프라이빗 컨시어지 관련
    if (actionName.includes('concierge') ||
      blockName.includes('컨시어지') ||
      blockName.includes('상담') ||
      utterance.includes('상담') ||
      utterance.includes('컨시어지') ||
      utterance.includes('문의')) {
      return conciergeHandler(req, res);
    }

    // 기본 동작: 예약하기 (메인 기능)
    console.log('📋 기본 동작 → 예약하기');
    return reservationHandler(req, res);

  } catch (error) {
    console.error('❌ 스킬 처리 오류:', error);
    return res.json(simpleText('죄송합니다. 잠시 후 다시 시도해 주세요.'));
  }
});

// 기존 엔드포인트도 유지 (로컬 테스트용)
app.post('/skill/reservation', reservationHandler);
app.post('/skill/direction', directionHandler);
app.post('/skill/concierge', conciergeHandler);

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 스킬 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📋 카카오 스킬 URL: POST /skill`);
  console.log(`📋 테스트 페이지: GET /test`);
});
