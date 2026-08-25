// ============================================================
// api.js - matches 서비스 연동
// ============================================================

const USE_MOCK = false;
const BASE_URL = CONFIG.MATCHES_BASE_URL;

function normalizeStatus(raw) {
  const s = (raw || "").toUpperCase();
  if (s === "FINISHED") return "finished";
  if (s === "IN_PLAY" || s === "PAUSED") return "live";
  return "scheduled";
}

function normalizeTeam(team, score) {
  return {
    id: team.id,
    name: team.name,
    short_name: team.short_name,
    crest_url: team.crest_url,
    score: score,
  };
}

function normalizeMatch(raw) {
  const [date, timeWithSec] = (raw.match_date || "").split("T");
  const kickoff_time = timeWithSec ? timeWithSec.slice(0, 5) : "";
  return {
    id: raw.id,
    date,
    kickoff_time,
    status: normalizeStatus(raw.status),
    raw_status: (raw.status || "").toUpperCase(),
    match_date: raw.match_date,
    round: raw.stage ? `${raw.stage}${raw.matchday ? " · " + raw.matchday + "R" : ""}` : "",
    home_team: normalizeTeam(raw.home_team, raw.home_score),
    away_team: normalizeTeam(raw.away_team, raw.away_score),
    stats: raw.stats || null,
  };
}

async function fetchMatches({ date, team } = {}) {
  const query = new URLSearchParams();
  if (date) query.set("date", date);
  if (team) query.set("team", team);

  const res = await fetch(`${BASE_URL}/matches?${query.toString()}`);
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
  const data = await res.json();
  const matches = (Array.isArray(data) ? data : []).map(normalizeMatch);

  return team
    ? matches.filter(m => String(m.home_team.id) === String(team) || String(m.away_team.id) === String(team))
    : matches;
}

async function fetchMatchDetail(id) {
  const res = await fetch(`${BASE_URL}/matches/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
  const raw = await res.json();
  return normalizeMatch(raw);
}

async function fetchMeta() {
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
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { dates, teams };
}