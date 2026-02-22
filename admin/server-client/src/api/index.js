import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  response => {
    const res = response.data;
    if (res.code === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(new Error(res.message || '未授权'));
    }
    return res;
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getUserInfo: () => api.get('/user/info')
};

export const user = {
  getUsers: () => api.get('/users'),
  updateUser: (data) => api.post('/users', data),
  deleteUser: (id) => api.delete(`/users/${id}`)
};

export const upload = {
  uploadFile: (formData) => api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getFiles: () => api.get('/files'),
  deleteFile: (fileName) => api.delete(`/files/${fileName}`)
};

export const role = {
  getRoles: () => api.get('/roles'),
  getRole: (id) => api.get(`/roles/${id}`),
  createRole: (data) => api.post('/roles', data),
  updateRole: (id, data) => api.put(`/roles/${id}`, data),
  deleteRole: (id) => api.delete(`/roles/${id}`),
  getRolePermissions: (id) => api.get(`/roles/${id}/permissions`),
  assignPermissions: (id, menu_ids) => api.post(`/roles/${id}/permissions`, { menu_ids })
};

export const menu = {
  getMenus: () => api.get('/menus'),
  getMenuTree: () => api.get('/menus/tree'),
  getMenu: (id) => api.get(`/menus/${id}`),
  createMenu: (data) => api.post('/menus', data),
  updateMenu: (id, data) => api.put(`/menus/${id}`, data),
  deleteMenu: (id) => api.delete(`/menus/${id}`)
};

export default api;
