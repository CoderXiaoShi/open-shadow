import { defineStore } from 'pinia';
import { auth } from '../api';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: null,
    menus: [],
    permissions: []
  }),
  getters: {
    permissionCodes: (state) => {
      return state.permissions?.map(p => p.permission_code) || [];
    },
    isAdmin: (state) => {
      const roles = state.userInfo?.roles || [];
      return roles.some(r => r.role_code === 'admin');
    }
  },
  actions: {
    async login(username, password) {
      const res = await auth.login({ username, password });
      if (res.code === 200) {
        this.token = res.data.token;
        localStorage.setItem('token', res.data.token);
        await this.getUserInfo();
        return true;
      }
      throw new Error(res.message);
    },
    async getUserInfo() {
      const res = await auth.getUserInfo();
      if (res.code === 200) {
        this.userInfo = res.data;
        this.menus = res.data.menus || [];
        this.permissions = res.data.permissions || [];
      }
    },
    logout() {
      this.token = '';
      this.userInfo = null;
      this.menus = [];
      this.permissions = [];
      localStorage.removeItem('token');
    }
  }
});
