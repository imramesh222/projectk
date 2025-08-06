import { AxiosRequestConfig } from 'axios';

declare function apiGet<T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T>;

declare function apiPost<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T>;

declare function apiPut<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T>;

declare function apiPatch<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T>;

declare function apiDelete<T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T>;

// Export all as a namespace
declare const api: {
  apiGet: typeof apiGet;
  apiPost: typeof apiPost;
  apiPut: typeof apiPut;
  apiPatch: typeof apiPatch;
  apiDelete: typeof apiDelete;
};

export default api;

export { apiGet, apiPost, apiPut, apiPatch, apiDelete };
