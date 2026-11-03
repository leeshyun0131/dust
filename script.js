// 지역 선택에 맞춰 에어코리아 측정 자료를 불러오고 화면에 표시합니다.
const 지역선택 = document.querySelector('#지역선택');
const 대표상태 = document.querySelector('#대표상태');
const 대표이모지 = document.querySelector('#대표이모지');
const 대표등급 = document.querySelector('#대표등급');
const 대표안내 = document.querySelector('#대표안내');
const 평균제목 = document.querySelector('#평균-제목');
const 평균값 = document.querySelector('#평균값');
const 평균설명 = document.querySelector('#평균-설명');
const 측정소목록 = document.querySelector('#측정소목록');
const 측정소개수 = document.querySelector('#측정소-개수');
const 상태메시지 = document.querySelector('#상태메시지');
const 그래프상태 = document.querySelector('#그래프-상태');
const 그래프캔버스 = document.querySelector('#미세먼지그래프');
let 미세먼지그래프 = null;

const 등급이름 = {
  '1': '좋음',
  '2': '보통',
  '3': '나쁨',
  '4': '매우나쁨'
};

const 등급정보 = [
  { 상한: 30, 이름: '좋음', 이모지: '🔵' },
  { 상한: 80, 이름: '보통', 이모지: '🟢' },
  { 상한: 150, 이름: '나쁨', 이모지: '🟠' },
  { 상한: Infinity, 이름: '매우나쁨', 이모지: '🔴' }
];

const 그래프등급색 = {
  '1': '#60a5fa',
  '2': '#4ade80',
  '3': '#fb923c',
  '4': '#f87171'
};

function 값표시(값) {
  if (값 === undefined || 값 === null || String(값).trim() === '' || String(값).trim() === '-') {
    return '측정 안 됨';
  }
  return String(값);
}

function 대표상태표시(평균) {
  const 등급 = 등급정보.find((항목) => 평균 <= 항목.상한);
  대표상태.className = `대표상태 등급-${등급.이름}`;
  대표이모지.textContent = 등급.이모지;
  대표등급.textContent = 등급.이름;
  대표안내.textContent = 평균 > 80
    ? '외출 시 마스크를 챙기세요'
    : '외출 전 대기질 정보를 확인하세요';
}

function 측정시각표시(값) {
  const 일치 = typeof 값 === 'string'
    ? 값.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):/)
    : null;
  return 일치
    ? `${일치[1]}년 ${Number(일치[2])}월 ${Number(일치[3])}일 ${Number(일치[4])}시 기준`
    : 값표시(값);
}

function 그래프갱신(측정자료) {
  if (미세먼지그래프) {
    미세먼지그래프.destroy();
    미세먼지그래프 = null;
  }
  그래프캔버스.hidden = false;

  const 그래프자료 = 측정자료
    .filter((항목) => 항목.pm10Value !== undefined
      && 항목.pm10Value !== null
      && String(항목.pm10Value).trim() !== ''
      && String(항목.pm10Value).trim() !== '-')
    .map((항목) => ({
      이름: 항목.stationName || '이름 없는 측정소',
      수치: Number(항목.pm10Value),
      등급: String(항목.pm10Grade ?? '').trim()
    }))
    .filter((항목) => Number.isFinite(항목.수치))
    .sort((가, 나) => 나.수치 - 가.수치)
    .slice(0, 10);

  if (그래프자료.length === 0) {
    그래프캔버스.hidden = true;
    그래프상태.textContent = '그래프에 표시할 측정값이 없습니다.';
    return;
  }

  if (typeof Chart === 'undefined') {
    그래프캔버스.hidden = true;
    그래프상태.textContent = '그래프를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.';
    console.error('Chart.js를 불러오지 못해 측정소 그래프를 표시할 수 없습니다.');
    return;
  }

  미세먼지그래프 = new Chart(그래프캔버스, {
    type: 'bar',
    data: {
      labels: 그래프자료.map((항목) => 항목.이름),
      datasets: [{
        data: 그래프자료.map((항목) => 항목.수치),
        backgroundColor: 그래프자료.map((항목) => 그래프등급색[항목.등급] || '#9ca3af'),
        borderRadius: 6,
        maxBarThickness: 26
      }]
    },
    options: {
      indexAxis: 'y',
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (항목) => ` ${항목.parsed.x} ㎍/㎥`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          title: { display: true, text: '미세먼지 (㎍/㎥)' },
          ticks: { precision: 0 }
        },
        y: {
          grid: { display: false }
        }
      }
    }
  });
  그래프상태.textContent = `측정값이 있는 측정소 중 상위 ${그래프자료.length}곳`;
}

