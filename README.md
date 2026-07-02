# worldcup-frontend

Sound_Cloud 프로젝트의 프론트엔드 레포. HTML + JavaScript CSR 방식의 정적 웹. 담당: 강윤주.

이 레포는 **K8s / ArgoCD와 완전히 무관**하다. push하면 CI가 S3에 직접 업로드하고 CloudFront 캐시를 무효화한다 — 클러스터를 거치지 않는 가장 짧은 배포 경로.

---

## 아키텍처 상 위치

```
사용자 → Route 53(정적 도메인) → CloudFront(엣지 캐시) → S3(OAC 전용, 퍼블릭 차단)
                                        │
                                        └─ 캐시 미스 시에만 S3 원본 조회

브라우저 로드 후 CSR 단계:
JS → 자체 API 도메인(api.xxx) → ALB → FastAPI → Aurora Reader
```

- S3 버킷은 퍼블릭 액세스가 차단되어 있고 **CloudFront OAC로만** 접근 가능하다. S3 URL을 직접 열면 403이 나는 게 정상이다.
- 프론트는 **football-data.org를 절대 직접 호출하지 않는다.** API 키 노출 방지 및 무료 티어 호출 한도(분당 10회) 보호를 위해 반드시 자체 API(`worldcup-backend`)만 경유한다.

---

## 모듈 구성

| 경로 | 역할 |
|---|---|
| `src/index.html` | 메인 페이지 — 날짜 탭 / 팀 필터 / 경기 카드 영역 |
| `src/js/app.js` | DOM 렌더링 로직 — 경기 카드, 국기 이미지, 스코어 표시 |
| `src/js/api.js` | 자체 API 전용 fetch 래퍼. **외부 API를 직접 호출하는 코드는 이 파일 밖에 절대 두지 않는다** |
| `src/css/style.css` | 반응형 스타일 — 경기 시간대 모바일 접속 다수를 가정한 레이아웃 |
| `src/assets/flags/` | 국기 이미지 리소스 |

---

## 배포 흐름

1. `master` 브랜치에 push
2. CI(`.github/workflows/deploy-s3.yaml`)가 `aws s3 sync`로 정적 파일 업로드
3. `aws cloudfront create-invalidation`으로 캐시 무효화
4. 즉시 반영 완료 — 클러스터 배포 단계 없음

---

## API 연동 규약

`worldcup-backend`와 합의된 JSON 응답 스키마를 따른다. 응답 필드가 바뀌면 `worldcup-backend`의 `app/models/schemas.py`와 반드시 함께 변경해야 한다 (임의 변경 시 렌더링 깨짐).

---

## 로컬 실행

정적 파일이라 별도 빌드 없이 브라우저로 `src/index.html`을 열거나, 로컬 서버로 서빙:

```bash
cd src && python3 -m http.server 8080
```

API는 CORS 설정에 따라 로컬 배포 API 엔드포인트로 프록시하거나 `api.js`의 base URL을 임시로 변경해 테스트한다.
