require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// 스킬 핸들러 임포트
const reservationHandler = require('./skills/reservation');
const directionHandler = require('./skills/direction');
const conciergeHandler = require('./skills/concierge');
const brandHandler = require('./skills/brand');
const { simpleText, textWithQuickReplies } = require('./utils/kakaoResponse');

const app = express();

// ============================================
// 사용자 세션 관리 (메모리 저장)
// ============================================
const userSessions = {};

// 세션 만료 시간 (5분)
const SESSION_TIMEOUT = 5 * 60 * 1000;

/**
 * 사용자 세션 가져오기/생성
 */
function getSession(userId) {
  if (!userSessions[userId]) {
    userSessions[userId] = {
      state: null,
      lastActivity: Date.now()
    };
  }
  userSessions[userId].lastActivity = Date.now();
  return userSessions[userId];
}

/**
 * 세션 상태 설정
 */
function setSessionState(userId, state) {
  const session = getSession(userId);
  session.state = state;
  console.log(`🔄 세션 상태 변경: ${userId} → ${state}`);
}

/**
 * 세션 초기화
 */
function clearSession(userId) {
  if (userSessions[userId]) {
    userSessions[userId].state = null;
    console.log(`🔄 세션 초기화: ${userId}`);
  }
}

/**
 * 만료된 세션 정리 (메모리 관리)
 */
setInterval(() => {
  const now = Date.now();
  Object.keys(userSessions).forEach(userId => {
    if (now - userSessions[userId].lastActivity > SESSION_TIMEOUT) {
      delete userSessions[userId];
      console.log(`🗑️ 만료된 세션 삭제: ${userId}`);
    }
  });
}, 60000); // 1분마다 정리

// ============================================

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
 * 세션 상태 + 블록명/액션명으로 분기 처리
 */
app.post('/skill', async (req, res) => {
  try {
    const { action, userRequest } = req.body;

    // 사용자 ID 추출
    const userId = userRequest?.user?.id || 'unknown';
    const session = getSession(userId);

    // 액션명 또는 블록명 추출
    const actionName = action?.name || '';
    const blockId = action?.id || '';
    const blockName = action?.clientExtra?.block_name || action?.detailParams?.block_name?.value || '';
    const utterance = userRequest?.utterance || '';

    // 상세 로그 출력
    console.log(`📩 스킬 호출`);
    console.log(`   유저: ${userId.slice(0, 8)}...`);
    console.log(`   상태: ${session.state || '없음'}`);
    console.log(`   액션: ${actionName || '없음'}`);
    console.log(`   블록: ${blockName || '없음'}`);
    console.log(`   발화: "${utterance}"`);

    // ============================================
    // 1. 명시적 명령어 처리 (시작하기, 처음으로 등)
    // ============================================
    if (utterance.includes('시작') ||
      utterance.includes('처음') ||
      utterance.includes('메뉴') ||
      actionName.includes('welcome')) {
      clearSession(userId);
      return res.json(textWithQuickReplies(
        '안녕하세요! 당신의 피부를 위한 마음손길입니다. 🙏\n\n원하시는 서비스를 선택해 주세요.',
        [
          { label: '예약하기', message: '예약하기' },
          { label: '오시는 길', message: '오시는 길' },
          { label: '1:1 상담', message: '1:1 상담' },
          { label: '브랜드 소개', message: '브랜드 소개' }
        ]
      ));
    }

    // ============================================
    // 2. 예약 시작 명령 (다양한 키워드 지원)
    // ============================================
    const reservationKeywords = [
      '예약', '예약하기', '예약 하기', '예약할게', '예약할래', '예약하고싶어',
      '예약 신청', '예약신청', '상담 예약', '상담예약',
      '신청', '신청하기', '신청할게',
      '방문 예약', '방문예약', '첫 방문', '첫방문',
      '세션', '세션 예약', '퍼스트 세션', 'first session',
      'ts', 'reservation', 'book', 'booking'
    ];

    const isReservationTrigger = reservationKeywords.some(keyword =>
      utterance.toLowerCase().includes(keyword.toLowerCase())
    ) || actionName.includes('reservation') || blockName.includes('예약');

    if (isReservationTrigger) {
      setSessionState(userId, 'reservation');
      return reservationHandler(req, res);
    }

    // ============================================
    // 3. 오시는 길
    // ============================================
    if (utterance.includes('오시는') ||
      utterance.includes('위치') ||
      utterance.includes('주소') ||
      actionName.includes('direction')) {
      clearSession(userId);
      return directionHandler(req, res);
    }

    // ============================================
    // 4. 프라이빗 컨시어지
    // ============================================
    if (utterance.includes('상담') ||
      utterance.includes('컨시어지') ||
      utterance.includes('문의') ||
      actionName.includes('concierge')) {
      clearSession(userId);
      return conciergeHandler(req, res);
    }

    // ============================================
    // 5. 브랜드 소개 (Director Info)
    // ============================================
    if (utterance.includes('브랜드') ||
      utterance.includes('원장') ||
      utterance.includes('소개') ||
      utterance.includes('가격') ||
      actionName.includes('brand')) {
      clearSession(userId);
      return brandHandler(req, res);
    }

    // ============================================
    // 5. 세션 상태에 따른 처리
    // ============================================
    if (session.state === 'reservation') {
      // 예약 진행 중 → 입력값을 예약 핸들러로 전달
      console.log('📋 예약 진행 중 → 정보 입력 처리');
      return reservationHandler(req, res);
    }

    // ============================================
    // 6. 폴백: 컨텍스트 없음 → 이해하기 어려워요
    // ============================================
    console.log('⚠️ 매칭되는 명령 없음 → 폴백 응답');
    return res.json(textWithQuickReplies(
      '죄송해요, 이해하기 어려워요 😅\n\n원하시는 서비스를 선택해 주세요.',
      [
        { label: '처음으로 돌아가기', message: '시작하기' },
        { label: '예약하기', message: '예약하기' },
        { label: '오시는 길', message: '오시는 길' },
        { label: '브랜드 소개', message: '브랜드 소개' }
      ]
    ));

  } catch (error) {
    console.error('❌ 스킬 처리 오류:', error);
    return res.json(simpleText('죄송합니다. 잠시 후 다시 시도해 주세요.'));
  }
});

// 기존 엔드포인트도 유지 (로컬 테스트용)
app.post('/skill/reservation', reservationHandler);
app.post('/skill/direction', directionHandler);
app.post('/skill/concierge', conciergeHandler);
app.post('/skill/brand', brandHandler);

// 세션 관리 함수 내보내기 (reservation.js에서 사용)
app.locals.clearSession = clearSession;
app.locals.setSessionState = setSessionState;

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 스킬 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📋 카카오 스킬 URL: POST /skill`);
  console.log(`📋 테스트 페이지: GET /test`);
});

// 세션 함수 전역 내보내기
module.exports = { clearSession, setSessionState };

// ============================================
// [Render Free Tier 방지용] Self-Ping
// 10분(600,000ms)마다 서버가 자기 자신(공개 URL)을 호출하여 Sleep 방지
// ============================================
const https = require('https');

setInterval(() => {
  const url = process.env.RENDER_EXTERNAL_URL; // Render에서 자동 제공하는 환경변수
  if (url) {
    https.get(url, (res) => {
      console.log(`📡 Self-Ping 성공: ${res.statusCode}`);
    }).on('error', (e) => {
      console.error(`❌ Self-Ping 오류: ${e.message}`);
    });
  }
}, 10 * 60 * 1000); // 10분마다 실행
