# Weather Now

도시 이름을 입력하면 현재 날씨를 보여 주는 작은 풀스택 웹 앱입니다. API 키가 필요 없는 Open-Meteo의 지오코딩 API와 Forecast API를 Node.js 백엔드에서 호출합니다.

## 파일 구조

```text
weather/
├── public/             # 프론트엔드
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── api/
│   └── weather.mjs     # Vercel 서버리스 함수
├── lib/
│   └── weather.js      # 공통 날씨 조회 로직
├── server.js           # 로컬 백엔드 및 정적 파일 서버
├── vercel.json         # Vercel 배포 설정
├── package.json
└── README.md
```

## 실행 방법

1. Node.js 18 이상이 설치되어 있는지 확인합니다.

   ```bash
   node --version
   ```

2. 프로젝트 폴더에서 서버를 실행합니다. 외부 패키지가 없어 `npm install`은 필요하지 않습니다.

   ```bash
   npm start
   ```

3. 브라우저에서 아래 주소를 엽니다.

   ```text
   http://localhost:3000
   ```

4. 종료하려면 터미널에서 `Ctrl+C`를 누릅니다.

개발 중 파일 변경 시 서버를 자동으로 다시 시작하려면 `npm run dev`를 사용하세요. 다른 포트를 사용하려면 macOS/Linux에서 `PORT=8080 npm start`처럼 실행할 수 있습니다.

## 동작 흐름

브라우저는 `/api/weather?city=도시명`으로만 요청합니다. 백엔드는 도시명을 좌표로 바꾼 뒤 Open-Meteo에서 현재 기온, 체감 온도, 날씨 코드, 습도, 풍속을 가져와 브라우저에 전달합니다. API 키나 환경 변수 설정은 필요하지 않습니다.
