// ============================================================
// main.js - 앱 초기화 및 상태 관리
// ============================================================

const POLL_INTERVAL_MS = 30000; // 30초마다 현재 조건으로 재조회

const state = {
  dates: [],
  teams: [],
  selectedDate: null,
  selectedTeam: "",
  countByDate: {},
};

const el = {
  dateTabs: document.getElementById("dateTabs"),
  teamFilter: document.getElementById("teamFilter"),
  clearFilter: document.getElementById("clearFilter"),
  matchList: document.getElementById("matchList"),
  clock: document.getElementById("clock"),
  themeToggle: document.getElementById("themeToggle"),
  modalOverlay: document.getElementById("modalOverlay"),
  modalPanel: document.getElementById("modalPanel"),
  modalClose: document.getElementById("modalClose"),
};

async function loadMeta() {
  const meta = await fetchMeta();
  state.dates = meta.dates;
  state.teams = meta.teams;
  state.selectedDate = meta.dates[0];

  // 날짜별 경기 수 계산 (탭에 표시)
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
    renderMatches(el.matchList, matches);
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

  await loadMeta();
  renderTabsAndFilter();
  bindEvents();
  await refreshMatches();

  // 실시간(폴링) 갱신 - 현재 선택된 date/team 기준으로 주기적 재조회
  setInterval(refreshMatches, POLL_INTERVAL_MS);
}

init();
