# 아이랑 성장가이드 한국 공식자료 보강 패치

이 압축 파일은 기존 GitHub Pages 앱에 덮어쓸 파일만 포함합니다.

## 적용 방법

1. 이 ZIP의 압축을 풉니다.
2. GitHub Pages 저장소 루트에 그대로 덮어씁니다.
3. 아래 명령으로 반영합니다.

```bash
git add .
git commit -m "Add Korea official guide data"
git push
```

## 포함 파일

- index.html
- service-worker.js
- assets/css/common.css
- assets/js/app.js
- assets/js/guide-render.js
- assets/data/kr-official-sources.json
- assets/data/kr-feeding-stage-guide.json
- assets/data/kr-health-checkup-guide.json
- assets/data/kr-food-warning.json
- assets/data/kr-sleep-safety-guide.json
- assets/data/kr-monthly-overlay.json
- assets/data/kr-kdst-policy.json

## 적용 후 확인

- 앱 실행 후 홈 화면에 “한국 공식자료 기준” 카드가 보이는지 확인합니다.
- 식사 화면에 한국형 식사 가이드와 한국 음식 주의 데이터가 보이는지 확인합니다.
- 성장 화면에 국내 발달선별검사 안내가 보이는지 확인합니다.
- 체크 화면에 한국 영유아 건강검진 안내가 보이는지 확인합니다.
- 설정 화면에서 데이터 검증 버튼을 눌러 CDC 데이터와 한국 보강 데이터가 통과되는지 확인합니다.

## 캐시 주의

service-worker.js의 캐시 버전을 `airang-growth-guide-v4-kr-official`로 올려두었습니다. 그래도 이전 화면이 보이면 브라우저 새로고침 또는 사이트 데이터 삭제 후 다시 접속하세요.
