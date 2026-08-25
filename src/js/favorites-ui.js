// ============================================================
// favorites-ui.js
// ============================================================

const favoritesState = {
  teamIds: new Set(),
};

async function initFavoritesState() {
  if (!authState.user) {
    favoritesState.teamIds = new Set();
    return;
  }
  try {
    const ids = await fetchFavoriteTeamIds();
    favoritesState.teamIds = new Set(ids);
  } catch {
    favoritesState.teamIds = new Set();
  }
}

async function toggleFavoriteTeam(teamId, onChange) {
  if (!authState.user) {
    openAuthModal(document.getElementById("authArea"));
    return;
  }

  const isFav = favoritesState.teamIds.has(teamId);
  try {
    if (isFav) {
      await removeFavoriteTeam(teamId);
      favoritesState.teamIds.delete(teamId);
    } else {
      await addFavoriteTeam(teamId);
      favoritesState.teamIds.add(teamId);
    }
    onChange();
  } catch (err) {
    console.error("즐겨찾기 처리 실패:", err.message);
  }
}

function favoriteStarHTML(teamId) {
  const isFav = favoritesState.teamIds.has(teamId);
  return `<span class="fav-star${isFav ? " active" : ""}" data-team-id="${teamId}">${
    isFav ? "★" : "☆"
  }</span>`;
}

function bindFavoriteStarClicks(matchListEl, refreshCallback) {
  matchListEl.addEventListener("click", (e) => {
    const star = e.target.closest(".fav-star");
    if (!star) return;
    e.stopPropagation();
    const teamId = Number(star.getAttribute("data-team-id"));
    toggleFavoriteTeam(teamId, refreshCallback);
  });
}
