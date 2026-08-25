// ============================================================
// config.js - 환경별 설정
// ============================================================

const LOCAL_MATCHES_URL = "http://127.0.0.1:8000";
const LOCAL_AUTH_URL = "http://127.0.0.1:8001";
const LOCAL_COMMENTS_URL = "http://127.0.0.1:8002";
const LOCAL_PREDICTIONS_URL = "http://127.0.0.1:8003";

const PROD_API_URL = "https://api.rubao.store";

const isLocal =
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1";

const CONFIG = {
  MATCHES_BASE_URL: isLocal
    ? LOCAL_MATCHES_URL
    : PROD_API_URL,

  AUTH_BASE_URL: isLocal
    ? LOCAL_AUTH_URL
    : PROD_API_URL,

  COMMENTS_BASE_URL: isLocal
    ? LOCAL_COMMENTS_URL
    : PROD_API_URL,

  PREDICTIONS_BASE_URL: isLocal
    ? LOCAL_PREDICTIONS_URL
    : PROD_API_URL,
};