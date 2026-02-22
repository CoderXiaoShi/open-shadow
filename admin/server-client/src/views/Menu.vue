<template>
  <div class="menu-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>菜单管理</span>
          <el-button type="primary" @click="openDialog()">新增菜单</el-button>
        </div>
      </template>

      <el-table :data="menus" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="菜单名称" />
        <el-table-column prop="path" label="路径" />
        <el-table-column prop="component" label="组件" />
        <el-table-column prop="icon" label="图标" />
        <el-table-column prop="order" label="排序" width="80" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openDialog(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑菜单' : '新增菜单'"
      width="500px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="路径" prop="path">
          <el-input v-model="form.path" placeholder="/user" />
        </el-form-item>
        <el-form-item label="组件" prop="component">
          <el-input v-model="form.component" placeholder="User.vue" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.icon" placeholder="图标名称" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.order" :min="0" />
        </el-form-item>
        <el-form-item label="父级菜单">
          <el-select v-model="form.parent_id">
            <el-option :value="0" label="顶级菜单" />
            <el-option v-for="m in menus" :key="m.id" :value="m.id" :label="m.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
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
import { menu } from '../api';
import { ElMessage, ElMessageBox } from 'element-plus';

const menus = ref([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const loading = ref(false);
const formRef = ref(null);

const form = reactive({
  id: null,
  name: '',
  path: '',
  component: '',
  icon: '',
  order: 0,
  parent_id: 0,
  status: 1
});

const rules = {
  name: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' }
  ]
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
    form.path = row.path || '';
    form.component = row.component || '';
    form.icon = row.icon || '';
    form.order = row.order || 0;
    form.parent_id = row.parent_id || 0;
    form.status = row.status;
  } else {
    isEdit.value = false;
    form.id = null;
    form.name = '';
    form.path = '';
    form.component = '';
    form.icon = '';
    form.order = 0;
    form.parent_id = 0;
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
          await menu.updateMenu(form.id, form);
        } else {
          await menu.createMenu(form);
        }
        ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
        dialogVisible.value = false;
        loadMenus();
      } catch (e) {
        ElMessage.error(e.message);
      } finally {
        loading.value = false;
      }
    }
  });
};

const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除该菜单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await menu.deleteMenu(id);
      ElMessage.success('删除成功');
      loadMenus();
    } catch (e) {
      ElMessage.error(e.message);
    }
  }).catch(() => {});
};

onMounted(() => {
  loadMenus();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
