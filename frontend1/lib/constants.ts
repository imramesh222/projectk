// Ensure we don't duplicate /api/v1 in the URL
const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const API_URL = baseUrl.endsWith('/') ? 
  `${baseUrl}api/v1` : 
  `${baseUrl}/api/v1`;
