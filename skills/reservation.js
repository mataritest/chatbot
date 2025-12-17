const { appendCustomerData } = require('../config/sheets');
const { simpleText, basicCard, textWithQuickReplies } = require('../utils/kakaoResponse');

// 세션 관리 함수 (index.js에서 가져옴)
let clearSession = null;

/**
 * 예약하기 스킬 핸들러
 * 
 * 1. 정보 미입력/양식 오류 시: 친절한 안내 메시지 + 취소 버튼
 * 2. 정보 입력 시: DB 저장 + "아키텍트님" 호칭으로 응답 + 네이버 예약 버튼
 */
module.exports = async (req, res) => {
    try {
        const { userRequest } = req.body;
        const utterance = userRequest?.utterance || '';
        const userId = userRequest?.user?.id || 'unknown';

        // 세션 관리 함수 가져오기
        if (!clearSession && req.app.locals.clearSession) {
            clearSession = req.app.locals.clearSession;
        }

        console.log(`📩 예약 스킬 호출: "${utterance}"`);

        // 취소 명령어 체크
        if (utterance.includes('취소') || utterance.includes('그만')) {
            if (clearSession) clearSession(userId);
            return res.json(textWithQuickReplies(
                '예약이 취소되었습니다.\n\n다른 서비스를 이용하시려면 아래 버튼을 눌러주세요.',
                [
                    { label: '처음으로', message: '시작하기' },
                    { label: '예약하기', message: '예약하기' }
                ]
            ));
        }

        // 고객 정보 파싱 시도
        const parseResult = parseCustomerInfo(utterance);

        // 파싱 실패 시 오류 메시지 표시 + 취소 버튼
        if (!parseResult.success) {
            return res.json(textWithQuickReplies(
                parseResult.message,
                [
                    { label: '취소하고 돌아가기', message: '취소' }
                ]
            ));
        }

        const { name, phone, job } = parseResult.data;

        // Google Sheets에 저장
        try {
            await appendCustomerData(name, phone, job);
            console.log(`✅ 고객 정보 저장 성공: ${name}`);
        } catch (dbError) {
            console.error('⚠️ DB 저장 실패 (계속 진행):', dbError.message);
        }

        // 예약 완료 → 세션 초기화
        if (clearSession) clearSession(userId);

        // 아키텍트님 호칭 적용 응답
        const naverUrl = process.env.NAVER_BOOKING_URL || 'https://naver.me/5L7kizbg';

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
 * 고객 정보 파싱 (여러 형식 지원 + 상세 오류 메시지)
 */
function parseCustomerInfo(utterance) {
    // 기본 안내 메시지
    const GUIDE_MESSAGE =
        `예약 확정 및 맞춤형 퍼포먼스 설계를 위해 아래 3가지를 입력해 주세요.\n\n` +
        `1. 성함\n` +
        `2. 연락처 (010-0000-0000 형식)\n` +
        `3. 직업 (업종)\n\n` +
        `📝 입력 예시:\n` +
        `홍길동 / 010-1234-5678 / IT사업가\n\n` +
        `또는\n\n` +
        `홍길동\n` +
        `010-1234-5678\n` +
        `IT사업가`;

    // 입력이 없거나 너무 짧은 경우
    if (!utterance || utterance.length < 5) {
        return { success: false, message: GUIDE_MESSAGE };
    }

    let name, phone, job;
    let parseMethod = '';

    // 방법 1: 슬래시로 구분 (홍길동 / 010-1234-5678 / IT사업가)
    if (utterance.includes('/')) {
        const parts = utterance.split('/').map(s => s.trim());
        if (parts.length >= 3) {
            [name, phone, job] = parts;
            parseMethod = '슬래시';
        } else if (parts.length === 2) {
            // 슬래시가 2개면 직업 누락
            return {
                success: false,
                message: `⚠️ 직업(업종)이 누락되었습니다.\n\n입력하신 내용: ${utterance}\n\n정확한 형식으로 다시 입력해 주세요.\n예: 홍길동 / 010-1234-5678 / IT사업가`
            };
        }
    }

    // 방법 2: 줄바꿈으로 구분
    if (!name) {
        const lines = utterance.split('\n').map(s => s.trim()).filter(s => s);
        if (lines.length >= 3) {
            // 번호 제거 (1. 2. 3. 등)
            const cleaned = lines.map(line =>
                line.replace(/^[0-9]+[\.\)\:]\s*/, '').trim()
            );
            [name, phone, job] = cleaned;
            parseMethod = '줄바꿈';
        } else if (lines.length === 2) {
            return {
                success: false,
                message: `⚠️ 정보가 2개만 입력되었습니다.\n\n성함, 연락처, 직업 3가지를 모두 입력해 주세요.\n\n📝 예시:\n홍길동\n010-1234-5678\nIT사업가`
            };
        } else if (lines.length === 1) {
            // 한 줄만 입력된 경우 - 전화번호 패턴 감지 시도
            const phoneMatch = utterance.match(/01[0-9][-\s]?[0-9]{3,4}[-\s]?[0-9]{4}/);
            if (phoneMatch) {
                return {
                    success: false,
                    message: `📞 연락처가 확인되었습니다: ${phoneMatch[0]}\n\n성함과 직업도 함께 입력해 주세요.\n\n📝 예시:\n홍길동 / ${phoneMatch[0]} / IT사업가`
                };
            }
        }
    }

    // 방법 3: 공백 또는 쉼표로 구분 시도
    if (!name) {
        // 쉼표로 구분
        if (utterance.includes(',')) {
            const parts = utterance.split(',').map(s => s.trim());
            if (parts.length >= 3) {
                [name, phone, job] = parts;
                parseMethod = '쉼표';
            }
        }
    }

    // 이름 검증
    if (!name || name.length < 2) {
        // 전화번호만 입력된 경우
        const phoneMatch = utterance.match(/01[0-9][-\s]?[0-9]{3,4}[-\s]?[0-9]{4}/);
        if (phoneMatch) {
            return {
                success: false,
                message: `📞 연락처: ${phoneMatch[0]}\n\n⚠️ 성함이 확인되지 않았습니다.\n성함을 2글자 이상 입력해 주세요.\n\n📝 예시:\n홍길동 / ${phoneMatch[0]} / IT사업가`
            };
        }
        return {
            success: false,
            message: `⚠️ 성함을 확인할 수 없습니다.\n\n정보를 아래 형식으로 입력해 주세요:\n홍길동 / 010-1234-5678 / IT사업가`
        };
    }

    // 연락처 검증 (한국 휴대폰 번호 형식)
    if (!phone) {
        return {
            success: false,
            message: `✅ 성함: ${name}\n\n⚠️ 연락처가 누락되었습니다.\n연락처를 010-0000-0000 형식으로 입력해 주세요.\n\n📝 예시:\n${name} / 010-1234-5678 / IT사업가`
        };
    }

    // 전화번호 정규화 및 검증
    const phoneDigits = phone.replace(/[^0-9]/g, '');

    // 휴대폰 번호 형식 체크 (010, 011, 016, 017, 018, 019)
    if (!phoneDigits.match(/^01[0-9][0-9]{7,8}$/)) {
        return {
            success: false,
            message: `✅ 성함: ${name}\n⚠️ 연락처: ${phone}\n\n연락처 형식이 올바르지 않습니다.\n010-0000-0000 형식으로 다시 입력해 주세요.\n\n📝 예시:\n${name} / 010-1234-5678 / ${job || 'IT사업가'}`
        };
    }

    // 직업 검증
    if (!job || job.length < 1) {
        return {
            success: false,
            message: `✅ 성함: ${name}\n✅ 연락처: ${phone}\n\n⚠️ 직업(업종)이 누락되었습니다.\n\n📝 예시:\n${name} / ${phone} / IT사업가`
        };
    }

    // 전화번호 포맷팅 (010-1234-5678 형식)
    const formattedPhone = phoneDigits.length === 11
        ? `${phoneDigits.slice(0, 3)}-${phoneDigits.slice(3, 7)}-${phoneDigits.slice(7)}`
        : `${phoneDigits.slice(0, 3)}-${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}`;

    console.log(`✅ 파싱 성공 (${parseMethod}): 이름=${name}, 전화=${formattedPhone}, 직업=${job}`);

    return {
        success: true,
        data: {
            name: name.trim(),
            phone: formattedPhone,
            job: job.trim()
        }
    };
}
