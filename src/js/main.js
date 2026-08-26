// ============================================================
// main.js - 앱 초기화 및 상태 관리
// ============================================================

const POLL_INTERVAL_MS = 30000;

const state = {
  dates: [],
  teams: [],
  selectedDate: null,
  selectedTeam: "",
  countByDate: {},
  currentMatches: [],   // fetchMatches로 받은 원본 목록 (즐겨찾기 필터 적용 전)
  favoritesOnly: false, // "즐겨찾기만 보기" 토글 상태
};

const el = {
  dateTabs: document.getElementById("dateTabs"),
  teamFilter: document.getElementById("teamFilter"),
  clearFilter: document.getElementById("clearFilter"),
  favFilterToggle: document.getElementById("favFilterToggle"),
  matchList: document.getElementById("matchList"),
  clock: document.getElementById("clock"),
  themeToggle: document.getElementById("themeToggle"),
  authArea: document.getElementById("authArea"),
  modalOverlay: document.getElementById("modalOverlay"),
  modalPanel: document.getElementById("modalPanel"),
  modalClose: document.getElementById("modalClose"),
};

/**
 * 화면에 실제로 그릴 목록을 계산.
 * favoritesOnly가 켜져 있으면 즐겨찾기한 팀이 home/away 중 하나라도 걸린 경기만 남김.
 */
function getVisibleMatches() {
  if (!state.favoritesOnly) return state.currentMatches;
  return state.currentMatches.filter(
    (m) =>
      favoritesState.teamIds.has(m.home_team.id) ||
      favoritesState.teamIds.has(m.away_team.id)
  );
}

function renderVisibleMatches() {
  renderMatches(el.matchList, getVisibleMatches());
}

// 로그인/로그아웃으로 즐겨찾기 상태가 바뀌었을 때 화면 갱신
function onAuthChanged() {
  renderVisibleMatches();
}

function renderFavFilterButton() {
  el.favFilterToggle.classList.toggle("active", state.favoritesOnly);
}

async function loadMeta() {
  const meta = await fetchMeta();
  state.dates = meta.dates;
  state.teams = meta.teams;
  state.selectedDate = meta.dates[0];

  const all = await fetchMatches({});
  state.countByDate = {};
  all.forEach(m => {
    state.countByDate[m.date] = (state.countByDate[m.date] || 0) + 1;
  });
}

async function refreshMatches() {
  try {
    const matches = await fetchMatches({
      date: state.selectedDate,
      team: state.selectedTeam || undefined,
    });
    state.currentMatches = matches;
    renderVisibleMatches();
  } catch (err) {
    el.matchList.innerHTML = `
      <div class="empty-state">
        <div class="icon">⚠️</div>
        <div class="title">경기 정보를 불러오지 못했습니다</div>
        <div>${err.message}</div>
      </div>
    `;
  }
}

function renderTabsAndFilter() {
  renderDateTabs(el.dateTabs, state.dates, state.selectedDate, state.countByDate, (date) => {
    state.selectedDate = date;
    renderTabsAndFilter();
    refreshMatches();
  });
  renderTeamFilter(el.teamFilter, state.teams, state.selectedTeam);
  renderFavFilterButton();
}

function bindEvents() {
  el.teamFilter.addEventListener("change", (e) => {
    state.selectedTeam = e.target.value;
    refreshMatches();
  });

  el.clearFilter.addEventListener("click", () => {
    state.selectedTeam = "";
    el.teamFilter.value = "";
    refreshMatches();
  });

  el.favFilterToggle.addEventListener("click", () => {
    // 로그인 안 했으면 즐겨찾기 자체가 없으니 로그인 유도
    if (!authState.user) {
      openAuthModal(el.authArea);
      return;
    }
    state.favoritesOnly = !state.favoritesOnly;
    renderFavFilterButton();
    renderVisibleMatches();
  });

  el.matchList.addEventListener("click", async (e) => {
    const card = e.target.closest(".match-card.clickable");
    if (!card) return;
    const id = card.getAttribute("data-id");
    try {
      const match = await fetchMatchDetail(id);
      if (match) openMatchModal(el.modalOverlay, el.modalPanel, match);
    } catch (err) {
      console.error("경기 상세 조회 실패:", err);
    }
  });

  // 별 클릭 시 목록에도 즐겨찾기 필터가 걸려있을 수 있으니 renderVisibleMatches로 다시 그림
  bindFavoriteStarClicks(el.matchList, renderVisibleMatches);
  bindPredictionClicks(el.modalPanel);
  bindCommentEvents(el.modalPanel);

  el.modalClose.addEventListener("click", () => closeMatchModal(el.modalOverlay));
  el.modalOverlay.addEventListener("click", (e) => {
    if (e.target === el.modalOverlay) closeMatchModal(el.modalOverlay);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMatchModal(el.modalOverlay);
  });
}

async function init() {
  initThemeToggle(el.themeToggle);
  renderClock(el.clock);
  setInterval(() => renderClock(el.clock), 1000);

  await initAuthState();
  renderAuthArea(el.authArea);
  await initFavoritesState();
  await initPredictionsState();

  await loadMeta();
  renderTabsAndFilter();
  bindEvents();
  await refreshMatches();

  setInterval(refreshMatches, POLL_INTERVAL_MS);
}

init();