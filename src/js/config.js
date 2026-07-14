// ============================================================
// config.js - 환경별 설정
// 로컬 개발 / 배포(S3+CloudFront) 환경에 따라 API 주소를 다르게 지정합니다.
// 배포 시에는 아래 PROD_BASE_URL 값만 실제 백엔드 주소로 바꿔주세요.
// (예: ALB DNS 주소, 또는 커스텀 도메인을 붙였다면 그 도메인)
// 반드시 https:// 로 시작해야 합니다. (CloudFront가 https이므로
// http 백엔드를 부르면 브라우저가 Mixed Content로 차단합니다)
// ============================================================

const LOCAL_BASE_URL = "http://127.0.0.1:8000";
const PROD_BASE_URL = "https://REPLACE-WITH-BACKEND-DOMAIN"; // TODO: 배포 시 실제 주소로 교체

// 로컬(localhost/127.0.0.1)에서 열었으면 로컬 백엔드를, 그 외(CloudFront 등)에서 열었으면 배포 백엔드를 자동으로 사용
const CONFIG = {
  BASE_URL:
    location.hostname === "localhost" || location.hostname === "127.0.0.1"
      ? LOCAL_BASE_URL
      : PROD_BASE_URL,
};
