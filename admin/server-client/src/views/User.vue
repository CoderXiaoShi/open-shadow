<template>
  <div class="user-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" @click="openDialog()" v-if="userStore.hasPermission('system:user:add')">新增用户</el-button>
        </div>
      </template>

      <el-table :data="users" stripe v-loading="tableLoading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="email" label="邮箱">
          <template #default="{ row }">
            {{ row.email || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="角色">
          <template #default="{ row }">
            <el-tag v-for="r in row.roles" :key="r.id" style="margin-right: 5px">
              {{ r.role_name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openDialog(row)" v-if="userStore.hasPermission('system:user:edit')">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row.id)" v-if="userStore.hasPermission('system:user:delete')">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadUsers"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="500px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="密码" :prop="isEdit ? '' : 'password'">
          <el-input v-model="form.password" type="password" show-password :placeholder="isEdit ? '留空则不修改' : '请输入密码'" />
        </el-form-item>
        <el-form-item label="角色" prop="role_ids">
          <el-select v-model="form.role_ids" multiple placeholder="请选择角色">
            <el-option v-for="r in allRoles" :key="r.id" :value="r.id" :label="r.role_name" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status">
            <el-option :value="1" label="正常" />
            <el-option :value="0" label="禁用" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { user, role } from '../api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '../stores/user';

const userStore = useUserStore();

const users       = ref([]);
const allRoles    = ref([]);
const total       = ref(0);
const page        = ref(1);
const pageSize    = ref(20);
const tableLoading = ref(false);
const dialogVisible = ref(false);
const isEdit      = ref(false);
const loading     = ref(false);
const formRef     = ref(null);

const form = reactive({
  id: null,
  username: '',
  nickname: '',
  email: '',
  password: '',
  role_ids: [],
  status: 1
});

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称',   trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码',   trigger: 'blur' }]
};

const loadUsers = async () => {
  tableLoading.value = true;
  try {
    const res = await user.getUsers({ page: page.value, pageSize: pageSize.value });
    if (res.code === 200) {
      users.value = res.data.list  || [];
      total.value = res.data.total || 0;
    } else {
      ElMessage.error(res.message || '加载失败');
    }
  } catch (e) {
    ElMessage.error(e.message || '加载失败');
  } finally {
    tableLoading.value = false;
  }
};

const handleSizeChange = () => {
  page.value = 1;
  loadUsers();
};

const loadRoles = async () => {
  const res = await role.getRoles();
  if (res.code === 200) {
    allRoles.value = res.data || [];
  }
};

const openDialog = (row = null) => {
  if (row) {
    isEdit.value = true;
    form.id       = row.id;
    form.username = row.username;
    form.nickname = row.nickname;
    form.email    = row.email || '';
    form.password = '';
    form.role_ids = row.roles ? row.roles.map(r => r.id) : [];
    form.status   = row.status;
  } else {
    isEdit.value = false;
    resetForm();
  }
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        await user.updateUser(form);
        ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
        dialogVisible.value = false;
        loadUsers();
      } catch (e) {
        ElMessage.error(e.message);
      } finally {
        loading.value = false;
      }
    }
  });
};

const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除该用户吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText:  '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await user.deleteUser(id);
      ElMessage.success('删除成功');
      // 若当前页删空了，退回上一页
      if (users.value.length === 1 && page.value > 1) {
        page.value--;
      }
      loadUsers();
    } catch (e) {
      ElMessage.error(e.message);
    }
  }).catch(() => {});
};

const resetForm = () => {
  form.id       = null;
  form.username = '';
  form.nickname = '';
  form.email    = '';
  form.password = '';
  form.role_ids = [];
  form.status   = 1;
};

onMounted(() => {
  loadUsers();
  loadRoles();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
