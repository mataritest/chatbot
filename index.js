const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const path = require('path');

    } catch (error) {
    console.error('에러 발생:', error);
    // 에러 시 사용자에게 보낼 메시지
    res.status(500).json({
        version: "2.0",
        template: {
            outputs: [
                {
                    simpleText: {
                        text: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
                    }
                }
            ]
        }
    });
}
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
