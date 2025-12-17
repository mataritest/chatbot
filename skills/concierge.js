const { simpleText, basicCard } = require('../utils/kakaoResponse');

/**
 * 프라이빗 컨시어지 스킬 핸들러
 * 
 * 1:1 채팅 상담 연결 안내
 */
module.exports = async (req, res) => {
    try {
        console.log('💬 프라이빗 컨시어지 스킬 호출');

        return res.json(basicCard({
            title: '프라이빗 컨시어지',
            description:
                `1:1 맞춤 상담을 도와드립니다.\n\n` +
                `아래 버튼을 눌러 상담원과 직접 대화해 주세요.\n` +
                `운영시간: 평일 10:00 - 19:00`,
            buttons: [
                {
                    label: '1:1 상담 시작하기',
                    action: 'message',
                    messageText: '상담원 연결'
                },
                {
                    label: '전화 문의',
                    action: 'phone',
                    phoneNumber: process.env.CONTACT_PHONE || '010-0000-0000'
                }
            ]
        }));

    } catch (error) {
        console.error('❌ 컨시어지 스킬 오류:', error);
        return res.json(simpleText('죄송합니다. 잠시 후 다시 시도해 주세요.'));
    }
};
