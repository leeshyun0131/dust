// .env.local의 인증키를 불러와 화면과 에어코리아 서버 함수를 로컬에서 실행합니다.
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const dustHandler = require('./api/dust.js');

const root = __dirname;
const envPath = path.join(root, '.env.local');
const port = Number(process.env.PORT || 3000);
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8'
};

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*AIRKOREA_KEY\s*=\s*(.*)\s*$/);
    if (match && !process.env.AIRKOREA_KEY) {
      process.env.AIRKOREA_KEY = match[1].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

  if (requestUrl.pathname === '/api/dust') {
    const query = Object.fromEntries(requestUrl.searchParams.entries());
    const apiResponse = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        response.writeHead(this.statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify(data));
        return this;
      }
    };

    await dustHandler({ method: request.method, query }, apiResponse);
    return;
  }

  const requestedFile = requestUrl.pathname === '/' ? 'index.html' : requestUrl.pathname.slice(1);
  if (!['index.html', 'script.js', 'style.css'].includes(requestedFile)) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('페이지를 찾을 수 없습니다.');
    return;
  }

  const filePath = path.join(root, requestedFile);
  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('파일을 읽지 못했습니다.');
      return;
    }

    response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath)] });
    response.end(content);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`로컬 대기질 앱 실행 중: http://127.0.0.1:${port}`);
  if (!process.env.AIRKOREA_KEY) {
    console.warn('.env.local에 AIRKOREA_KEY를 설정하면 측정 자료를 불러올 수 있습니다.');
  }
});
