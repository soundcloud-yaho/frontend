// ============================================================
// api.js
// 백엔드 실제 API 연동 (FastAPI)
// 문서 기준 필드명이 우리 UI 내부 형식과 달라서, normalizeMatch()가
// 응답을 받아 내부 형식으로 변환해줍니다.
// ============================================================

const USE_MOCK = false;
const BASE_URL = CONFIG.BASE_URL; // config.js에서 환경별로 자동 지정됨

let _mockCache = null;

async function _loadMock() {
  if (_mockCache) return _mockCache;
  const res = await fetch("./mock/matches.json");
  if (!res.ok) throw new Error("mock 데이터를 불러오지 못했습니다.");
  _mockCache = await res.json();
  return _mockCache;
}

// 백엔드 status 값 -> 우리 UI가 쓰는 3가지 상태로 매핑
function normalizeStatus(raw) {
  const s = (raw || "").toUpperCase();
  if (s === "FINISHED") return "finished";
  if (s === "IN_PLAY" || s === "PAUSED") return "live";
  // SCHEDULED, TIMED, POSTPONED, SUSPENDED, CANCELLED 등은 전부 예정으로 처리
  return "scheduled";
}

// 백엔드 팀 객체 -> 내부 형식 (국기 대신 팀 엠블럼 crest_url 사용)
function normalizeTeam(team, score) {
  return {
    id: team.id,
    name: team.name,
    short_name: team.short_name,
    crest_url: team.crest_url,
    score: score,
  };
}

// 백엔드 경기 객체 -> 내부 형식으로 변환
function normalizeMatch(raw) {
  const [date, timeWithSec] = (raw.match_date || "").split("T");
  const kickoff_time = timeWithSec ? timeWithSec.slice(0, 5) : "";
  return {
    id: raw.id,
    date,
    kickoff_time,
    status: normalizeStatus(raw.status),
    round: raw.stage ? `${raw.stage}${raw.matchday ? " · " + raw.matchday + "R" : ""}` : "",
    home_team: normalizeTeam(raw.home_team, raw.home_score),
    away_team: normalizeTeam(raw.away_team, raw.away_score),
    // 문서상 상세 API 응답에 스탯 필드가 없음 -> 백엔드에 스탯 제공 여부 확인 필요
    stats: raw.stats || null,
  };
}

/**
 * 경기 목록 조회
 * @param {Object} params
 * @param {string} [params.date] - "YYYY-MM-DD"
 * @param {string} [params.team] - 팀 id
 * @returns {Promise<Array>} matches (내부 정규화 형식)
 */
async function fetchMatches({ date, team } = {}) {
  if (USE_MOCK) {
    const data = await _loadMock();
    let matches = data.matches;
    if (date) matches = matches.filter(m => m.date === date);
    if (team) matches = matches.filter(
      m => m.home_team.code === team || m.away_team.code === team
    );
    await new Promise(r => setTimeout(r, 150));
    return matches;
  }

  const query = new URLSearchParams();
  if (date) query.set("date", date);
  if (team) query.set("team", team);

  const res = await fetch(`${BASE_URL}/matches?${query.toString()}`);
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
  const data = await res.json(); // 배열로 바로 옴
  const matches = (Array.isArray(data) ? data : []).map(normalizeMatch);

  // team 파라미터를 백엔드가 무시할 가능성에 대비해, 프론트에서도 한번 더 필터링
  return team
    ? matches.filter(m => String(m.home_team.id) === String(team) || String(m.away_team.id) === String(team))
    : matches;
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
  if (res.status === 404) return null; // {"detail": "Match not found"}
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
  const raw = await res.json();
  return normalizeMatch(raw);
}

/**
 * 전체 데이터에서 날짜 목록과 팀 목록을 뽑아낸다.
 * 백엔드에 별도 /dates, /teams 엔드포인트가 없어서
 * /matches/all (페이지네이션 전체 목록)로 가져온 뒤 프론트에서 추출한다.
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

  const res = await fetch(`${BASE_URL}/matches/all?page=1&limit=100`);
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
  const data = await res.json();
  const rawMatches = data.matches || [];
  const matches = rawMatches.map(normalizeMatch);

  const dates = [...new Set(matches.map(m => m.date))].sort();
  const teamMap = new Map();
  matches.forEach(m => {
    teamMap.set(m.home_team.id, m.home_team.name);
    teamMap.set(m.away_team.id, m.away_team.name);
  });
  const teams = [...teamMap.entries()]
    .map(([code, name]) => ({ code, name })) // renderTeamFilter가 기대하는 필드명(code)에 맞춤. 값은 팀 id.
    .sort((a, b) => a.name.localeCompare(b.name));
  return { dates, teams };
}