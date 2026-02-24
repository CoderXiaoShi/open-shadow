<template>
  <div class="role-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
          <el-button type="primary" @click="openDialog()" v-if="userStore.hasPermission('system:role:add')">新增角色</el-button>
        </div>
      </template>

      <el-table :data="roles" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="role_name" label="角色名称" />
        <el-table-column prop="role_code" label="角色编码" />
        <el-table-column prop="description" label="描述">
          <template #default="{ row }">
            {{ row.description || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="warning" size="small" @click="openPermissionDialog(row)" v-if="userStore.hasPermission('system:role:assign')">权限</el-button>
            <el-button type="primary" size="small" @click="openDialog(row)" v-if="userStore.hasPermission('system:role:edit')">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row.id)" :disabled="row.id === 1" v-if="userStore.hasPermission('system:role:delete')">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
      width="500px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="角色名称" prop="role_name">
          <el-input v-model="form.role_name" />
        </el-form-item>
        <el-form-item label="角色编码" prop="role_code">
          <el-input v-model="form.role_code" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
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

    <el-dialog
      v-model="permissionDialogVisible"
      title="分配权限"
      width="600px"
    >
      <el-tree
        ref="treeRef"
        :data="permissionTree"
        :props="treeProps"
        show-checkbox
        node-key="id"
        :default-checked-keys="checkedPermissions"
      />
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePermissions" :loading="loading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { role, permission } from '../api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '../stores/user';

const userStore = useUserStore();

const roles = ref([]);
const permissionTree = ref([]);
const dialogVisible = ref(false);
const permissionDialogVisible = ref(false);
const isEdit = ref(false);
const loading = ref(false);
const formRef = ref(null);
const treeRef = ref(null);
const currentRole = ref(null);
const checkedPermissions = ref([]);

const treeProps = {
  children: 'children',
  label: 'permission_name'
};

const form = reactive({
  id: null,
  role_name: '',
  role_code: '',
  description: '',
  status: 1
});

const rules = {
  role_name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ],
  role_code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' }
  ]
};

const loadRoles = async () => {
  const res = await role.getRoles();
  if (res.code === 200) {
    roles.value = res.data || [];
  }
};

const loadPermissions = async () => {
  const res = await permission.getPermissionTree();
  if (res.code === 200) {
    permissionTree.value = res.data || [];
  }
};

const openDialog = (row = null) => {
  if (row) {
    isEdit.value = true;
    form.id = row.id;
    form.role_name = row.role_name;
    form.role_code = row.role_code;
    form.description = row.description || '';
    form.status = row.status;
  } else {
    isEdit.value = false;
    form.id = null;
    form.role_name = '';
    form.role_code = '';
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
  checkedPermissions.value = [];

  // 先清空 tree 的勾选状态，避免上一次数据残留
  treeRef.value?.setCheckedKeys([]);

  try {
    const res = await role.getRolePermissions(row.id);
    if (res.code === 200) {
      checkedPermissions.value = res.data || [];
    }
  } catch (e) {
    checkedPermissions.value = [];
  }

  permissionDialogVisible.value = true;

  // default-checked-keys 只在初次挂载生效，需手动同步
  await nextTick();
  treeRef.value?.setCheckedKeys(checkedPermissions.value);
};

const savePermissions = async () => {
  loading.value = true;
  try {
    const checkedNodes = treeRef.value.getCheckedNodes(false, true);
    const permissionIds = checkedNodes.map(n => n.id);
    await role.assignPermissions(currentRole.value.id, permissionIds);
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
