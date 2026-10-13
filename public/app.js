const form = document.querySelector("#weather-form");
const input = document.querySelector("#city-input");
const button = form.querySelector("button");
const status = document.querySelector("#status");
const card = document.querySelector("#weather-card");

const weatherCodes = {
  0: ["맑음", "☀️", "🌙"],
  1: ["대체로 맑음", "🌤️", "🌙"],
  2: ["부분적으로 흐림", "⛅", "☁️"],
  3: ["흐림", "☁️", "☁️"],
  45: ["안개", "🌫️", "🌫️"], 48: ["서리 안개", "🌫️", "🌫️"],
  51: ["약한 이슬비", "🌦️", "🌧️"], 53: ["이슬비", "🌦️", "🌧️"], 55: ["강한 이슬비", "🌧️", "🌧️"],
  56: ["약한 어는 이슬비", "🌧️", "🌧️"], 57: ["강한 어는 이슬비", "🌧️", "🌧️"],
  61: ["약한 비", "🌦️", "🌧️"], 63: ["비", "🌧️", "🌧️"], 65: ["강한 비", "🌧️", "🌧️"],
  66: ["약한 어는 비", "🌧️", "🌧️"], 67: ["강한 어는 비", "🌧️", "🌧️"],
  71: ["약한 눈", "🌨️", "🌨️"], 73: ["눈", "🌨️", "🌨️"], 75: ["강한 눈", "❄️", "❄️"], 77: ["싸락눈", "❄️", "❄️"],
  80: ["약한 소나기", "🌦️", "🌧️"], 81: ["소나기", "🌧️", "🌧️"], 82: ["강한 소나기", "⛈️", "⛈️"],
  85: ["약한 눈보라", "🌨️", "🌨️"], 86: ["강한 눈보라", "❄️", "❄️"],
  95: ["뇌우", "⛈️", "⛈️"], 96: ["약한 우박을 동반한 뇌우", "⛈️", "⛈️"], 99: ["강한 우박을 동반한 뇌우", "⛈️", "⛈️"],
};

function setText(id, value) {
  document.querySelector(`#${id}`).textContent = value;
}

function renderWeather(data) {
  const { location, weather, units, timezone } = data;
  const condition = weatherCodes[weather.weather_code] || ["날씨 정보", "🌤️", "🌙"];
  const region = [location.region, location.country].filter(Boolean).join(", ");
  const [datePart, timePart] = weather.time.split("T");
  const observedDate = new Date(`${datePart}T00:00:00Z`);
  const localDate = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "UTC", month: "long", day: "numeric", weekday: "long",
  }).format(observedDate);
  const localTime = timePart?.slice(0, 5) || "--:--";

  setText("location-name", location.name);
  setText("location-detail", region);
  setText("local-time", localDate);
  setText("temperature", Math.round(weather.temperature_2m));
  setText("condition", condition[0]);
  setText("feels-like", Math.round(weather.apparent_temperature));
  setText("wind", `${Math.round(weather.wind_speed_10m)} ${units.wind_speed_10m}`);
  setText("humidity", `${weather.relative_humidity_2m}${units.relative_humidity_2m}`);
  setText("observed-time", localTime);
  setText("weather-visual", weather.is_day ? condition[1] : condition[2]);

  card.hidden = false;
  card.scrollIntoView({ behavior: "smooth", block: "center" });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = input.value.trim();

  if (city.length < 2) {
    status.textContent = "도시 이름을 두 글자 이상 입력해 주세요.";
    input.focus();
    return;
  }

  status.textContent = "날씨를 확인하고 있어요…";
  button.disabled = true;

  try {
    const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "날씨 정보를 불러오지 못했습니다.");
    renderWeather(data);
    status.textContent = "";
  } catch (error) {
    card.hidden = true;
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
