# 월령별 준비물 페이지 패치

## 포함 파일

- `index.html`: 체크 탭을 제거하고 하단 탭의 5번째 메뉴를 준비물 페이지 링크로 변경했습니다. 기존 체크포인트 영역은 성장 탭 내부로 이동했습니다.
- `products.html`: 월령별 준비물 전용 페이지를 새로 추가했습니다. 이 페이지에만 AdSense 수동 광고 코드를 삽입할 수 있도록 광고 영역을 분리했습니다.
- `manifest.json`: PWA shortcuts를 성장 체크포인트와 월령별 준비물 기준으로 수정했습니다.
- `service-worker.js`: 캐시 버전을 `airang-growth-guide-v8-products-page`로 변경하고 준비물 관련 파일을 캐시에 추가했습니다.
- `assets/css/common.css`: 준비물 페이지, 광고 영역, 성장 탭 체크포인트 영역 스타일을 추가했습니다.
- `assets/js/app.js`: 기존 체크 탭 라우팅을 제거하고 체크포인트를 성장 탭 렌더링 흐름으로 통합했습니다.
- `assets/js/guide-render.js`: 성장 탭 내부 체크포인트 렌더링 함수를 추가했습니다.
- `assets/js/products.js`: 월령별 준비물 페이지 렌더링 스크립트를 추가했습니다.
- `assets/data/recommended-products.json`: 0~60개월 월령별 준비물 데이터를 추가했습니다.

## 적용 방법

ZIP 압축을 푼 뒤 GitHub Pages 저장소 루트에 그대로 덮어씁니다.

```bash
git add .
git commit -m "Add monthly products page"
git push
```

## 확인 경로

- 메인 앱: `index.html`
- 준비물 페이지: `products.html`
- 성장 탭 체크포인트: `index.html#growth`

## AdSense 적용 위치

`products.html`의 `<head>` 주석 영역에 AdSense 스크립트를 넣고, 본문 `ad-card` 영역에 수동 광고 단위 `<ins class="adsbygoogle">` 코드를 넣으면 됩니다.

현재 ZIP에는 게시자 ID를 알 수 없어 실제 AdSense 코드는 넣지 않았습니다.
