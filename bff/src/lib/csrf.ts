import { HttpRequest, HttpResponseInit } from '@azure/functions';

export function checkCsrf(request: HttpRequest): HttpResponseInit | null {
  const xRequestedWith = request.headers.get('x-requested-with');
  if (xRequestedWith !== 'XMLHttpRequest') {
    return {
      status: 403,
      jsonBody: { error: 'Missing or invalid X-Requested-With header' },
    };
  }
  return null;
}
