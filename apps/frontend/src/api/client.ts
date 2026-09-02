const API_BASE = '/api';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(API_BASE + '/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      if (data.success && data.data) {
        this.setTokens(data.data.accessToken, data.data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async request<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const token = this.getToken();
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (token) {
      requestHeaders['Authorization'] = 'Bearer ' + token;
    }

    let res = await fetch(API_BASE + endpoint, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    // If 401, try refreshing the token
    if (res.status === 401 && token) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        requestHeaders['Authorization'] = 'Bearer ' + this.getToken();
        res = await fetch(API_BASE + endpoint, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
        });
      }
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || data.message || 'Request failed');
    }

    return data;
  }

  // â”€â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async login(email: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (data.data?.accessToken) {
      this.setTokens(data.data.accessToken, data.data.refreshToken);
    }
    return data;
  }

  async register(email: string, password: string, name: string) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: { email, password, name },
    });
    if (data.data?.accessToken) {
      this.setTokens(data.data.accessToken, data.data.refreshToken);
    }
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearTokens();
    }
  }

  // â”€â”€â”€ Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async getUser(id: string) { return this.request('/users/' + id); }
  async updateProfile(id: string, data: { name?: string }) {
    return this.request('/users/' + id, { method: 'PUT', body: data });
  }

  // â”€â”€â”€ Teams â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async getMyTeams() { return this.request('/teams/my/list'); }
  async getTeam(id: string) { return this.request('/teams/' + id); }
  async createTeam(data: { name: string; description?: string }) {
    return this.request('/teams', { method: 'POST', body: data });
  }
  async updateTeam(id: string, data: { name?: string; description?: string }) {
    return this.request('/teams/' + id, { method: 'PUT', body: data });
  }
  async deleteTeam(id: string) {
    return this.request('/teams/' + id, { method: 'DELETE' });
  }
  async addTeamMember(teamId: string, userId: string, role: string = 'MEMBER') {
    return this.request('/teams/' + teamId + '/members', { method: 'POST', body: { userId, role } });
  }
  async removeTeamMember(teamId: string, userId: string) {
    return this.request('/teams/' + teamId + '/members/' + userId, { method: 'DELETE' });
  }
  async getTeamMembers(teamId: string) { return this.request('/teams/' + teamId + '/members'); }

  // â”€â”€â”€ Tasks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async getTeamTasks(teamId: string, page = 1, limit = 50, status?: string) {
    let url = '/teams/' + teamId + '/tasks?page=' + page + '&limit=' + limit;
    if (status) url += '&status=' + status;
    return this.request(url);
  }
  async createTask(data: { teamId: string; title: string; description?: string; assigneeId?: string }) {
    return this.request('/tasks', { method: 'POST', body: data });
  }
  async updateTask(id: string, data: { title?: string; description?: string; status?: string; assigneeId?: string }) {
    return this.request('/tasks/' + id, { method: 'PUT', body: data });
  }
  async deleteTask(id: string) {
    return this.request('/tasks/' + id, { method: 'DELETE' });
  }
}

export const api = new ApiClient();