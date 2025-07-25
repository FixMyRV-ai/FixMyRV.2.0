import api from "./api";
import { AxiosResponse } from "axios";
import { AxiosRequestConfig } from "axios";

export default class BaseService {
  protected endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }
  protected url(path: string = ""): string {
    return `${api.defaults.baseURL}${this.endpoint}${path}`;
  }

  protected async get<T>(path: string = ""): Promise<T> {
    const response: AxiosResponse<T> = await api.get(this.url(path));
    return response.data;
  }

  protected async post<T, D = unknown>(
    path: string = "",
    data: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await api.post(
      this.url(path),
      data,
      config
    );
    return response.data;
  }

  protected async put<T, D = unknown>(path: string = "", data: D): Promise<T> {
    const response: AxiosResponse<T> = await api.put(this.url(path), data);
    return response.data;
  }

  protected async patch<T, D = unknown>(path: string = "", data: D): Promise<T> {
    const response: AxiosResponse<T> = await api.patch(this.url(path), data);
    return response.data;
  }

  protected async delete<T>(path: string = ""): Promise<T> {
    const response: AxiosResponse<T> = await api.delete(this.url(path));
    return response.data;
  }
}
