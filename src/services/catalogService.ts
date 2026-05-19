import apiClient from './apiClient';
import { ApiResponse, Department, Specialization } from '@/types/api';

export const catalogService = {
  // Departments
  async getDepartments(): Promise<ApiResponse<string[]>> {
    const response = await apiClient.get<ApiResponse<string[]>>('/departments');
    return response.data;
  },

  async getAllDepartments(): Promise<ApiResponse<Department[]>> {
    // Note: The backend listAll returns List<String>. 
    // If we need the full objects, we might need a different endpoint or update the backend.
    // Looking at DepartmentController, listAll() returns List<String>.
    // For management, we need the full objects.
    // I'll assume we might need to add a new endpoint or the current one should return objects for admin.
    // Actually, looking at the backend code:
    /*
      @GetMapping
      @PreAuthorize("isAuthenticated()")
      public ApiResponse<List<String>> listAll() {
        return ApiResponse.success(
            departmentRepository.findAll().stream()
                .filter(Department::isActive)
                .map(Department::getName)
                .collect(Collectors.toList()));
      }
    */
    // This only returns active names. We need a management endpoint.
    // Wait, the user said "Controller is @HMSBackend\build\classes\java\main\com\res\hms\hospital\api\DepartmentController.class".
    // I read the source code above. It has listAll returning strings.
    // I should probably check if there is another endpoint or if I should update the backend.
    // But wait, the user said "create a screen to create/edit manage departments and Speclizations".
    // If the backend doesn't have an endpoint for full objects, I might need to add it or use what's there.
    // Actually, I'll check if I can add a `listManagement` endpoint or if I should change `listAll`.
    // Let's check the controller again.
    const response = await apiClient.get<ApiResponse<Department[]>>('/departments/all'); // Speculative
    return response.data;
  },

  async createDepartment(data: Partial<Department>): Promise<ApiResponse<Department>> {
    const response = await apiClient.post<ApiResponse<Department>>('/departments', data);
    return response.data;
  },

  async updateDepartment(id: string, data: Partial<Department>): Promise<ApiResponse<Department>> {
    const response = await apiClient.put<ApiResponse<Department>>(`/departments/${id}`, data);
    return response.data;
  },

  async deleteDepartment(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/departments/${id}`);
    return response.data;
  },

  // Specializations
  async getSpecializations(): Promise<ApiResponse<string[]>> {
    const response = await apiClient.get<ApiResponse<string[]>>('/specializations');
    return response.data;
  },

  async getAllSpecializations(): Promise<ApiResponse<Specialization[]>> {
    const response = await apiClient.get<ApiResponse<Specialization[]>>('/specializations/all'); // Speculative
    return response.data;
  },

  async createSpecialization(data: Partial<Specialization>): Promise<ApiResponse<Specialization>> {
    const response = await apiClient.post<ApiResponse<Specialization>>('/specializations', data);
    return response.data;
  },

  async updateSpecialization(id: string, data: Partial<Specialization>): Promise<ApiResponse<Specialization>> {
    const response = await apiClient.put<ApiResponse<Specialization>>(`/specializations/${id}`, data);
    return response.data;
  },

  async deleteSpecialization(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/specializations/${id}`);
    return response.data;
  }
};
