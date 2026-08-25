// ============================================================
// comments.js
// 댓글 서비스(COMMENTS_BASE_URL) 전용 API 함수 모음.
// ============================================================

/**
 * 특정 경기의 댓글 목록 조회
 * @param {number} matchId
 * @param {number} [afterId] - 이 id 이후 댓글만 (폴링 시 사용)
 * @returns {Promise<{comments:Array, next_after_id:number|null}>}
 */
async function fetchComments(matchId, afterId) {
  const query = new URLSearchParams({ match_id: matchId, limit: 50 });
  if (afterId) query.set("after_id", afterId);
  return apiFetch(CONFIG.COMMENTS_BASE_URL, `/comments?${query.toString()}`);
}

/**
 * 댓글 작성 (로그인 필요)
 * @param {number} matchId
 * @param {string} content
 */
async function createComment(matchId, content) {
  return apiFetch(CONFIG.COMMENTS_BASE_URL, "/comments", {
    method: "POST",
    body: { match_id: matchId, content },
    auth: true,
  });
}

/**
 * 댓글 수정 (본인 것만)
 * @param {number} commentId
 * @param {string} content
 */
async function updateComment(commentId, content) {
  return apiFetch(CONFIG.COMMENTS_BASE_URL, `/comments/${commentId}`, {
    method: "PUT",
    body: { content },
    auth: true,
  });
}

/**
 * 댓글 삭제 (본인 것만)
 * @param {number} commentId
 */
async function deleteComment(commentId) {
  return apiFetch(CONFIG.COMMENTS_BASE_URL, `/comments/${commentId}`, {
    method: "DELETE",
    auth: true,
  });
}
