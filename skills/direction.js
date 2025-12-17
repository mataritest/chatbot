const { simpleText, simpleImage, basicCard } = require('../utils/kakaoResponse');

/**
 * 오시는 길 스킬 핸들러
 * 
 * 위치 및 주차 안내 이미지/정보 전송
 */
module.exports = async (req, res) => {
    try {
        console.log('📍 오시는 길 스킬 호출');

        const directionImageUrl = process.env.DIRECTION_IMAGE_URL;

        // 이미지 URL이 설정되어 있으면 이미지 카드로 응답
        if (directionImageUrl) {
            return res.json(basicCard({
                title: '오시는 길',
                description:
                    `📍 주소: 서울특별시 용산구 한강대로 95 래미안 용산 더 센트럴 2층 222호\n\n` +
                    `🚗 주차 안내:\n` +
                    `- 건물 내 지하주차장 이용 가능\n` +
                    `- 2시간 무료 주차 제공`,
                thumbnail: directionImageUrl,
                buttons: [
                    {
                        label: '네이버 지도로 보기',
                        action: 'webLink',
                        webLinkUrl: process.env.NAVER_MAP_URL || 'https://naver.me/5L7kizbg'
                    }
                ]
            }));
        }

        // 이미지 URL이 없으면 텍스트로 응답
        return res.json(simpleText(
            `📍 오시는 길\n\n` +
            `주소: 서울특별시 용산구 한강대로 95 래미안 용산 더 센트럴 2층 222호\n\n` +
            `🚗 주차 안내:\n` +
            `- 건물 내 지하주차장 이용 가능\n` +
            `- 2시간 무료 주차 제공\n\n` +
            `🔗 네이버 지도보기:\n` +
            `${process.env.NAVER_MAP_URL || 'https://naver.me/5L7kizbg'}\n\n` +
            `문의사항은 프라이빗 컨시어지를 통해 연락해 주세요.`
        ));

    } catch (error) {
        console.error('❌ 오시는 길 스킬 오류:', error);
        return res.json(simpleText('죄송합니다. 잠시 후 다시 시도해 주세요.'));
    }
};
