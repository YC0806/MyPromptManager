import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // TODO: hook up to real auth flow
      console.warn("Unauthenticated request. Redirect to login if necessary.");
    }
    return Promise.reject(error);
  }
);

export async function get<T>(url: string, params?: Record<string, unknown>) {
  const response = await apiClient.get<T>(url, { params });
  return response.data;
}

export async function post<T, B = unknown>(url: string, body: B) {
  const response = await apiClient.post<T>(url, body);
  return response.data;
}

export async function put<T, B = unknown>(url: string, body: B) {
  const response = await apiClient.put<T>(url, body);
  return response.data;
}

export async function patch<T, B = unknown>(url: string, body: B) {
  const response = await apiClient.patch<T>(url, body);
  return response.data;
}

export async function remove(url: string) {
  await apiClient.delete(url);
}
