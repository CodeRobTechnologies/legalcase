// Centralized client-side auth/session helpers.
// The backend issues a stateless JWT (no server cookie), so the session limit
// is enforced here by reading the token's `exp` claim.

const TOKEN_KEY = 'access_token';

type JwtPayload = { exp?: number; user_id?: number; email?: string; role?: string };

function decodeToken(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    // base64url -> base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

// Returns true only if a token exists AND has not expired.
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  const payload = decodeToken(token);
  // No exp claim -> treat as invalid rather than "never expires".
  if (!payload?.exp) return false;

  const nowSeconds = Date.now() / 1000;
  if (payload.exp <= nowSeconds) {
    // Session limit reached: clear the stale token so the app sees logged-out.
    clearSession();
    return false;
  }
  return true;
}

// Single source of truth for tearing down the client session.
export function clearSession(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem('user_id');
  sessionStorage.removeItem('user_email');
}
