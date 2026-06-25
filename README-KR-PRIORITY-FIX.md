# 한국 공식자료 우선 적용 + jquery-lite show/hide 오류 수정 패치

## 수정 내용

1. `Uncaught (in promise) TypeError: $card.show is not a function` 오류 수정
   - `assets/js/vendor/jquery-lite.js`에 `.show()`, `.hide()`, `.toggle()` 메서드를 추가했습니다.

2. 한국 공식자료 우선 노출
   - 홈의 식사 변화 문구를 한국 보강 데이터 기준으로 우선 표시합니다.
   - 식사 화면에서 한국형 식사 가이드와 한국 음식 주의 데이터를 먼저 표시합니다.
   - CDC 식사 데이터는 보조 참고자료 영역으로 이동했습니다.
   - 성장 화면은 한국 영유아 건강검진/K-DST 안내를 우선 안내하고, CDC 발달 포인트는 보조 참고자료로 표시합니다.

3. PWA 캐시 갱신
   - `service-worker.js` 캐시 버전을 `airang-growth-guide-v6-kr-priority-fix`로 변경했습니다.

## 적용 방법

압축을 풀고 GitHub Pages 저장소 루트에 그대로 덮어쓴 뒤 아래 명령을 실행하세요.

```bash
git add .
git commit -m "Fix jquery show error and prioritize Korea official data"
git push
```

## 배포 후 확인

- 콘솔에 `$card.show is not a function` 오류가 없어야 합니다.
- 홈 화면에 `한국 공식자료 우선` 배지가 보여야 합니다.
- 식사 화면에서 한국형 식사 가이드가 CDC 데이터보다 먼저 보여야 합니다.
- 이전 화면이 계속 보이면 브라우저 사이트 데이터 삭제 또는 강력 새로고침 후 확인하세요.
