import { defineStore } from 'pinia';
import { auth } from '../api';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: null
  }),
  actions: {
    async login(username, password) {
      const res = await auth.login({ username, password });
      if (res.code === 200) {
        this.token = res.data.token;
        localStorage.setItem('token', res.data.token);
        return true;
      }
      throw new Error(res.message);
    },
    async getUserInfo() {
      const res = await auth.getUserInfo();
      if (res.code === 200) {
        this.userInfo = res.data;
      }
    },
    logout() {
      this.token = '';
      this.userInfo = null;
      localStorage.removeItem('token');
    }
  }
});
