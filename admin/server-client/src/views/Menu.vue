<template>
  <div class="permission-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>权限管理</span>
          <el-button type="primary" @click="openDialog()" v-if="userStore.hasPermission('system:menu:add')">新增权限</el-button>
        </div>
      </template>

      <el-table :data="permissions" stripe row-key="id" :tree-props="{ children: 'children' }">
        <el-table-column prop="permission_name" label="权限名称" width="200" />
        <el-table-column prop="permission_code" label="权限编码" width="180" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 1 ? 'primary' : 'success'">
              {{ row.type === 1 ? '菜单' : '按钮' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" />
        <el-table-column prop="component" label="组件" />
        <el-table-column prop="icon" label="图标" width="100" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openDialog(row)" v-if="userStore.hasPermission('system:menu:edit')">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row.id)" v-if="userStore.hasPermission('system:menu:delete')">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑权限' : '新增权限'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="父级权限">
          <el-select v-model="form.parent_id" placeholder="顶级权限" clearable>
            <el-option :value="0" label="顶级权限" />
            <el-option v-for="p in flatPermissions" :key="p.id" :value="p.id" :label="p.permission_name" :disabled="p.id === form.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="权限名称" prop="permission_name">
          <el-input v-model="form.permission_name" />
        </el-form-item>
        <el-form-item label="权限编码" prop="permission_code">
          <el-input v-model="form.permission_code" placeholder="sys:user:list" />
        </el-form-item>
        <el-form-item label="权限类型" prop="type">
          <el-select v-model="form.type">
            <el-option :value="1" label="菜单" />
            <el-option :value="2" label="按钮/接口" />
          </el-select>
        </el-form-item>
        <el-form-item label="路由路径">
          <el-input v-model="form.path" placeholder="/system/user" />
        </el-form-item>
        <el-form-item label="组件路径">
          <el-input v-model="form.component" placeholder="User.vue" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.icon" placeholder="User" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option :value="1" label="启用" />
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
import { ref, reactive, onMounted, computed } from 'vue';
import { permission } from '../api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '../stores/user';

const userStore = useUserStore();

const permissions = ref([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const loading = ref(false);
const formRef = ref(null);

const form = reactive({
  id: null,
  parent_id: 0,
  permission_name: '',
  permission_code: '',
  type: 1,
  path: '',
  component: '',
  icon: '',
  sort: 0,
  status: 1
});

const rules = {
  permission_name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' }
  ],
  permission_code: [
    { required: true, message: '请输入权限编码', trigger: 'blur' }
  ]
};

const flatPermissions = computed(() => {
  const result = [];
  const flatten = (list) => {
    list.forEach(item => {
      result.push({ id: item.id, permission_name: item.permission_name });
      if (item.children && item.children.length) {
        flatten(item.children);
      }
    });
  };
  flatten(permissions.value);
  return result;
});

const loadPermissions = async () => {
  const res = await permission.getPermissionTree();
  if (res.code === 200) {
    permissions.value = res.data || [];
  }
};

const openDialog = (row = null) => {
  if (row) {
    isEdit.value = true;
    form.id = row.id;
    form.parent_id = row.parent_id || 0;
    form.permission_name = row.permission_name;
    form.permission_code = row.permission_code;
    form.type = row.type;
    form.path = row.path || '';
    form.component = row.component || '';
    form.icon = row.icon || '';
    form.sort = row.sort || 0;
    form.status = row.status;
  } else {
    isEdit.value = false;
    form.id = null;
    form.parent_id = 0;
    form.permission_name = '';
    form.permission_code = '';
    form.type = 1;
    form.path = '';
    form.component = '';
    form.icon = '';
    form.sort = 0;
    form.status = 1;
  }
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        if (isEdit.value) {
          await permission.updatePermission(form.id, form);
        } else {
          await permission.createPermission(form);
        }
        ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
        dialogVisible.value = false;
        loadPermissions();
      } catch (e) {
        ElMessage.error(e.message);
      } finally {
        loading.value = false;
      }
    }
  });
};

const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除该权限吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await permission.deletePermission(id);
      ElMessage.success('删除成功');
      loadPermissions();
    } catch (e) {
      ElMessage.error(e.message);
    }
  }).catch(() => {});
};

onMounted(() => {
  loadPermissions();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
