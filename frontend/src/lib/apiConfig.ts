// Centralized Enterprise API Base URL Helper
const getApiBaseUrl = (): string => {
  // Check if custom environment variable is set
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env["VITE_API_URL"]) {
    return (import.meta.env["VITE_API_URL"] as string).replace(/\/$/, "");
  }

  // Production check: If running on Cloudflare Pages or any HTTPS domain, use Render production backend
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return "https://shripadpg.onrender.com";
    }
  }

  // Fallback to local development server
  return "http://localhost:5000";
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Enterprise API fetch wrapper with automatic base URL injection and robust error handling.
 */
export async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.warn(`[Enterprise API] Network request to ${url} failed or blocked:`, error);
    throw error;
  }
}
