import { Request } from 'express';

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

/**
 * Lấy host động từ request hoặc fallback về config
 * @param req - Request object (optional)
 * @param configService - ConfigService instance (any type)
 * @returns host string
 */
export function getDynamicHost(req?: Request, configService?: any): string {
  if (req) {
    const protocol = req.protocol; // 'http' hoặc 'https'
    const hostname = req.get('host'); // 'localhost:3000' hoặc 'yourdomain.com'
    return `${protocol}://${hostname}`;
  }

  // Fallback về config nếu không có request
  if (configService) {
    const host = configService.get('HOST');
    const port = configService.get('PORT');
    return port ? `${host}:${port}` : host;
  }

  // Fallback cuối cùng
  return 'http://localhost:3000';
}

/**
 * Tạo URL xác thực email với host động
 * @param req - Request object (optional)
 * @param configService - ConfigService instance (any type)
 * @param email - Email address
 * @param token - Verification token
 * @returns verification URL
 */
export function buildVerificationUrl(
  req?: Request,
  configService?: any,
  email?: string,
  token?: string,
): string {
  const host = getDynamicHost(req, configService);
  const params = new URLSearchParams();

  if (email) params.append('email', email);
  if (token) params.append('token', token);

  return `${host}/api/v1/auth/verify-email?${params.toString()}`;
}
