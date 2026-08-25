// ============================================================
// auth-ui.js
// ============================================================

const authState = {
  user: null,
};

async function initAuthState() {
  const token = getToken();
  if (!token) return;

  try {
    authState.user = await fetchMe();
  } catch {
    clearToken();
    authState.user = null;
  }
}

function renderAuthArea(container) {
  if (authState.user) {
    container.innerHTML = `
      <span class="auth-nickname">${authState.user.username}님</span>
      <button class="theme-toggle" id="logoutBtn">로그아웃</button>
    `;
    container.querySelector("#logoutBtn").addEventListener("click", () => {
      logoutUser();
      authState.user = null;
      favoritesState.teamIds = new Set();
      predictionsState.byMatchId = new Map();
      renderAuthArea(container);
      if (typeof onAuthChanged === "function") onAuthChanged();
    });
  } else {
    container.innerHTML = `<button class="theme-toggle" id="loginBtn">로그인</button>`;
    container.querySelector("#loginBtn").addEventListener("click", () => openAuthModal(container));
  }
}

function openAuthModal(authAreaContainer) {
  const overlay = document.getElementById("modalOverlay");
  const panel = document.getElementById("modalPanel");

  panel.innerHTML = `
    <div class="modal-header" style="justify-content:center; border-bottom:none;">
      <h3 id="authModalTitle">로그인</h3>
    </div>
    <form id="authForm" style="display:flex; flex-direction:column; gap:10px;">
      <input type="text" id="authUsername" placeholder="아이디" required minlength="4" maxlength="20" />
      <input type="password" id="authPassword" placeholder="비밀번호" required minlength="8" />
      <button type="submit" class="theme-toggle">확인</button>
      <button type="button" id="authSwitchMode" class="clear-filter" style="text-align:center;">
        계정이 없으신가요? 회원가입
      </button>
      <div id="authError" style="color:var(--live); font-size:13px; display:none;"></div>
    </form>
  `;
  overlay.classList.add("open");

  let mode = "login";
  const title = panel.querySelector("#authModalTitle");
  const switchBtn = panel.querySelector("#authSwitchMode");
  const errorBox = panel.querySelector("#authError");

  switchBtn.addEventListener("click", () => {
    mode = mode === "login" ? "register" : "login";
    title.textContent = mode === "login" ? "로그인" : "회원가입";
    switchBtn.textContent =
      mode === "login" ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인";
    errorBox.style.display = "none";
  });

  panel.querySelector("#authForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.style.display = "none";

    const username = panel.querySelector("#authUsername").value;
    const password = panel.querySelector("#authPassword").value;

    try {
      if (mode === "register") {
        await registerUser({ username, password });
      }
      const result = await loginUser({ username, password });
      setToken(result.access_token);
      authState.user = result.user;

      await initFavoritesState();
      await initPredictionsState();

      overlay.classList.remove("open");
      renderAuthArea(authAreaContainer);
      if (typeof onAuthChanged === "function") onAuthChanged();
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.style.display = "block";
    }
  });
}
