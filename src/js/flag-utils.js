// ============================================================
// flag-utils.js
// 백엔드가 주는 short_name은 3자리 FIFA 코드가 아니라
// "Mexico", "South Africa", "Korea Republic" 같은 국가 전체 이름입니다.
// (PR 코멘트의 "KOR, BRA 3자리" 가정과 실제 데이터가 다름 - 확인 후 이 방식으로 재작성)
//
// 이 파일은 그 국가 이름을 flagcdn.com이 요구하는 코드로 변환합니다.
//
// 사용법:
//   const url = flagUrl(team.short_name, 40); // 40px 너비 국기 이미지 URL
// ============================================================

// 백엔드 short_name(국가 전체 이름, 소문자 비교) -> flagcdn 코드
// 실제로 API에서 관측된 이름들을 기준으로 작성했습니다.
// 새로운 국가가 나타나 콘솔에 경고가 뜨면, 여기 추가해주세요.
const COUNTRY_NAME_TO_FLAGCDN = {
  "mexico": "mx",
  "south africa": "za",
  "korea republic": "kr",
  "czechia": "cz",
  "canada": "ca",
  "bosnia-h.": "ba",
  "usa": "us",
  "paraguay": "py",
  "qatar": "qa",
  "switzerland": "ch",
  "brazil": "br",
  "morocco": "ma",
  "haiti": "ht",
  "scotland": "gb-sct",
  "australia": "au",
  "turkey": "tr",
  "germany": "de",
  "curaçao": "cw",
  "curacao": "cw",
  "netherlands": "nl",
  "japan": "jp",
  "ivory coast": "ci",
  "ecuador": "ec",
  "sweden": "se",
  "tunisia": "tn",
  "spain": "es",
  "cape verde": "cv",
  "belgium": "be",
  "egypt": "eg",
  "saudi arabia": "sa",
  "uruguay": "uy",
  "iran": "ir",
  "new zealand": "nz",
  "france": "fr",
  "senegal": "sn",
  "iraq": "iq",
  "norway": "no",
  "argentina": "ar",
  "algeria": "dz",
  "austria": "at",
  "jordan": "jo",
  "portugal": "pt",
  "congo dr": "cd",
  "england": "gb-eng",
  "croatia": "hr",
  "ghana": "gh",
  "panama": "pa",
  "uzbekistan": "uz",
  "colombia": "co",

  "wales": "gb-wls",
  "north ireland": "gb-nir",
  "northern ireland": "gb-nir",
  "poland": "pl",
  "italy": "it",
  "south korea": "kr",
  "nigeria": "ng",
  "kuwait": "kw",
  "denmark": "dk",
  "chile": "cl",
  "peru": "pe",
  "greece": "gr",
  "serbia": "rs",
  "ukraine": "ua",
  "united states": "us"
};

/**
 * 국가 이름(백엔드 short_name)을 flagcdn용 코드로 변환합니다.
 * 매핑표에 없으면 null을 반환하고 콘솔에 경고를 남깁니다.
 * @param {string} countryName - 예: "Mexico", "Korea Republic"
 * @returns {string|null} flagcdn 코드
 */
function toFlagCdnCode(countryName) {
  if (!countryName) return null;
  const key = countryName.trim().toLowerCase();
  if (COUNTRY_NAME_TO_FLAGCDN[key]) return COUNTRY_NAME_TO_FLAGCDN[key];

  console.warn(
    `[flag-utils] "${countryName}"는 매핑표에 없습니다. COUNTRY_NAME_TO_FLAGCDN에 추가해주세요. (국기 표시 안 됨)`
  );
  return null;
}

/**
 * flagcdn 국기 이미지 URL을 만듭니다.
 * @param {string} countryName - 백엔드 short_name (예: "Mexico")
 * @param {number} width - 이미지 너비 (기본 40px)
 * @returns {string|null}
 */
function flagUrl(countryName, width = 40) {
  const code = toFlagCdnCode(countryName);
  if (!code) return null;
  return `https://flagcdn.com/w${width}/${code}.png`;
}