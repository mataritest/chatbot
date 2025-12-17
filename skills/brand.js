const { simpleText, basicCard, textWithQuickReplies } = require('../utils/kakaoResponse');

/**
 * 브랜드 소개 (Director Info) 스킬 핸들러
 * 
 * 원장님 소개, 철학, FAQ 등을 제공
 */
module.exports = async (req, res) => {
    try {
        const { userRequest } = req.body;
        const utterance = userRequest?.utterance || '';

        console.log(`✨ 브랜드 스킬 호출: "${utterance}"`);

        // 1. 가격표 문의
        if (utterance.includes('가격') || utterance.includes('비용')) {
            return res.json(simpleText(
                `📋 마음손길 프로그램 안내\n\n` +
                `The First Session: 30,000원 (첫 방문 혜택)\n` +
                `Basic Care: 80,000원 ~\n` +
                `Premium Care: 150,000원 ~\n\n` +
                `* 정확한 상담은 예약 후 방문 시 진행됩니다.`
            ));
        }

        // 2. 기본 소개 (원장님 / 철학)
        return res.json(basicCard({
            title: '당신의 피부 아키텍트, 마음손길',
            description:
                `"피부는 건축과 같습니다. 기초부터 탄탄하게 설계해야 무너지지 않는 아름다움을 가질 수 있습니다."\n\n` +
                `마음손길은 단순한 관리가 아닌, 당신만의 고유한 아름다움을 설계합니다.\n\n` +
                `- 1:1 맞춤 퍼스널 케어\n` +
                `- 프리미엄 에스테틱 브랜드 제품 사용\n` +
                `- 프라이빗 1인실 운영`,
            buttons: [
                {
                    label: '프로그램 가격 보기',
                    action: 'message',
                    messageText: '가격표 보여줘'
                },
                {
                    label: '예약하기',
                    action: 'message',
                    messageText: '예약하기'
                }
            ]
        }));

    } catch (error) {
        console.error('❌ 브랜드 스킬 오류:', error);
        return res.json(simpleText('죄송합니다. 잠시 후 다시 시도해 주세요.'));
    }
};
