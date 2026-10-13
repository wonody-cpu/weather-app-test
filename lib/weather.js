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

module.exports = { getWeather };
