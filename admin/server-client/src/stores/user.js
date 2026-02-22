import { defineStore } from 'pinia';
import { auth } from '../api';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: null,
    menus: []
  }),
  getters: {
    menuPermissions: (state) => {
      return state.menus?.map(m => m.path) || [];
    },
    isAdmin: (state) => {
      return state.userInfo?.role_id === 1;
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
      }
    },
    logout() {
      this.token = '';
      this.userInfo = null;
      this.menus = [];
      localStorage.removeItem('token');
    }
  }
});