function 카드만들기(측정소) {
  const 카드 = document.createElement('article');
  const 등급 = String(측정소.pm10Grade ?? '').trim();
  const 등급분류 = 등급이름[등급] ? `등급-${등급이름[등급]}` : '등급-알수없음';
  const 이름 = document.createElement('h3');
  const 값영역 = document.createElement('div');
  const 미세먼지 = document.createElement('p');
  const 미세먼지값 = document.createElement('strong');
  const 초미세먼지 = document.createElement('p');
  const 초미세먼지값 = document.createElement('strong');
  const 측정시각 = document.createElement('p');

  카드.className = `측정소-카드 ${등급분류}`;
  이름.textContent = 측정소.stationName || '이름 없는 측정소';
  값영역.className = '카드-값';
  미세먼지.append('미세먼지');
  미세먼지값.textContent = 값표시(측정소.pm10Value);
  초미세먼지.append('초미세먼지');
  초미세먼지값.textContent = 값표시(측정소.pm25Value);
  미세먼지.append(미세먼지값);
  초미세먼지.append(초미세먼지값);
  값영역.append(미세먼지, 초미세먼지);
  측정시각.className = '측정시각';
  측정시각.textContent = 측정시각표시(측정소.dataTime);

  카드.append(이름, 값영역, 측정시각);
  return 카드;
}

async function 지역자료불러오기() {
  const 지역 = 지역선택.value;
  평균제목.textContent = `${지역} 평균 미세먼지`;
  평균값.textContent = '--';
  대표상태.className = '대표상태 등급-알수없음';
  대표이모지.textContent = '⏳';
  대표등급.textContent = '불러오는 중...';
  대표안내.textContent = '불러오는 중...';
  평균설명.textContent = '불러오는 중...';
  측정소개수.textContent = '';
  측정소목록.replaceChildren();
  그래프상태.textContent = '불러오는 중...';
  if (미세먼지그래프) {
    미세먼지그래프.destroy();
    미세먼지그래프 = null;
  }
  그래프캔버스.hidden = true;

  상태메시지.textContent = '불러오는 중...';

  try {
    const 응답 = await fetch(`/api/dust?sido=${encodeURIComponent(지역)}`);
    const 자료 = await 응답.json();
    if (!응답.ok || 자료?.message) {
      throw new Error(자료?.message || '대기오염 자료 조회에 실패했습니다.');
    }

    const 본문 = 자료?.response?.body;
    const 결과코드 = 자료?.response?.header?.resultCode;
    if (결과코드 !== '00') {
      throw new Error('에어코리아 요청에 실패했습니다. 인증키 또는 요청값을 확인해주세요.');
    }

    const 원자료 = Array.isArray(본문?.items) ? 본문.items : 본문?.items?.item;
    const 측정자료 = Array.isArray(원자료) ? 원자료 : 원자료 ? [원자료] : [];
    if (측정자료.length === 0) {
      그래프갱신(측정자료);
      평균설명.textContent = '표시할 미세먼지 측정값이 없습니다.';
      대표등급.textContent = '측정 자료 없음';
      대표이모지.textContent = '⚪';
      대표안내.textContent = '잠시 후 다시 확인해 주세요.';
      상태메시지.textContent = '선택한 지역의 측정 자료가 없습니다.';
      return;
    }

    const 미세먼지값목록 = 측정자료
      .map((항목) => 항목.pm10Value)
      .filter((값) => 값 !== undefined && 값 !== null && String(값).trim() !== '' && String(값).trim() !== '-')
      .map(Number)
      .filter(Number.isFinite);
    if (미세먼지값목록.length > 0) {
      const 평균 = 미세먼지값목록.reduce((합계, 값) => 합계 + 값, 0) / 미세먼지값목록.length;
      const 반올림평균 = Math.round(평균 * 10) / 10;
      평균값.textContent = String(반올림평균);
      대표상태표시(반올림평균);
      평균설명.textContent = `측정값 ${미세먼지값목록.length}건 기준 · 측정 안 됨 제외`;
    } else {
      평균설명.textContent = '계산할 수 있는 미세먼지 측정값이 없습니다.';
      대표등급.textContent = '측정 자료 없음';
      대표이모지.textContent = '⚪';
      대표안내.textContent = '잠시 후 다시 확인해 주세요.';
    }

    const 카드모음 = document.createDocumentFragment();
    측정자료.forEach((항목) => 카드모음.append(카드만들기(항목)));
    측정소목록.append(카드모음);
    그래프갱신(측정자료);
    측정소개수.textContent = `측정소 ${측정자료.length}곳`;
    상태메시지.textContent = '';
  } catch (오류) {
    console.error('대기오염 자료 조회 실패:', 오류);
    대표이모지.textContent = '⚪';
    대표등급.textContent = '확인할 수 없음';
    대표안내.textContent = '잠시 후 다시 시도해 주세요.';
    평균설명.textContent = '측정 자료를 불러오지 못했습니다.';
    그래프상태.textContent = '측정 자료가 없어 그래프를 표시할 수 없습니다.';
    상태메시지.textContent = 오류 instanceof Error && /[가-힣]/.test(오류.message)
      ? 오류.message
      : '자료를 불러오는 중 오류가 발생했습니다. 인터넷 연결을 확인해 주세요.';
  }
}

지역선택.addEventListener('change', 지역자료불러오기);
지역자료불러오기();
