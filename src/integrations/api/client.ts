// Client API pour remplacer Supabase
import { ApiResponse, PaginatedResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private loadToken() {
    this.token = localStorage.getItem('auth_token');
  }

  private saveToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  private removeToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', { url, error });
      throw error;
    }
  }

  // ==================== AUTHENTIFICATION ====================

  async register(userData: {
    email: string;
    password: string;
    nom: string;
    telephone?: string;
    societe?: string;
  }) {
    const response = await this.request<{
      user: any;
      token: string;
      refreshToken: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      this.saveToken(response.data.token);
    }

    return response;
  }

  async login(credentials: { email: string; password: string }) {
    const response = await this.request<{
      user: any;
      token: string;
      refreshToken: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      this.saveToken(response.data.token);
    }

    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.removeToken();
    }
  }

  async getProfile() {
    return this.request<any>('/auth/profile');
  }

  async updateProfile(profileData: any) {
    return this.request<any>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async verifyToken() {
    return this.request<{ valid: boolean; user: any }>('/auth/verify');
  }

  // ==================== PROJETS ====================

  async getProjects() {
    return this.request<any[]>('/projects');
  }

  async getProject(id: string) {
    return this.request<any>(`/projects/${id}`);
  }

  async createProject(projectData: any) {
    return this.request<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async updateProject(id: string, projectData: any) {
    return this.request<any>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  }

  async deleteProject(id: string) {
    return this.request<any>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async getProjectStats(id: string) {
    return this.request<any>(`/projects/${id}/stats`);
  }

  // ==================== VENTES ====================

  async getSales(filters?: any): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const endpoint = `/sales${queryString ? `?${queryString}` : ''}`;
    
    return this.request<any[]>(endpoint) as Promise<PaginatedResponse<any>>;
  }

  async getSalesByProject(projectId: string, filters?: any): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const endpoint = `/sales/project/${projectId}${queryString ? `?${queryString}` : ''}`;
    
    return this.request<any[]>(endpoint) as Promise<PaginatedResponse<any>>;
  }

  async getSale(id: string) {
    return this.request<any>(`/sales/${id}`);
  }

  async createSale(saleData: any) {
    return this.request<any>('/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  }

  async updateSale(id: string, saleData: any) {
    return this.request<any>(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(saleData),
    });
  }

  async deleteSale(id: string) {
    return this.request<any>(`/sales/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== PAIEMENTS ====================

  async getPaymentPlans(saleId: string) {
    return this.request<any[]>(`/payments/plans/sale/${saleId}`);
  }

  async createPaymentPlan(planData: any) {
    return this.request<any>('/payments/plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  }

  async updatePaymentPlan(id: string, planData: any) {
    return this.request<any>(`/payments/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(planData),
    });
  }

  async recordPayment(planId: string, paymentData: any) {
    return this.request<any>(`/payments/pay/${planId}`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async getPaymentHistory(saleId: string) {
    return this.request<any[]>(`/payments/history/sale/${saleId}`);
  }

  async getPaymentStats() {
    return this.request<any>('/payments/stats/summary');
  }

  async deletePaymentPlan(id: string) {
    return this.request<any>(`/payments/plans/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== DÉPENSES ====================

  async getExpenses() {
    return this.request<any[]>('/expenses');
  }

  async getExpensesByProject(projectId: string) {
    return this.request<any[]>(`/expenses/project/${projectId}`);
  }

  async getExpense(id: string) {
    return this.request<any>(`/expenses/${id}`);
  }

  async createExpense(expenseData: any) {
    return this.request<any>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  }

  async updateExpense(id: string, expenseData: any) {
    return this.request<any>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
  }

  async deleteExpense(id: string) {
    return this.request<any>(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  async getExpenseStats(projectId: string) {
    return this.request<any>(`/expenses/stats/project/${projectId}`);
  }

  // ==================== CHÈQUES ====================

  async getChecks(filters?: any) {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const endpoint = `/checks${queryString ? `?${queryString}` : ''}`;
    
    return this.request<any[]>(endpoint);
  }

  async getCheck(id: string) {
    return this.request<any>(`/checks/${id}`);
  }

  async createCheck(checkData: any) {
    return this.request<any>('/checks', {
      method: 'POST',
      body: JSON.stringify(checkData),
    });
  }

  async updateCheck(id: string, checkData: any) {
    return this.request<any>(`/checks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(checkData),
    });
  }

  async deleteCheck(id: string) {
    return this.request<any>(`/checks/${id}`, {
      method: 'DELETE',
    });
  }

  async cashCheck(id: string, date?: string) {
    return this.request<any>(`/checks/${id}/encaisser`, {
      method: 'PATCH',
      body: JSON.stringify({ date_encaissement: date }),
    });
  }

  async getCheckStats() {
    return this.request<any>('/checks/stats/summary');
  }

  // ==================== PARAMÈTRES D'ENTREPRISE ====================

  async getDefaultCompanySettings() {
    return this.request<any>('/company-settings/default');
  }

  async getAllCompanySettings() {
    return this.request<any>('/company-settings');
  }

  async saveCompanySettings(settings: any) {
    return this.request<any>('/company-settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  async deleteCompanySettings() {
    return this.request<any>('/company-settings/default', {
      method: 'DELETE',
    });
  }

  async hasCompanySettings() {
    return this.request<any>('/company-settings/exists');
  }

  // ==================== MÉTHODES GÉNÉRIQUES ====================

  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.request<T>(url.pathname + url.search);
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // ==================== UTILITAIRES ====================

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }
}

// Instance singleton
export const apiClient = new ApiClient();
export default apiClient;
