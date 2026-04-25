import apiClient from './apiClient';
import { ApiResponse } from '@/types/api';

export interface SearchResult {
  id: string;
  type: 'HOSPITAL' | 'USER' | 'PATIENT';
  title: string;
  subtitle: string;
  link: string;
}

export const searchService = {
  async search(query: string): Promise<ApiResponse<SearchResult[]>> {
    const response = await apiClient.get<ApiResponse<SearchResult[]>>('/search', {
      params: { query }
    });
    return response.data;
  }
};
