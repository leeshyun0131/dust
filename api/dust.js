// 에어코리아 요청을 대신 처리해 인증키를 브라우저에 노출하지 않습니다.
const API_URL = 'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty';

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'GET 요청만 사용할 수 있습니다.' });
  }

  const serviceKey = process.env.AIRKOREA_KEY;
  if (!serviceKey) {
    return res.status(500).json({ message: '서버 환경변수 AIRKOREA_KEY를 설정해주세요.' });
  }

  const sido = typeof req.query?.sido === 'string' && req.query.sido.trim()
    ? req.query.sido.trim()
    : '서울';
  const requestUrl = `${API_URL}?serviceKey=${encodeURIComponent(serviceKey)}&returnType=json&sidoName=${encodeURIComponent(sido)}&numOfRows=100&pageNo=1&ver=1.3`;

  try {
    const response = await fetch(requestUrl);
    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(502).json({ message: '인증키 또는 요청값을 확인해주세요' });
    }

    const resultCode = data?.response?.header?.resultCode;
    if (resultCode !== '00') {
      return res.status(502).json({
        message: '에어코리아 요청에 실패했습니다. 인증키 또는 요청값을 확인해주세요.',
        resultCode: resultCode || '알 수 없음'
      });
    }

    return res.status(response.ok ? 200 : 502).json(data);
  } catch {
    return res.status(502).json({ message: '에어코리아 정보를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.' });
  }
};
