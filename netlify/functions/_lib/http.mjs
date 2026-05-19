export function jsonResponse(body, statusCode = 200, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${process.env.AT_STOCK_CACHE_SECONDS || 300}`,
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

export function errorResponse(message, statusCode = 500, details = undefined) {
  return jsonResponse(
    { error: message, ...(details !== undefined ? { details } : {}) },
    statusCode,
    { 'Cache-Control': 'no-store' }
  );
}
