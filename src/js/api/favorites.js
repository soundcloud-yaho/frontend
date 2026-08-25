// ============================================================
// favorites.js
// ============================================================

async function fetchFavoriteTeamIds() {
  const data = await apiFetch(CONFIG.AUTH_BASE_URL, "/favorites", { auth: true });
  return data.team_ids;
}

async function addFavoriteTeam(teamId) {
  return apiFetch(CONFIG.AUTH_BASE_URL, "/favorites", {
    method: "POST",
    body: { team_id: teamId },
    auth: true,
  });
}

async function removeFavoriteTeam(teamId) {
  return apiFetch(CONFIG.AUTH_BASE_URL, `/favorites/${teamId}`, {
    method: "DELETE",
    auth: true,
  });
}
