// ============================================================
// predictions.js
// 승부예측 서비스(PREDICTIONS_BASE_URL) 전용 API 함수 모음.
// ============================================================

async function createPrediction(matchId, predictedResult) {
  return apiFetch(CONFIG.PREDICTIONS_BASE_URL, "/predictions", {
    method: "POST",
    body: { match_id: matchId, predicted_result: predictedResult },
    auth: true,
  });
}

async function updatePrediction(predictionId, predictedResult) {
  return apiFetch(CONFIG.PREDICTIONS_BASE_URL, `/predictions/${predictionId}`, {
    method: "PUT",
    body: { predicted_result: predictedResult },
    auth: true,
  });
}

async function fetchMyPredictions() {
  return apiFetch(CONFIG.PREDICTIONS_BASE_URL, "/predictions/me", { auth: true });
}

async function fetchMatchPredictionSummary(matchId) {
  return apiFetch(CONFIG.PREDICTIONS_BASE_URL, `/predictions/matches/${matchId}`);
}
