import type { Project, Task, AuthResponse, ApiError as ApiErrorType, User } from '../types';

interface MockUser extends User {
  password: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:4000';
const IS_MOCK_API = API_BASE_URL.includes('localhost:4000');

class ApiError extends Error {
  constructor(public data: ApiErrorType) {
    super(data.error);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData: ApiErrorType = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Mock auth handlers for json-server
async function mockLogin(email: string, password: string): Promise<AuthResponse> {
  const usersResponse = await fetch(`${API_BASE_URL}/users`);
  const users: MockUser[] = await usersResponse.json();
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    throw new ApiError({ error: 'Invalid credentials' });
  }

  const token = btoa(JSON.stringify({ userId: user.id, email: user.email }));
  const { password: _, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
}

async function mockRegister(name: string, email: string, password: string): Promise<AuthResponse> {
  const usersResponse = await fetch(`${API_BASE_URL}/users`);
  const users: MockUser[] = await usersResponse.json();
  
  if (users.find(u => u.email === email)) {
    throw new ApiError({ error: 'Email already registered', fields: { email: 'already exists' } });
  }

  const newUser: MockUser = {
    id: Date.now().toString(),
    name,
    email,
    password,
  };

  await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newUser),
  });

  const token = btoa(JSON.stringify({ userId: newUser.id, email: newUser.email }));
  const { password: _, ...userWithoutPassword } = newUser;
  return { token, user: userWithoutPassword };
}

export const api = {
  // Auth
  register: (name: string, email: string, password: string) =>
    IS_MOCK_API 
      ? mockRegister(name, email, password)
      : request<AuthResponse>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        }),

  login: (email: string, password: string) =>
    IS_MOCK_API
      ? mockLogin(email, password)
      : request<AuthResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }),

  // Projects
  getProjects: async () => {
    const response = await fetch(`${API_BASE_URL}/projects`);
    if (!response.ok) {
      const errorData: ApiErrorType = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new ApiError(errorData);
    }
    const projects: Project[] = await response.json();
    // Filter projects for current user in mock mode
    if (IS_MOCK_API) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = JSON.parse(atob(token));
          return { projects: projects.filter((p: Project) => p.owner_id === decoded.userId) };
        } catch {
          return { projects };
        }
      }
    }
    return { projects };
  },

  createProject: async (name: string, description?: string) => {
    const token = localStorage.getItem('token');
    let ownerId = '1'; // default
    
    if (token && IS_MOCK_API) {
      try {
        const decoded = JSON.parse(atob(token));
        ownerId = decoded.userId;
      } catch {
        // Use default if token parsing fails
      }
    }

    const projectData = {
      name,
      description: description || null,
      owner_id: ownerId,
      created_at: new Date().toISOString(),
    };

    if (IS_MOCK_API) {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });
      if (!response.ok) {
        const errorData: ApiErrorType = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new ApiError(errorData);
      }
      return response.json();
    }

    return request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  getProject: async (id: string) => {
    if (IS_MOCK_API) {
      const projectResponse = await fetch(`${API_BASE_URL}/projects/${id}`);
      if (!projectResponse.ok) {
        const errorData: ApiErrorType = await projectResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new ApiError(errorData);
      }
      const project: Project = await projectResponse.json();
      
      const tasksResponse = await fetch(`${API_BASE_URL}/tasks?project_id=${id}`);
      const tasks: Task[] = await tasksResponse.json();
      
      return { ...project, tasks };
    }
    return request<Project & { tasks: Task[] }>(`/projects/${id}`);
  },

  updateProject: (id: string, name: string, description?: string) =>
    request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name, description }),
    }),

  deleteProject: (id: string) =>
    request<void>(`/projects/${id}`, {
      method: 'DELETE',
    }),

  // Tasks
  getTasks: async (projectId: string, status?: string, assigneeId?: string) => {
    if (IS_MOCK_API) {
      let url = `${API_BASE_URL}/tasks?project_id=${projectId}`;
      if (status) url += `&status=${status}`;
      if (assigneeId) url += `&assignee_id=${assigneeId}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorData: ApiErrorType = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new ApiError(errorData);
      }
      const tasks: Task[] = await response.json();
      return { tasks };
    }
    
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (assigneeId) params.append('assignee', assigneeId);
    const query = params.toString();
    return request<{ tasks: Task[] }>(`/projects/${projectId}/tasks${query ? `?${query}` : ''}`);
  },

  createTask: async (
    projectId: string,
    title: string,
    description?: string,
    priority?: Task['priority'],
    assigneeId?: string,
    dueDate?: string
  ) => {
    const taskData = {
      title,
      description,
      status: 'todo' as Task['status'],
      priority: priority || 'medium' as Task['priority'],
      project_id: projectId,
      assignee_id: assigneeId || null,
      due_date: dueDate || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (IS_MOCK_API) {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) {
        const errorData: ApiErrorType = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new ApiError(errorData);
      }
      return response.json();
    }

    return request<Task>(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  updateTask: (
    id: string,
    updates: Partial<{
      title: string;
      description: string;
      status: Task['status'];
      priority: Task['priority'];
      assignee_id: string;
      due_date: string;
    }>
  ) =>
    request<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteTask: (id: string) =>
    request<void>(`/tasks/${id}`, {
      method: 'DELETE',
    }),
};
