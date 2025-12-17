const { google } = require('googleapis');
const path = require('path');

// Google 서비스 계정 키 파일 로드
let credentials;
try {
    credentials = require(path.join(__dirname, '..', 'zippy-sublime-444718-f5-45529eb4a57e.json'));
    console.log('✅ Google 서비스 계정 키 로드 성공');
} catch (e) {
    console.error('❌ Google 서비스 계정 키 파일을 찾을 수 없습니다.');
    credentials = null;
}

// 스프레드시트 ID (URL에서 추출)
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1lO89TSNMbLWUhkp6UBpSkK27CSRx4A4XBAWo4TNQCds';

// Google Sheets API 인증 설정
let sheets = null;

async function getSheets() {
    if (sheets) return sheets;
    if (!credentials) throw new Error('서비스 계정 키가 없습니다.');

    try {
        const auth = new google.auth.JWT(
            credentials.client_email,
            null,
            credentials.private_key,
            ['https://www.googleapis.com/auth/spreadsheets']
        );

        await auth.authorize();
        sheets = google.sheets({ version: 'v4', auth });
        console.log('✅ Google Sheets API 연결 성공');
        return sheets;
    } catch (error) {
        console.error('❌ Google Sheets API 연결 실패:', error.message);
        throw error;
    }
}

/**
 * 고객 정보를 Google Sheets에 저장
 * @param {string} name - 고객 이름
 * @param {string} phone - 연락처
 * @param {string} job - 직업
 */
async function appendCustomerData(name, phone, job) {
    const sheetsClient = await getSheets();
    const spreadsheetId = SPREADSHEET_ID;

    // 현재 시간 (한국 시간)
    const now = new Date().toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    try {
        await sheetsClient.spreadsheets.values.append({
            spreadsheetId,
            range: '시트1!A:D',  // 2행부터 자동 추가
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[name, phone, job, now]]
            }
        });

        console.log(`📝 고객 정보 저장 완료: ${name}`);
        return true;
    } catch (error) {
        console.error('❌ 고객 정보 저장 실패:', error.message);
        throw error;
    }
}

/**
 * 고객 정보 조회 (이름으로 검색)
 * @param {string} name - 검색할 이름
 */
async function findCustomerByName(name) {
    const sheetsClient = await getSheets();
    const spreadsheetId = SPREADSHEET_ID;

    try {
        const response = await sheetsClient.spreadsheets.values.get({
            spreadsheetId,
            range: '시트1!A:D'
        });

        const rows = response.data.values || [];
        const customer = rows.find(row => row[0] === name);

        return customer ? {
            name: customer[0],
            phone: customer[1],
            job: customer[2],
            registeredAt: customer[3]
        } : null;
    } catch (error) {
        console.error('❌ 고객 조회 실패:', error.message);
        return null;
    }
}

module.exports = {
    appendCustomerData,
    findCustomerByName
};
