export type User = {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: any;
};

/**
 * Extract access_token from cookie header string.
 * Example: "access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
 */
export function extractAccessToken(cookieHeader: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)access_token=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Validate the provided cookie header by calling the `/api/users/me` endpoint.
 *
 * Extracts the `access_token` from the cookie and uses it as a Bearer token.
 * Forwards the `X-Tenant` header if provided.
 * If the endpoint returns a 2xx status, the request is authenticated and user
 * details are returned. Otherwise, returns null (unauthorized).
 */
export async function validateCookie(cookieHeader?: string, tenantHeader?: string): Promise<User | null> {
  if (!cookieHeader) return null;

  const accessToken = extractAccessToken(cookieHeader);
  if (!accessToken) return null;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    // Forward X-Tenant header if provided
    if (tenantHeader) {
      headers["X-Tenant"] = tenantHeader;
    }

    const res = await fetch(`${baseUrl}/api/users/me`, {
      method: "GET",
      headers,
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json ?? null;
  } catch (err) {
    console.error("Failed to validate cookie with /api/users/me:", err);
    return null;
  }
}

export default validateCookie;
