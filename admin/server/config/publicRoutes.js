/**
 * 无需登录即可访问的公开接口
 * 格式：{ method: 'GET'|'POST'|..., path: '/api/...' }
 * method 填 '*' 表示该路径的所有方法均公开
 */
const PUBLIC_ROUTES = [
  { method: 'POST', path: '/api/auth/login' },
  { method: 'POST', path: '/api/auth/register' },
  { method: 'GET',  path: '/api/persona' },
  { method: 'POST', path: '/api/chat' },
]

/**
 * 判断当前请求是否在公开白名单中
 */
function isPublicRoute(method, path) {
  return PUBLIC_ROUTES.some(
    r => (r.method === '*' || r.method === method.toUpperCase()) && r.path === path
  )
}

module.exports = { PUBLIC_ROUTES, isPublicRoute }
