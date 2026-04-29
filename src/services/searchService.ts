import apiClient from './apiClient';
import { ApiResponse, PageResponse, SearchResultDTO } from '@/types/api';

export const searchService = {
  async search(query: string, page = 0, size = 20): Promise<ApiResponse<PageResponse<SearchResultDTO>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<SearchResultDTO>>>('/search', {
      params: { query, page, size }
    });
    return response.data;
  }
};
