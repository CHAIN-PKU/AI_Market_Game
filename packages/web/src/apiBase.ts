/**
 * API 基址。
 *
 * 开发/预览时默认同源（vite 会把 /api 代理到 3001）；但如果前端被打成静态包
 * 放到没有反向代理的地方，/api 会命中静态服务器并返回 501。
 * 这时用 VITE_API_BASE 指到真正的后端即可，例如：
 *   VITE_API_BASE=http://127.0.0.1:3001 npm run build -w @ai-civ/web
 */
const RAW = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

export const API_BASE = RAW.replace(/\/$/, '');

/** 把 '/api/xxx' 解析成实际请求地址；未配置时保持同源相对路径。 */
export function apiUrl(path: string): string {
  if (!API_BASE) return path;
  return `${API_BASE}${path}`;
}
