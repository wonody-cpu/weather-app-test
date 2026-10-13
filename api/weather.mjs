import weatherService from "../lib/weather.js";

const { getWeather } = weatherService;

export default {
  async fetch(request) {
    if (request.method !== "GET") {
      return Response.json(
        { error: "허용되지 않은 요청입니다." },
        { status: 405, headers: { Allow: "GET" } },
      );
    }

    const url = new URL(request.url);
    const city = (url.searchParams.get("city") || "").trim();

    if (city.length < 2 || city.length > 80) {
      return Response.json(
        { error: "도시 이름을 2~80자로 입력해 주세요." },
        { status: 400 },
      );
    }

    try {
      return Response.json(await getWeather(city), {
        headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" },
      });
    } catch (error) {
      console.error(error);
      const message = error.name === "AbortError"
        ? "날씨 서비스 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요."
        : error.message || "서버 오류가 발생했습니다.";
      return Response.json({ error: message }, { status: error.statusCode || 502 });
    }
  },
};
