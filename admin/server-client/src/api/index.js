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
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(new Error(res.message || '未授权'));
    }
    return res;
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.message || error.message || '请求失败';
    return Promise.reject(new Error(message));
  }
);

export const auth = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getUserInfo: () => api.get('/user/info')
};

export const user = {
  getUsers: (params) => api.get('/users', { params }),
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
  assignPermissions: (id, permission_ids) => api.post(`/roles/${id}/permissions`, { permission_ids })
};

export const permission = {
  getPermissions: () => api.get('/permissions'),
  getPermissionTree: () => api.get('/permissions/tree'),
  getPermission: (id) => api.get(`/permissions/${id}`),
  createPermission: (data) => api.post('/permissions', data),
  updatePermission: (id, data) => api.put(`/permissions/${id}`, data),
  deletePermission: (id) => api.delete(`/permissions/${id}`)
};

export const material = {
  getList: (params) => api.get('/materials', { params }),
  create:  (data)   => api.post('/materials', data),
  update:  (id, data) => api.put(`/materials/${id}`, data),
  delete:  (id)     => api.delete(`/materials/${id}`),
  upload:  (formData) => api.post('/materials/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export const persona = {
  get:          ()     => api.get('/persona'),
  save:         (data) => api.put('/persona', data),
  buildPrompt:  ()     => api.get('/persona/build-prompt'),
  uploadAvatar: (formData) => api.post('/materials/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export const aiConfig = {
  get:  ()     => api.get('/ai-config'),
  save: (data) => api.put('/ai-config', data),
  test: ()     => api.post('/ai-config/test')
};

export const chat = {
  send: (data) => api.post('/chat', data)
};

export default api;
