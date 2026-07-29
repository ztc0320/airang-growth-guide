# 배포 체크리스트

## 1. 배포 전 확인

- `python3 -m http.server 8080`으로 로컬 실행
- 아이 생년월일 입력 테스트
- 홈/성장/식사/놀이/체크/설정 탭 이동 테스트
- 설정 > monthly-guide.json 검증 버튼 통과 확인
- iPhone Safari 홈 화면 추가 테스트
- Android Chrome 설치 테스트

## 2. Netlify 배포

1. Netlify에 새 사이트 생성
2. 이 폴더 전체를 드래그 앤 드롭
3. 배포 후 HTTPS 주소 접속
4. iPhone/Android에서 홈 화면 추가 확인

## 3. Vercel 배포

1. GitHub 저장소에 이 폴더 업로드
2. Vercel에서 Import Project
3. Framework Preset은 Other 선택
4. Build Command 비움
5. Output Directory 비움 또는 `.` 사용

## 4. GitHub Pages 배포

1. 저장소 루트에 파일 배치
2. Settings > Pages
3. Branch 배포 설정
4. HTTPS 주소 확인

### 박물관 데이터 자동 갱신

1. 공공데이터포털에서 `전국박물관미술관정보표준데이터` 활용신청
2. GitHub 저장소의 `Settings > Secrets and variables > Actions` 이동
3. `New repository secret` 선택
4. 이름은 `PUBLIC_DATA_SERVICE_KEY`, 값은 발급받은 일반 인증키 입력
5. `Actions > Update museum data > Run workflow`를 한 번 실행

이후 매일 오전 6시 10분경(한국시간)에 `assets/data/museums.json`이 자동 갱신됩니다. Secret을 설정하지 않아도 기본 등록된 시설로 나들이 화면을 확인할 수 있습니다.

## 5. 서비스 워커 업데이트

CSS/JS/JSON을 수정한 뒤 사용자의 캐시가 남아 있으면 `service-worker.js`의 `CACHE_NAME` 값을 변경합니다.

예:

```js
var CACHE_NAME = 'airang-growth-guide-v4';
```

## 6. 콘텐츠 업데이트

`assets/data/monthly-guide.json`을 수정한 뒤 앱의 설정 화면에서 검증 버튼을 눌러 누락 여부를 확인합니다.

## 7. 상용 전 필수 권장 사항

- 소아청소년과 또는 영유아 영양 전문가 콘텐츠 검수
- 정식 도메인 연결
- 개인정보 처리 안내 문구 검토
- 문의 이메일 또는 운영자 정보 추가
- analytics를 붙일 경우 개인정보 처리 안내 업데이트
