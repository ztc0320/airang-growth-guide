# 아이랑 성장가이드 - 한국 공식자료 JSON 팩

생성일: 2026-06-25

## 포함 파일

- kr-official-sources.json: 사용한 한국 공식자료 출처 목록
- kr-feeding-stage-guide.json: 월령/단계별 식사·이유식 가이드
- kr-health-checkup-guide.json: 한국 영유아 건강검진 차수·월령·검진항목
- kr-food-warning.json: 꿀, 콘시럽, 단 음료, 질식 위험, 알레르기 가능 식품
- kr-sleep-safety-guide.json: 만 1세 이하 수면 안전·영아돌연사증후군 예방 안내
- kr-monthly-overlay.json: 0~60개월 전체 월령에 한국형 보강 데이터 매핑
- kr-kdst-policy.json: K-DST 문항을 복제하지 않는 데이터 처리 정책
- places.html: 전국 어린이박물관·박물관·미술관 나들이 지도
- assets/data/museums.json: GitHub Actions가 자동 갱신하는 지도 데이터
- scripts/update-museums.js: 공공데이터포털 박물관 데이터 수집기

## 주의

K-DST 원문 문항, 점수표, 판정 알고리즘은 포함하지 않았습니다. 영유아 건강검진 차수와 발달평가·상담 포함 여부만 안내합니다.

기존 monthly-guide.json을 바로 교체하지 말고 kr-monthly-overlay.json을 병합해 한국형 보강 데이터로 사용하는 방식을 권장합니다.

## 아이랑 나들이

`places.html`은 Leaflet과 OpenStreetMap을 사용하며, 시설 정보는 공공데이터포털의 전국박물관미술관정보표준데이터와 각 시설 공식 홈페이지를 출처로 표시합니다.

GitHub Pages 배포 후 자동 갱신하려면 저장소 Actions Secret에 `PUBLIC_DATA_SERVICE_KEY`를 등록합니다. 자세한 설정은 `DEPLOYMENT.md`를 확인하세요.

### Tailwind CSS

나들이 화면의 컬러 스타일은 Tailwind CSS v4로 빌드되어 있습니다.

- 입력 파일: `assets/css/tailwind-places.input.css`
- 배포 파일: `assets/css/tailwind-places.css`
- 설정 및 의존성: `package.json`

스타일 수정 후 다음 명령으로 다시 빌드합니다.

```bash
npm install
npm run build:tailwind
```

GitHub Pages에는 이미 빌드된 `tailwind-places.css`가 포함되므로 배포 시 `npm install`을 실행할 필요가 없습니다.
