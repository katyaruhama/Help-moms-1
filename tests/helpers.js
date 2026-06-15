export async function callApi(handler, { method = 'GET', body } = {}) {
  const req = {
    method,
    body
  };
  const res = createMockResponse();

  await handler(req, res);
  return res.toResult();
}

function createMockResponse() {
  const headers = {};
  let statusCode = 200;
  let rawBody = '';

  return {
    get statusCode() {
      return statusCode;
    },
    set statusCode(value) {
      statusCode = value;
    },
    setHeader(name, value) {
      headers[name.toLowerCase()] = value;
    },
    end(value = '') {
      rawBody = String(value);
    },
    toResult() {
      return {
        statusCode,
        headers,
        body: rawBody ? JSON.parse(rawBody) : null
      };
    }
  };
}
