import axios from 'axios';

// Single API base URL — internal-api serves all routes (/auth/*, /housing/*, /lease/*, etc.)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3009';

export const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    authApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete authApi.defaults.headers.common['Authorization'];
  }
};
