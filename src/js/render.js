// ============================================================
// render.js - DOM 렌더링 담당
// ============================================================

const STATUS_LABEL = {
  scheduled: "예정",
  live: "LIVE",
  finished: "종료",
};

function flagUrl(code) {
  // ISO 3166-1 alpha-2 코드 기준. flagcdn.com 무료 CDN 사용.
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const dow = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  const dom = d.getDate();
  return { dow, dom };
}

function renderDateTabs(container, dates, selectedDate, countByDate, onSelect) {
  container.innerHTML = "";
  dates.forEach(date => {
    const { dow, dom } = formatDateLabel(date);
    const tab = document.createElement("button");
    tab.className = "date-tab" + (date === selectedDate ? " active" : "");
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", date === selectedDate);
    tab.innerHTML = `
      <div class="dow">${dow}</div>
      <div class="dom">${dom}</div>
      <div class="count">${countByDate[date] || 0}경기</div>
    `;
    tab.addEventListener("click", () => onSelect(date));
    container.appendChild(tab);
  });
}

function renderTeamFilter(select, teams, selectedTeam) {
  select.innerHTML = `<option value="">전체 팀</option>`;
  teams.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.code;
    opt.textContent = t.name;
    if (t.code === selectedTeam) opt.selected = true;
    select.appendChild(opt);
  });
}

function matchCardHTML(m) {
  const home = m.home_team;
  const away = m.away_team;
  const isLive = m.status === "live";
  const isScheduled = m.status === "scheduled";
  const clickable = m.status !== "scheduled";

  const scoreHTML = isScheduled
    ? `<span class="time">${m.kickoff_time}</span>`
    : `${home.score} <span class="dash">-</span> ${away.score}`;

  return `
    <div class="match-card${clickable ? " clickable" : ""}" data-id="${m.id}">
      <div class="teams">
        <div class="team home">
          <img src="${flagUrl(home.code.split('-')[0])}" alt="${home.name} 국기" loading="lazy"
               onerror="this.style.visibility='hidden'">
          <span class="team-name">${home.name}</span>
        </div>
        <div class="score-box">${scoreHTML}</div>
        <div class="team away">
          <img src="${flagUrl(away.code.split('-')[0])}" alt="${away.name} 국기" loading="lazy"
               onerror="this.style.visibility='hidden'">
          <span class="team-name">${away.name}</span>
        </div>
      </div>
      <div class="meta-col">
        <span class="status-badge ${m.status}">${STATUS_LABEL[m.status]}</span>
        ${clickable ? '<span class="detail-hint">스탯 보기 ›</span>' : ''}
      </div>
    </div>
  `;
}

function renderMatches(container, matches) {
  if (!matches.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">⚽</div>
        <div class="title">해당 조건의 경기가 없습니다</div>
        <div>다른 날짜나 팀을 선택해보세요</div>
      </div>
    `;
    return;
  }

  // 라운드별로 그룹핑
  const byRound = new Map();
  matches.forEach(m => {
    if (!byRound.has(m.round)) byRound.set(m.round, []);
    byRound.get(m.round).push(m);
  });

  let html = "";
  byRound.forEach((list, round) => {
    html += `<div class="round-label">${round}</div>`;
    list.forEach(m => { html += matchCardHTML(m); });
  });
  container.innerHTML = html;
}

function renderClock(el) {
  const now = new Date();
  el.textContent = now.toLocaleTimeString("ko-KR", { hour12: false });
}

// ------------------------------------------------------------
// 경기 상세 스탯 모달
// ------------------------------------------------------------

const STAT_LABELS = {
  possession: "점유율",
  shots: "슈팅",
  shots_on_target: "유효슈팅",
  corners: "코너킥",
  fouls: "파울",
};

function statRowHTML(label, homeVal, awayVal, isPercent) {
  const total = homeVal + awayVal;
  const homePct = total === 0 ? 50 : (homeVal / total) * 100;
  const awayPct = 100 - homePct;
  const suffix = isPercent ? "%" : "";
  return `
    <div class="stat-row">
      <div class="stat-values">
        <span>${homeVal}${suffix}</span>
        <span class="stat-label">${label}</span>
        <span>${awayVal}${suffix}</span>
      </div>
      <div class="stat-bar">
        <div class="stat-bar-home" style="width:${homePct}%"></div>
        <div class="stat-bar-away" style="width:${awayPct}%"></div>
      </div>
    </div>
  `;
}

function matchDetailHTML(m) {
  const home = m.home_team;
  const away = m.away_team;
  const scoreHTML = m.status === "scheduled"
    ? m.kickoff_time
    : `${home.score} - ${away.score}`;

  let statsHTML;
  if (!m.stats) {
    statsHTML = `<div class="no-stats">경기 시작 전에는 스탯을 제공하지 않습니다</div>`;
  } else {
    const s = m.stats;
    statsHTML = `
      ${statRowHTML(STAT_LABELS.possession, s.possession[0], s.possession[1], true)}
      ${statRowHTML(STAT_LABELS.shots, s.shots[0], s.shots[1], false)}
      ${statRowHTML(STAT_LABELS.shots_on_target, s.shots_on_target[0], s.shots_on_target[1], false)}
      ${statRowHTML(STAT_LABELS.corners, s.corners[0], s.corners[1], false)}
      ${statRowHTML(STAT_LABELS.fouls, s.fouls[0], s.fouls[1], false)}
    `;
  }

  return `
    <div class="modal-header">
      <div class="modal-team">
        <img src="${flagUrl(home.code.split('-')[0])}" alt="${home.name}">
        <span>${home.name}</span>
      </div>
      <div class="modal-score">
        <span class="status-badge ${m.status}">${STATUS_LABEL[m.status]}</span>
        <div class="modal-score-num">${scoreHTML}</div>
      </div>
      <div class="modal-team away">
        <img src="${flagUrl(away.code.split('-')[0])}" alt="${away.name}">
        <span>${away.name}</span>
      </div>
    </div>
    <div class="modal-body">
      ${statsHTML}
    </div>
  `;
}

function openMatchModal(overlayEl, panelEl, match) {
  panelEl.innerHTML = matchDetailHTML(match);
  overlayEl.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeMatchModal(overlayEl) {
  overlayEl.classList.remove("open");
  document.body.style.overflow = "";
}

function initThemeToggle(button) {
  function applyLabel() {
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    button.textContent = isLight ? "☀️ 라이트" : "🌙 다크";
  }
  applyLabel();

  button.addEventListener("click", () => {
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    if (isLight) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("wc-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("wc-theme", "light");
    }
    applyLabel();
  });
}
