// ============================================================
// config.js - 환경별 설정
// ============================================================

const LOCAL_MATCHES_URL = "http://127.0.0.1:8000";
const PROD_MATCHES_URL = "https://api.rubao.store";

const LOCAL_AUTH_URL = "http://127.0.0.1:8001";
const PROD_AUTH_URL = "https://auth-api.rubao.store";

const LOCAL_COMMENTS_URL = "http://127.0.0.1:8002";
const PROD_COMMENTS_URL = "https://comment-api.rubao.store";

const LOCAL_PREDICTIONS_URL = "http://127.0.0.1:8003";
const PROD_PREDICTIONS_URL = "https://predictions-api.rubao.store";

const isLocal =
  location.hostname === "localhost" || location.hostname === "127.0.0.1";

const CONFIG = {
  MATCHES_BASE_URL: isLocal ? LOCAL_MATCHES_URL : PROD_MATCHES_URL,
  AUTH_BASE_URL: isLocal ? LOCAL_AUTH_URL : PROD_AUTH_URL,
  COMMENTS_BASE_URL: isLocal ? LOCAL_COMMENTS_URL : PROD_COMMENTS_URL,
  PREDICTIONS_BASE_URL: isLocal ? LOCAL_PREDICTIONS_URL : PROD_PREDICTIONS_URL,
};