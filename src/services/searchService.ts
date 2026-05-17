import apiClient from './apiClient';
import { ApiResponse, PageResponse, SearchResultDTO } from '@/types/api';

export const searchService = {
  async search(query: string, page = 0, size = 20): Promise<ApiResponse<PageResponse<SearchResultDTO>>> {
    if (!query || query.trim().length < 2) {
      return {
        success: true,
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: size,
          page: page
        }
      };
    }
    const response = await apiClient.get<ApiResponse<PageResponse<SearchResultDTO>>>('/search', {
      params: { query, page, size }
    });
    return response.data;
  }
};
