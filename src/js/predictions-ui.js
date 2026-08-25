// ============================================================
// predictions-ui.js
// 승부예측 상태 관리 + 경기 상세 모달에 예측 버튼/집계 렌더링
// ============================================================

const predictionsState = {
  byMatchId: new Map(),
};

const PREDICTABLE_STATUSES = new Set(["SCHEDULED", "TIMED"]);

function isPredictable(match) {
  if (!PREDICTABLE_STATUSES.has(match.raw_status)) return false;
  if (!match.match_date) return false;
  return new Date(match.match_date).getTime() > Date.now();
}

async function initPredictionsState() {
  if (!authState.user) {
    predictionsState.byMatchId = new Map();
    return;
  }
  try {
    const list = await fetchMyPredictions();
    predictionsState.byMatchId = new Map(
      list.map((p) => [p.match_id, { id: p.id, predicted_result: p.predicted_result }])
    );
  } catch {
    predictionsState.byMatchId = new Map();
  }
}

const RESULT_LABEL = { HOME: "홈 승", DRAW: "무승부", AWAY: "원정 승" };

function predictionSectionHTML(match) {
  if (!isPredictable(match)) {
    return `
      <div class="prediction-box">
        <div class="prediction-title">승부예측</div>
        <div class="no-stats">예측이 마감된 경기입니다</div>
      </div>
    `;
  }

  const mine = predictionsState.byMatchId.get(match.id);

  const buttons = ["HOME", "DRAW", "AWAY"]
    .map((result) => {
      const active = mine?.predicted_result === result;
      return `<button class="pred-btn${active ? " active" : ""}" data-match-id="${match.id}" data-result="${result}">${RESULT_LABEL[result]}</button>`;
    })
    .join("");

  return `
    <div class="prediction-box">
      <div class="prediction-title">승부예측${mine ? " (등록됨, 다시 눌러 수정)" : ""}</div>
      <div class="prediction-buttons">${buttons}</div>
      <div class="prediction-summary" id="predSummary-${match.id}">집계 불러오는 중...</div>
    </div>
  `;
}

async function loadPredictionSummary(matchId) {
  const el = document.getElementById(`predSummary-${matchId}`);
  if (!el) return;
  try {
    const summary = await fetchMatchPredictionSummary(matchId);
    const { home, draw, away } = summary.counts;
    el.textContent = `참여 ${summary.total}명 · 홈 ${home} · 무 ${draw} · 원정 ${away}`;
  } catch {
    el.textContent = "집계를 불러오지 못했습니다";
  }
}

function bindPredictionClicks(modalPanelEl) {
  modalPanelEl.addEventListener("click", async (e) => {
    const btn = e.target.closest(".pred-btn");
    if (!btn) return;

    if (!authState.user) {
      openAuthModal(document.getElementById("authArea"));
      return;
    }

    const matchId = Number(btn.getAttribute("data-match-id"));
    const result = btn.getAttribute("data-result");
    const mine = predictionsState.byMatchId.get(matchId);

    try {
      if (mine) {
        await updatePrediction(mine.id, result);
        predictionsState.byMatchId.set(matchId, { id: mine.id, predicted_result: result });
      } else {
        const created = await createPrediction(matchId, result);
        predictionsState.byMatchId.set(matchId, { id: created.id, predicted_result: result });
      }

      modalPanelEl.querySelectorAll(`.pred-btn[data-match-id="${matchId}"]`).forEach((b) => {
        b.classList.toggle("active", b.getAttribute("data-result") === result);
      });
      loadPredictionSummary(matchId);
    } catch (err) {
      alert(err.message);
    }
  });
}
