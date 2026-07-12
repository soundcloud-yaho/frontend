// ============================================================
// api.js
// 지금은 mock 데이터를 읽지만, 백엔드 API 스펙이 확정되면
// USE_MOCK 을 false 로 바꾸고 BASE_URL만 채우면 됩니다.
// 실제 API: GET /matches?date=YYYY-MM-DD&team=CODE
// ============================================================

const USE_MOCK = true;
const BASE_URL = "https://api.yourdomain.com"; // 실제 배포 시 교체

let _mockCache = null;

async function _loadMock() {
  if (_mockCache) return _mockCache;
  const res = await fetch("./mock/matches.json");
  if (!res.ok) throw new Error("mock 데이터를 불러오지 못했습니다.");
  _mockCache = await res.json();
  return _mockCache;
}

/**
 * 경기 목록 조회
 * @param {Object} params
 * @param {string} [params.date] - "YYYY-MM-DD"
 * @param {string} [params.team] - 국가 코드
 * @returns {Promise<Array>} matches
 */
async function fetchMatches({ date, team } = {}) {
  if (USE_MOCK) {
    const data = await _loadMock();
    let matches = data.matches;
    if (date) matches = matches.filter(m => m.date === date);
    if (team) matches = matches.filter(
      m => m.home_team.code === team || m.away_team.code === team
    );
    // 실제 네트워크처럼 약간의 지연 흉내
    await new Promise(r => setTimeout(r, 150));
    return matches;
  }

  const query = new URLSearchParams();
  if (date) query.set("date", date);
  if (team) query.set("team", team);

  const res = await fetch(`${BASE_URL}/matches?${query.toString()}`);
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
  const data = await res.json();
  return data.matches;
}

/**
 * 경기 상세 정보(스탯 포함) 조회
 * @param {number|string} id - 경기 ID
 * @returns {Promise<Object|null>}
 */
async function fetchMatchDetail(id) {
  if (USE_MOCK) {
    const data = await _loadMock();
    await new Promise(r => setTimeout(r, 100));
    return data.matches.find(m => String(m.id) === String(id)) || null;
  }

  const res = await fetch(`${BASE_URL}/matches/${id}`);
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
  return res.json();
}

/**
 * 전체 데이터에서 날짜 목록과 팀 목록을 뽑아낸다.
 * (백엔드가 별도 /dates, /teams API를 준다면 이 함수는 그걸로 교체)
 */
async function fetchMeta() {
  if (USE_MOCK) {
    const data = await _loadMock();
    const dates = [...new Set(data.matches.map(m => m.date))].sort();
    const teamMap = new Map();
    data.matches.forEach(m => {
      teamMap.set(m.home_team.code, m.home_team.name);
      teamMap.set(m.away_team.code, m.away_team.name);
    });
    const teams = [...teamMap.entries()]
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { dates, teams };
  }

  // 실제 API 사용 시: 전체 조회 후 프론트에서 추출하거나
  // 백엔드에 /dates, /teams 엔드포인트를 요청해서 대체
  const all = await fetchMatches({});
  const dates = [...new Set(all.map(m => m.date))].sort();
  const teamMap = new Map();
  all.forEach(m => {
    teamMap.set(m.home_team.code, m.home_team.name);
    teamMap.set(m.away_team.code, m.away_team.name);
  });
  const teams = [...teamMap.entries()].map(([code, name]) => ({ code, name }));
  return { dates, teams };
}
