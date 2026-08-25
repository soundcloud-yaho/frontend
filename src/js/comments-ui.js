// ============================================================
// comments-ui.js
// 경기 상세 모달 안의 댓글 영역. 폴링으로 새 댓글을 주기적으로 확인.
// ============================================================

const COMMENT_POLL_INTERVAL_MS = 8000;

const commentsState = {
  matchId: null,
  list: [], // { id, user_id, username, content, created_at, updated_at }
  lastId: null,
  pollTimer: null,
};

function commentItemHTML(c) {
  const isMine = authState.user && authState.user.id === c.user_id;
  return `
    <div class="comment-item" data-comment-id="${c.id}">
      <div class="comment-meta">
        <span class="comment-author">${c.username}</span>
        ${isMine ? `
          <span class="comment-actions">
            <button class="comment-edit-btn" data-comment-id="${c.id}">수정</button>
            <button class="comment-delete-btn" data-comment-id="${c.id}">삭제</button>
          </span>
        ` : ""}
      </div>
      <div class="comment-content" data-comment-id="${c.id}">${escapeHtml(c.content)}</div>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function commentSectionHTML() {
  return `
    <div class="comment-box">
      <div class="prediction-title">댓글</div>
      <form id="commentForm" class="comment-form">
        <input type="text" id="commentInput" placeholder="댓글을 입력하세요" maxlength="300" />
        <button type="submit" class="theme-toggle">등록</button>
      </form>
      <div id="commentList" class="comment-list">
        <div class="no-stats">불러오는 중...</div>
      </div>
    </div>
  `;
}

function renderCommentList() {
  const el = document.getElementById("commentList");
  if (!el) return;
  if (!commentsState.list.length) {
    el.innerHTML = `<div class="no-stats">아직 댓글이 없습니다</div>`;
    return;
  }
  el.innerHTML = commentsState.list.map(commentItemHTML).join("");
}

/**
 * 경기 상세 모달을 열 때 호출. 댓글 목록을 처음부터 불러오고 폴링을 시작함.
 * @param {number} matchId
 */
async function startComments(matchId) {
  stopComments(); // 이전 모달의 폴링이 남아있지 않도록 정리

  commentsState.matchId = matchId;
  commentsState.list = [];
  commentsState.lastId = null;

  await loadNewComments();

  commentsState.pollTimer = setInterval(loadNewComments, COMMENT_POLL_INTERVAL_MS);
}

/**
 * 모달을 닫을 때 호출. 폴링 타이머를 반드시 정리해야 함
 * (안 그러면 모달 닫혀도 계속 백그라운드에서 요청이 나감).
 */
function stopComments() {
  if (commentsState.pollTimer) {
    clearInterval(commentsState.pollTimer);
    commentsState.pollTimer = null;
  }
}

async function loadNewComments() {
  if (!commentsState.matchId) return;
  try {
    const data = await fetchComments(commentsState.matchId, commentsState.lastId);
    if (data.comments.length) {
      commentsState.list = [...commentsState.list, ...data.comments];
      commentsState.lastId = data.next_after_id;
      renderCommentList();
    } else if (commentsState.lastId === null) {
      // 최초 로드인데 댓글이 하나도 없는 경우에도 "댓글 없음" 표시는 되어야 함
      renderCommentList();
    }
  } catch (err) {
    console.error("댓글 조회 실패:", err.message);
  }
}

/**
 * 댓글 폼 제출, 수정/삭제 버튼 클릭을 모달 패널에 이벤트 위임으로 바인딩.
 * main.js에서 한 번만 호출.
 * @param {HTMLElement} modalPanelEl
 */
function bindCommentEvents(modalPanelEl) {
  modalPanelEl.addEventListener("submit", async (e) => {
    const form = e.target.closest("#commentForm");
    if (!form) return;
    e.preventDefault();

    if (!authState.user) {
      openAuthModal(document.getElementById("authArea"));
      return;
    }

    const input = form.querySelector("#commentInput");
    const content = input.value.trim();
    if (!content) return;

    try {
      await createComment(commentsState.matchId, content);
      input.value = "";
      await loadNewComments(); // 방금 쓴 댓글까지 포함해서 갱신
    } catch (err) {
      alert(err.message);
    }
  });

  modalPanelEl.addEventListener("click", async (e) => {
    const deleteBtn = e.target.closest(".comment-delete-btn");
    const editBtn = e.target.closest(".comment-edit-btn");

    if (deleteBtn) {
      const commentId = Number(deleteBtn.getAttribute("data-comment-id"));
      if (!confirm("댓글을 삭제하시겠어요?")) return;
      try {
        await deleteComment(commentId);
        commentsState.list = commentsState.list.filter((c) => c.id !== commentId);
        renderCommentList();
      } catch (err) {
        alert(err.message);
      }
      return;
    }

    if (editBtn) {
      const commentId = Number(editBtn.getAttribute("data-comment-id"));
      const contentEl = modalPanelEl.querySelector(`.comment-content[data-comment-id="${commentId}"]`);
      const current = commentsState.list.find((c) => c.id === commentId);
      const next = prompt("댓글 수정", current ? current.content : "");
      if (next === null || !next.trim()) return;

      try {
        const updated = await updateComment(commentId, next.trim());
        commentsState.list = commentsState.list.map((c) =>
          c.id === commentId ? { ...c, content: updated.content } : c
        );
        renderCommentList();
      } catch (err) {
        alert(err.message);
      }
    }
  });
}
