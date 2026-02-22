<template>
  <div class="user-page">
    <div class="toolbar">
      <h2>用户管理</h2>
      <button @click="showAddDialog = true">新增用户</button>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>用户名</th>
          <th>邮箱</th>
          <th>角色</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in users" :key="item.id">
          <td>{{ item.id }}</td>
          <td>{{ item.username }}</td>
          <td>{{ item.email || '-' }}</td>
          <td>{{ item.role_id === 1 ? '管理员' : '普通用户' }}</td>
          <td>{{ item.status === 1 ? '正常' : '禁用' }}</td>
          <td>
            <button class="btn-edit" @click="handleEdit(item)">编辑</button>
            <button class="btn-delete" @click="handleDelete(item.id)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="showAddDialog" class="dialog-overlay" @click="showAddDialog = false">
      <div class="dialog" @click.stop>
        <h3>{{ isEdit ? '编辑用户' : '新增用户' }}</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-item">
            <input v-model="form.username" placeholder="用户名" required />
          </div>
          <div class="form-item">
            <input v-model="form.email" placeholder="邮箱" type="email" />
          </div>
          <div class="form-item" v-if="!isEdit">
            <input v-model="form.password" placeholder="密码" type="password" required />
          </div>
          <div class="form-item">
            <select v-model="form.role_id">
              <option :value="1">管理员</option>
              <option :value="2">普通用户</option>
            </select>
          </div>
          <div class="form-item">
            <select v-model="form.status">
              <option :value="1">正常</option>
              <option :value="0">禁用</option>
            </select>
          </div>
          <div class="dialog-footer">
            <button type="button" @click="showAddDialog = false">取消</button>
            <button type="submit">确定</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { user } from '../api';

const users = ref([]);
const showAddDialog = ref(false);
const isEdit = ref(false);
const form = reactive({
  id: null,
  username: '',
  email: '',
  password: '',
  role_id: 2,
  status: 1
});

const loadUsers = async () => {
  const res = await user.getUsers();
  if (res.code === 200) {
    users.value = res.data || [];
  }
};

const handleEdit = (item) => {
  isEdit.value = true;
  form.id = item.id;
  form.username = item.username;
  form.email = item.email;
  form.role_id = item.role_id;
  form.status = item.status;
  form.password = '';
  showAddDialog.value = true;
};

const handleSubmit = async () => {
  try {
    await user.updateUser(form);
    showAddDialog.value = false;
    loadUsers();
    resetForm();
  } catch (e) {
    alert(e.message);
  }
};

const handleDelete = async (id) => {
  if (!confirm('确定要删除该用户吗？')) return;
  try {
    await user.deleteUser(id);
    loadUsers();
  } catch (e) {
    alert(e.message);
  }
};

const resetForm = () => {
  isEdit.value = false;
  form.id = null;
  form.username = '';
  form.email = '';
  form.password = '';
  form.role_id = 2;
  form.status = 1;
};

onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar button {
  padding: 10px 20px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.table {
  width: 100%;
  background: white;
  border-collapse: collapse;
  border-radius: 8px;
  overflow: hidden;
}

.table th,
.table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.table th {
  background: #f5f7fa;
  font-weight: bold;
}

.btn-edit,
.btn-delete {
  padding: 5px 10px;
  margin-right: 5px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-edit {
  background: #409eff;
  color: white;
}

.btn-delete {
  background: #ff4444;
  color: white;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
}

.dialog h3 {
  margin-bottom: 20px;
}

.form-item {
  margin-bottom: 15px;
}

.form-item input,
.form-item select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.dialog-footer button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.dialog-footer button[type="button"] {
  background: #ddd;
}

.dialog-footer button[type="submit"] {
  background: #409eff;
  color: white;
}
</style>
