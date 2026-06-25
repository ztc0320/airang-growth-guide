# 아이랑 성장가이드 공식자료 출처 페이지 패치

## 포함 파일

- `sources.html`: 공식자료 출처 전용 페이지
- `index.html`: 설정 화면에 공식자료 출처 링크 추가
- `assets/css/common.css`: 출처 페이지 스타일 추가
- `service-worker.js`: `sources.html` 캐시 추가 및 캐시 버전 변경

## 적용 방법

ZIP 압축을 풀고 GitHub Pages 저장소 루트에 그대로 덮어쓴 뒤 아래 명령을 실행하세요.

```bash
git add .
git commit -m "Add official sources page"
git push
```

## 확인 경로

- 앱 설정 화면: `공식자료 출처 보기`
- 직접 주소: `https://아이디.github.io/저장소명/sources.html`

## 캐시

`service-worker.js` 캐시 버전을 `airang-growth-guide-v5-sources`로 변경했습니다. 그래도 이전 화면이 보이면 브라우저 사이트 데이터를 삭제한 뒤 다시 접속하세요.
