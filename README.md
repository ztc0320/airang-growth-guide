# 아이랑 성장가이드 서비스용 PWA

아이 생년월일을 기준으로 현재 월령을 계산하고, `monthly-guide.json`의 월령별 발달·식사·놀이·안전 가이드를 보여주는 정적 PWA입니다.

## 핵심 특징

- Android/iOS 공통 웹앱
- 서버 DB 없음
- GPT/API 호출 없음
- 정적 JSON 기반
- 아이 정보와 체크리스트는 현재 기기 localStorage에만 저장
- PWA 홈 화면 설치 가능
- 오프라인 캐시 지원

## 실행

```bash
cd airang-growth-service-ready
python3 -m http.server 8080
```

브라우저에서 접속합니다.

```text
http://localhost:8080
```

`index.html`을 파일로 직접 열면 JSON 로딩이 제한될 수 있습니다.

## 배포

정적 호스팅이면 됩니다.

- Netlify
- Vercel
- GitHub Pages
- Firebase Hosting
- Cloudflare Pages

업로드 루트는 이 폴더 전체입니다. `index.html`이 루트에 있어야 합니다.

## iPhone 테스트

1. Safari에서 배포 주소 접속
2. 공유 버튼 선택
3. 홈 화면에 추가
4. 홈 화면 아이콘으로 실행

## Android 테스트

1. Chrome에서 배포 주소 접속
2. 메뉴에서 앱 설치 또는 홈 화면에 추가
3. 홈 화면 아이콘으로 실행

## 주요 파일

- `index.html`: 앱 본문
- `privacy.html`: 개인정보 처리 안내
- `manifest.json`: PWA 설정
- `service-worker.js`: 캐시 설정
- `assets/data/monthly-guide.json`: 0~60개월 월령 데이터
- `assets/data/food-warning.json`: 음식 주의 데이터
- `assets/js/app.js`: 앱 초기화와 화면 전환
- `assets/js/baby-calc.js`: 개월수 계산
- `assets/js/guide-render.js`: 화면 렌더링
- `assets/js/storage.js`: localStorage 저장

## 주의

앱의 육아 정보는 진단이나 치료 목적이 아닙니다. 상용 서비스 적용 전에는 소아청소년과 또는 영유아 영양 전문가 검수를 권장합니다.
