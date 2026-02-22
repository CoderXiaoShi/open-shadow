<template>
  <div class="role-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
          <el-button type="primary" @click="openDialog()">新增角色</el-button>
        </div>
      </template>

      <el-table :data="roles" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" />
        <el-table-column prop="description" label="描述">
          <template #default="{ row }">
            {{ row.description || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="warning" size="small" @click="openPermissionDialog(row)">权限</el-button>
            <el-button type="primary" size="small" @click="openDialog(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row.id)" :disabled="row.id === 1">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
      width="500px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
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

    <el-dialog
      v-model="permissionDialogVisible"
      title="分配权限"
      width="500px"
    >
      <div class="permission-tree">
        <el-checkbox
          v-for="menu in menus"
          :key="menu.id"
          v-model="selectedMenus"
          :label="menu.id"
        >
          {{ menu.name }}
        </el-checkbox>
      </div>
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePermissions" :loading="loading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { role, menu } from '../api';
import { ElMessage, ElMessageBox } from 'element-plus';

const roles = ref([]);
const menus = ref([]);
const dialogVisible = ref(false);
const permissionDialogVisible = ref(false);
const isEdit = ref(false);
const loading = ref(false);
const formRef = ref(null);
const currentRole = ref(null);
const selectedMenus = ref([]);

const form = reactive({
  id: null,
  name: '',
  description: '',
  status: 1
});

const rules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ]
};

const loadRoles = async () => {
  const res = await role.getRoles();
  if (res.code === 200) {
    roles.value = res.data || [];
  }
};

const loadMenus = async () => {
  const res = await menu.getMenus();
  if (res.code === 200) {
    menus.value = res.data || [];
  }
};

const openDialog = (row = null) => {
  if (row) {
    isEdit.value = true;
    form.id = row.id;
    form.name = row.name;
    form.description = row.description || '';
    form.status = row.status;
  } else {
    isEdit.value = false;
    form.id = null;
    form.name = '';
    form.description = '';
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
          await role.updateRole(form.id, form);
        } else {
          await role.createRole(form);
        }
        ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
        dialogVisible.value = false;
        loadRoles();
      } catch (e) {
        ElMessage.error(e.message);
      } finally {
        loading.value = false;
      }
    }
  });
};

const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除该角色吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await role.deleteRole(id);
      ElMessage.success('删除成功');
      loadRoles();
    } catch (e) {
      ElMessage.error(e.message);
    }
  }).catch(() => {});
};

const openPermissionDialog = async (row) => {
  currentRole.value = row;
  try {
    const res = await role.getRolePermissions(row.id);
    if (res.code === 200) {
      selectedMenus.value = res.data || [];
    }
  } catch (e) {
    selectedMenus.value = [];
  }
  permissionDialogVisible.value = true;
};

const savePermissions = async () => {
  loading.value = true;
  try {
    await role.assignPermissions(currentRole.value.id, selectedMenus.value);
    ElMessage.success('权限分配成功');
    permissionDialogVisible.value = false;
  } catch (e) {
    ElMessage.error(e.message);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadRoles();
  loadMenus();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.permission-tree {
  max-height: 400px;
  overflow-y: auto;
}

.permission-tree .el-checkbox {
  display: block;
  margin: 10px 0;
}
</style>
