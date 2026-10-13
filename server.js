const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { getWeather } = require("./lib/weather");

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(data));
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

module.exports = { server };
