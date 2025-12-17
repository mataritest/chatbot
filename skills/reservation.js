const { appendCustomerData } = require('../config/sheets');
const { simpleText, basicCard } = require('../utils/kakaoResponse');

/**
 * 예약하기 스킬 핸들러
 * 
 * 1. 정보 미입력 시: 입력 안내 메시지
 * 2. 정보 입력 시: DB 저장 + "아키텍트님" 호칭으로 응답 + 네이버 예약 버튼
 */
module.exports = async (req, res) => {
    try {
        const { userRequest } = req.body;
        const utterance = userRequest?.utterance || '';

        console.log(`📩 예약 스킬 호출: "${utterance}"`);

        // 정보 파싱 시도 (예: "홍길동 / 010-1234-5678 / IT사업가")
        const parts = utterance.split('/').map(s => s.trim());

        // 정보가 3개 미만이면 입력 안내
        if (parts.length < 3 || !isValidInput(parts)) {
            return res.json(simpleText(
                `예약 확정 및 맞춤형 퍼포먼스 설계를 위해 아래 3가지를 입력해 주세요.\n\n` +
                `1. 성함\n` +
                `2. 연락처\n` +
                `3. 직업 (업종)\n\n` +
                `(예: 홍길동 / 010-1234-5678 / IT사업가)`
            ));
        }

        const [name, phone, job] = parts;

        // Google Sheets에 저장
        try {
            await appendCustomerData(name, phone, job);
            console.log(`✅ 고객 정보 저장 성공: ${name}`);
        } catch (dbError) {
            console.error('⚠️ DB 저장 실패 (계속 진행):', dbError.message);
            // DB 저장 실패해도 응답은 진행
        }

        // 아키텍트님 호칭 적용 응답
        const naverUrl = process.env.NAVER_BOOKING_URL || 'https://naver.me/예약URL';

        return res.json(basicCard({
            title: `${name} 아키텍트님, 확인되었습니다.`,
            description:
                `헤드 디렉터(Head Director)와의 'The First Session' 예약을 도와드립니다.\n\n` +
                `아래 버튼을 눌러 예약을 완료해 주세요.`,
            buttons: [
                {
                    label: '네이버 예약하기',
                    action: 'webLink',
                    webLinkUrl: naverUrl
                }
            ]
        }));

    } catch (error) {
        console.error('❌ 예약 스킬 오류:', error);
        return res.json(simpleText('죄송합니다. 잠시 후 다시 시도해 주세요.'));
    }
};

/**
 * 입력값 유효성 검사
 */
function isValidInput(parts) {
    const [name, phone, job] = parts;

    // 이름: 최소 2글자
    if (!name || name.length < 2) return false;

    // 연락처: 숫자와 하이픈 포함, 최소 10자
    if (!phone || phone.replace(/[^0-9]/g, '').length < 10) return false;

    // 직업: 최소 1글자
    if (!job || job.length < 1) return false;

    return true;
}
