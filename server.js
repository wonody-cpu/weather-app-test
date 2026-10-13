const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// Open-Meteo의 장소 색인은 일부 한국어 도시명 검색을 지원하지 않아
// 국내 주요 도시의 일반적인 표기를 검색 가능한 이름으로 보완합니다.
const KOREAN_CITY_ALIASES = {
  서울: "Seoul", 서울시: "Seoul", 서울특별시: "Seoul",
  부산: "Busan", 부산시: "Busan", 부산광역시: "Busan",
  인천: "Incheon", 인천시: "Incheon", 인천광역시: "Incheon",
  대구: "Daegu", 대구시: "Daegu", 대구광역시: "Daegu",
  대전: "Daejeon", 대전시: "Daejeon", 대전광역시: "Daejeon",
  광주: "Gwangju", 광주시: "Gwangju", 광주광역시: "Gwangju",
  울산: "Ulsan", 울산시: "Ulsan", 울산광역시: "Ulsan",
  세종: "Sejong", 세종시: "Sejong", 세종특별자치시: "Sejong",
  제주: "Jeju City", 제주시: "Jeju City",
  수원: "Suwon", 수원시: "Suwon",
  춘천: "Chuncheon", 춘천시: "Chuncheon",
  강릉: "Gangneung", 강릉시: "Gangneung",
  전주: "Jeonju", 전주시: "Jeonju",
  창원: "Changwon", 창원시: "Changwon",
};

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(data));
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "WeatherNow/1.0" },
    });

    if (!response.ok) throw new Error(`외부 API 오류 (${response.status})`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function getWeather(city) {
  const searchName = KOREAN_CITY_ALIASES[city.replace(/\s/g, "")] || city;
  const geocodingUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  geocodingUrl.search = new URLSearchParams({
    name: searchName,
    count: "1",
    language: "ko",
    format: "json",
  });

  const locationData = await fetchJson(geocodingUrl);
  const location = locationData.results?.[0];

  if (!location) {
    const error = new Error("도시를 찾을 수 없습니다. 도시 이름을 다시 확인해 주세요.");
    error.statusCode = 404;
    throw error;
  }

  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
  forecastUrl.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "weather_code",
      "wind_speed_10m",
    ].join(","),
    timezone: "auto",
  });

  const forecast = await fetchJson(forecastUrl);
  if (!forecast.current) throw new Error("날씨 정보를 불러오지 못했습니다.");

  return {
    location: {
      name: location.name,
      region: location.admin1 || "",
      country: location.country || location.country_code,
    },
    weather: forecast.current,
    units: forecast.current_units,
    timezone: forecast.timezone,
  };
}

async function serveStatic(requestPath, response) {
  const pathname = requestPath === "/" ? "/index.html" : requestPath;
  const relativePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(PUBLIC_DIR, relativePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    response.end(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("페이지를 찾을 수 없습니다.");
      return;
    }
    throw error;
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

    if (request.method === "GET" && url.pathname === "/api/weather") {
      const city = (url.searchParams.get("city") || "").trim();
      if (city.length < 2 || city.length > 80) {
        return sendJson(response, 400, { error: "도시 이름을 2~80자로 입력해 주세요." });
      }

      const result = await getWeather(city);
      return sendJson(response, 200, result);
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return sendJson(response, 405, { error: "허용되지 않은 요청입니다." });
    }

    await serveStatic(url.pathname, response);
  } catch (error) {
    console.error(error);
    const message = error.name === "AbortError"
      ? "날씨 서비스 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요."
      : error.message || "서버 오류가 발생했습니다.";
    sendJson(response, error.statusCode || 502, { error: message });
  }
});

server.listen(PORT, () => {
  console.log(`Weather Now: http://localhost:${PORT}`);
});

module.exports = { getWeather, server };
