/**
 * 카카오 챗봇 응답 헬퍼 함수들
 * 카카오 i 오픈빌더 스킬 응답 포맷을 쉽게 생성
 */

/**
 * SimpleText 응답 생성
 * @param {string} text - 표시할 텍스트
 */
function simpleText(text) {
    return {
        version: '2.0',
        template: {
            outputs: [
                { simpleText: { text } }
            ]
        }
    };
}

/**
 * SimpleImage 응답 생성
 * @param {string} imageUrl - 이미지 URL
 * @param {string} altText - 대체 텍스트
 */
function simpleImage(imageUrl, altText = '이미지') {
    return {
        version: '2.0',
        template: {
            outputs: [
                {
                    simpleImage: {
                        imageUrl,
                        altText
                    }
                }
            ]
        }
    };
}

/**
 * BasicCard 응답 생성
 * @param {Object} options - 카드 옵션
 * @param {string} options.title - 제목
 * @param {string} options.description - 설명
 * @param {string} [options.thumbnail] - 썸네일 이미지 URL
 * @param {Array} [options.buttons] - 버튼 배열
 */
function basicCard({ title, description, thumbnail, buttons }) {
    const card = { title, description };

    if (thumbnail) {
        card.thumbnail = { imageUrl: thumbnail };
    }

    if (buttons && buttons.length > 0) {
        card.buttons = buttons.map(btn => {
            const button = { label: btn.label, action: btn.action };

            if (btn.action === 'webLink') {
                button.webLinkUrl = btn.webLinkUrl;
            } else if (btn.action === 'message') {
                button.messageText = btn.messageText;
            } else if (btn.action === 'phone') {
                button.phoneNumber = btn.phoneNumber;
            }

            return button;
        });
    }

    return {
        version: '2.0',
        template: {
            outputs: [
                { basicCard: card }
            ]
        }
    };
}

/**
 * 텍스트 + QuickReplies 응답 생성
 * @param {string} text - 표시할 텍스트
 * @param {Array} quickReplies - 빠른 응답 버튼 배열
 */
function textWithQuickReplies(text, quickReplies) {
    return {
        version: '2.0',
        template: {
            outputs: [
                { simpleText: { text } }
            ],
            quickReplies: quickReplies.map(qr => ({
                label: qr.label,
                action: qr.action || 'message',
                messageText: qr.messageText || qr.label
            }))
        }
    };
}

/**
 * 복합 응답 생성 (여러 출력 조합)
 * @param {Array} outputs - 출력 배열
 */
function multipleOutputs(outputs) {
    return {
        version: '2.0',
        template: {
            outputs
        }
    };
}

module.exports = {
    simpleText,
    simpleImage,
    basicCard,
    textWithQuickReplies,
    multipleOutputs
};
