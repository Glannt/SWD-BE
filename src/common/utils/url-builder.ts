export function buildApiUrl(
  baseUrl: string,
  version: string,
  path: string,
  queryParams?: Record<string, string>,
): string {
  let url = `${baseUrl}/api/v${version}${path}`;
  if (queryParams) {
    const query = new URLSearchParams(queryParams).toString();
    url += `?${query}`;
  }
  return url;
}
