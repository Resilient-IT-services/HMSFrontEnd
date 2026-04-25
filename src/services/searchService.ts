import apiClient from './apiClient';
import { ApiResponse, PageResponse } from '@/types/api';

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  link: string;
}

export const searchService = {
  async search(query: string, page = 0, size = 20): Promise<ApiResponse<PageResponse<SearchResult>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<SearchResult>>>('/search', {
      params: { query, page, size }
    });
    return response.data;
  }
};
