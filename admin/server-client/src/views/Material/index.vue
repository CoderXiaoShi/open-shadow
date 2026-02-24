<template>
  <div class="material-page">

    <!-- ── 新增素材（内联表单） ─────────────────────────────── -->
    <el-card class="add-card" shadow="never">
      <div class="add-title">新增素材</div>

      <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="72px">
        <!-- 类型 -->
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="addForm.type">
            <el-radio-button value="text">文本</el-radio-button>
            <el-radio-button value="image">图片</el-radio-button>
            <el-radio-button value="video">视频</el-radio-button>
            <el-radio-button value="document">文档</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 标题 + 备注 同行 -->
        <div class="form-row">
          <el-form-item label="标题" style="flex:1">
            <el-input v-model="addForm.title" placeholder="选填" />
          </el-form-item>
          <el-form-item label="备注" style="flex:1">
            <el-input v-model="addForm.remark" placeholder="来源描述，如：B站某UP视频评论" />
          </el-form-item>
        </div>

        <!-- 文本内容 -->
        <el-form-item v-if="addForm.type === 'text'" label="内容" prop="content">
          <el-input v-model="addForm.content" type="textarea" :rows="4" placeholder="必填，粘贴文本内容" />
        </el-form-item>

        <!-- 文件上传 -->
        <el-form-item v-else :label="addUploadLabel" prop="pendingFile">
          <div style="width:100%">
            <el-upload
              drag
              :auto-upload="false"
              :limit="1"
              :accept="addAcceptTypes"
              :on-change="handleAddFileChange"
              :on-remove="handleAddFileRemove"
            >
              <el-icon style="font-size:36px;color:#909399"><UploadFilled /></el-icon>
              <div style="margin-top:6px;font-size:13px;color:#606266">拖拽或<em>点击选择</em></div>
              <template #tip>
                <div style="color:#999;font-size:12px">{{ addUploadTip }}</div>
              </template>
            </el-upload>
            <!-- 本地预览 -->
            <div v-if="addLocalPreviewUrl" class="local-preview">
              <img v-if="addForm.type === 'image'" :src="addLocalPreviewUrl" class="preview-img" />
              <video v-else-if="addForm.type === 'video'" :src="addLocalPreviewUrl" controls class="preview-video" />
            </div>
          </div>
        </el-form-item>

        <!-- 文档预提取文本 -->
        <el-form-item v-if="addForm.type === 'document'" label="提取内容">
          <el-input v-model="addForm.content" type="textarea" :rows="3" placeholder="选择文件后自动提取，可修改" />
        </el-form-item>

        <!-- 发布时间 + 排序 + 提交 同行 -->
        <div class="form-row form-row--bottom">
          <el-form-item label="发布时间" style="flex:1">
            <el-date-picker v-model="addForm.published_at" type="datetime" placeholder="选填" style="width:100%" />
          </el-form-item>
          <el-form-item label="排序" style="width:160px">
            <el-input-number v-model="addForm.sort" :min="0" :max="9999" style="width:100%" />
          </el-form-item>
          <el-button style="margin-bottom:18px" @click="resetAddForm">重置</el-button>
          <el-button type="primary" :loading="addSubmitting" style="margin-bottom:18px" @click="handleAddSubmit">
            提交素材
          </el-button>
        </div>
      </el-form>
    </el-card>

    <!-- ── 筛选栏 ──────────────────────────────────────────── -->
    <div class="toolbar">
      <el-input
        v-model="query.keyword"
        placeholder="搜索标题/备注"
        clearable
        style="width:200px"
        @keyup.enter="fetchList"
        @clear="fetchList"
      />
      <el-select v-model="query.type" placeholder="素材类型" clearable style="width:120px" @change="fetchList">
        <el-option label="文本" value="text" />
        <el-option label="图片" value="image" />
        <el-option label="视频" value="video" />
        <el-option label="文档" value="document" />
      </el-select>
      <el-select v-model="query.is_enabled" placeholder="启用状态" clearable style="width:120px" @change="fetchList">
        <el-option label="已启用" :value="1" />
        <el-option label="已禁用" :value="0" />
      </el-select>
      <el-button type="primary" @click="fetchList">查询</el-button>
    </div>

    <!-- ── 表格 ───────────────────────────────────────────── -->
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column type="index" label="#" width="55" />
      <el-table-column label="类型" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="typeTag(row.type).color" size="small">{{ typeTag(row.type).label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="内容摘要" min-width="200">
        <template #default="{ row }">
          <div v-if="row.title" class="row-title">{{ row.title }}</div>
          <div v-if="row.type === 'image' && row.file_url">
            <el-image :src="row.file_url" style="height:40px;border-radius:4px" fit="cover" :preview-src-list="[row.file_url]" />
          </div>
          <div v-else-if="row.type === 'video' && row.file_url" class="excerpt">
            🎬 {{ fileName(row.file_url) }}
            <el-button link type="primary" size="small" @click="openVideoPreview(row.file_url)">预览</el-button>
          </div>
          <div v-else class="excerpt">{{ excerpt(row.content) }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" width="160" show-overflow-tooltip />
      <el-table-column label="启用" width="75" align="center">
        <template #default="{ row }">
          <el-switch
            v-model="row.is_enabled"
            :active-value="1"
            :inactive-value="0"
            @change="toggleEnabled(row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="70" align="center" />
      <el-table-column label="发布时间" width="155">
        <template #default="{ row }">{{ formatDate(row.published_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140" align="center">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="fetchList"
        @size-change="fetchList"
      />
    </div>

    <!-- ── 编辑弹窗 ────────────────────────────────────────── -->
    <el-dialog v-model="editVisible" title="编辑素材" width="620px" @closed="resetEditForm">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="80px">
        <el-form-item label="素材类型">
          <el-tag :type="typeTag(editForm.type).color">{{ typeTag(editForm.type).label }}</el-tag>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="editForm.title" placeholder="选填" />
        </el-form-item>
        <el-form-item v-if="editForm.type === 'text' || editForm.type === 'document'" label="内容" prop="content">
          <el-input v-model="editForm.content" type="textarea" :rows="5" />
        </el-form-item>
        <el-form-item v-if="editForm.type === 'image' && editForm.file_url" label="图片">
          <el-image :src="editForm.file_url" style="height:100px;border-radius:4px" fit="cover" :preview-src-list="[editForm.file_url]" />
        </el-form-item>
        <el-form-item v-if="editForm.type === 'video' && editForm.file_url" label="视频">
          <video :src="editForm.file_url" controls class="preview-video" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" placeholder="来源描述" />
        </el-form-item>
        <el-form-item label="发布时间">
          <el-date-picker v-model="editForm.published_at" type="datetime" style="width:100%" />
        </el-form-item>
        <div class="form-row">
          <el-form-item label="排序" style="flex:1">
            <el-input-number v-model="editForm.sort" :min="0" :max="9999" />
          </el-form-item>
          <el-form-item label="启用" style="flex:1">
            <el-switch v-model="editForm.is_enabled" :active-value="1" :inactive-value="0" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSubmitting" @click="handleEditSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- ── 视频预览弹窗 ──────────────────────────────────────── -->
    <el-dialog v-model="videoPreviewVisible" title="视频预览" width="720px" @closed="videoPreviewUrl = ''">
      <video v-if="videoPreviewUrl" :src="videoPreviewUrl" controls autoplay style="width:100%;border-radius:6px" />
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import { material } from '../../api/index.js';

// ── 列表 ─────────────────────────────────────────────────────
const list = ref([]);
const total = ref(0);
const loading = ref(false);
const query = reactive({ keyword: '', type: '', is_enabled: '', page: 1, pageSize: 20 });

const fetchList = async () => {
  loading.value = true;
  try {
    const params = { ...query };
    if (!params.type) delete params.type;
    if (params.is_enabled === '') delete params.is_enabled;
    const res = await material.getList(params);
    list.value = res.data?.list ?? [];
    total.value = res.data?.total ?? 0;
    // 首次加载后同步 sort 默认值（仅当用户未手动修改时）
    if (addForm.sort === 0) addForm.sort = nextSort();
  } catch (e) {
    ElMessage.error(e.message || '获取列表失败');
  } finally {
    loading.value = false;
  }
};

// ── 启用切换 ──────────────────────────────────────────────────
const toggleEnabled = async (row) => {
  try {
    await material.update(row.id, { is_enabled: row.is_enabled });
    ElMessage.success('已更新');
  } catch (e) {
    ElMessage.error(e.message || '操作失败');
    row.is_enabled = row.is_enabled === 1 ? 0 : 1;
  }
};

// ── 新增表单 ──────────────────────────────────────────────────
const addFormRef = ref(null);
const addSubmitting = ref(false);
const addPendingFile = ref(null);
const addLocalPreviewUrl = ref('');

// 下一个排序值：当前列表最大 sort + 1
const nextSort = () => (list.value.length ? Math.max(...list.value.map(i => i.sort ?? 0)) + 1 : 1);

const defaultAddForm = () => ({
  type: 'text', title: '', content: '', remark: '',
  published_at: new Date(), sort: nextSort()
});
const addForm = reactive(defaultAddForm());

const resetAddForm = () => {
  Object.assign(addForm, defaultAddForm());
  addPendingFile.value = null;
  if (addLocalPreviewUrl.value) { URL.revokeObjectURL(addLocalPreviewUrl.value); addLocalPreviewUrl.value = ''; }
  addFormRef.value?.resetFields();
};

const addRules = computed(() => ({
  type:    [{ required: true }],
  content: addForm.type === 'text'
    ? [{ required: true, message: '内容不能为空', trigger: 'blur' }] : [],
  pendingFile: ['image', 'video'].includes(addForm.type) && !addPendingFile.value
    ? [{ required: true, message: '请选择文件' }] : []
}));

const addUploadLabel = computed(() => ({ image: '图片', video: '视频', document: '文档' }[addForm.type]));
const addAcceptTypes = computed(() => ({ image: 'image/*', video: 'video/*', document: '.txt,.md' }[addForm.type] || '*'));
const addUploadTip   = computed(() => ({
  image:    '支持 JPG / PNG / GIF / WEBP',
  video:    '支持 MP4 / MOV / AVI / MKV',
  document: '支持 .txt / .md，上传后自动提取文本'
}[addForm.type] || ''));

const handleAddFileChange = (uploadFile) => {
  addPendingFile.value = uploadFile.raw;
  // 本地预览
  if (addLocalPreviewUrl.value) URL.revokeObjectURL(addLocalPreviewUrl.value);
  if (addForm.type === 'image' || addForm.type === 'video') {
    addLocalPreviewUrl.value = URL.createObjectURL(uploadFile.raw);
  }
  if (addForm.type === 'document') {
    const reader = new FileReader();
    reader.onload = (e) => { addForm.content = e.target.result; };
    reader.readAsText(uploadFile.raw, 'utf-8');
  }
};
const handleAddFileRemove = () => {
  addPendingFile.value = null;
  if (addLocalPreviewUrl.value) { URL.revokeObjectURL(addLocalPreviewUrl.value); addLocalPreviewUrl.value = ''; }
  if (addForm.type === 'document') addForm.content = '';
};

const handleAddSubmit = async () => {
  await addFormRef.value?.validate();
  addSubmitting.value = true;
  try {
    const payload = { ...addForm };
    if (addPendingFile.value) {
      const fd = new FormData();
      fd.append('file', addPendingFile.value);
      const upRes = await material.upload(fd);
      payload.file_url = upRes.data.file_url;
      if (upRes.data.content && !payload.content) payload.content = upRes.data.content;
    }
    await material.create(payload);
    ElMessage.success('创建成功');
    resetAddForm();
    fetchList();
  } catch (e) {
    ElMessage.error(e.message || '操作失败');
  } finally {
    addSubmitting.value = false;
  }
};

// ── 编辑弹窗 ──────────────────────────────────────────────────
const editVisible = ref(false);
const editSubmitting = ref(false);
const editFormRef = ref(null);
const editingId = ref(null);

const defaultEditForm = () => ({
  type: 'text', title: '', content: '', file_url: '',
  remark: '', published_at: null, sort: 0, is_enabled: 1
});
const editForm = reactive(defaultEditForm());
const editRules = computed(() => ({
  content: (editForm.type === 'text' || editForm.type === 'document')
    ? [{ required: true, message: '内容不能为空', trigger: 'blur' }] : []
}));

const openEdit = (row) => {
  editingId.value = row.id;
  Object.assign(editForm, {
    type:         row.type || 'text',
    title:        row.title || '',
    content:      row.content || '',
    file_url:     row.file_url || '',
    remark:       row.remark || '',
    published_at: row.published_at ? new Date(row.published_at) : null,
    sort:         row.sort ?? 0,
    is_enabled:   row.is_enabled ?? 1
  });
  editVisible.value = true;
};

const resetEditForm = () => {
  editFormRef.value?.resetFields();
  editingId.value = null;
};

const handleEditSubmit = async () => {
  await editFormRef.value?.validate();
  editSubmitting.value = true;
  try {
    await material.update(editingId.value, editForm);
    ElMessage.success('更新成功');
    editVisible.value = false;
    fetchList();
  } catch (e) {
    ElMessage.error(e.message || '操作失败');
  } finally {
    editSubmitting.value = false;
  }
};

// ── 视频预览 ──────────────────────────────────────────────────
const videoPreviewVisible = ref(false);
const videoPreviewUrl = ref('');
const openVideoPreview = (url) => { videoPreviewUrl.value = url; videoPreviewVisible.value = true; };

// ── 删除 ─────────────────────────────────────────────────────
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该素材？', '提示', { type: 'warning' });
    await material.delete(row.id);
    ElMessage.success('已删除');
    fetchList();
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.message || '删除失败');
  }
};

// ── 工具 ─────────────────────────────────────────────────────
const TYPE_MAP = {
  text:     { label: '文本', color: '' },
  image:    { label: '图片', color: 'success' },
  video:    { label: '视频', color: 'warning' },
  document: { label: '文档', color: 'info' }
};
const typeTag    = (t) => TYPE_MAP[t] || { label: t, color: '' };
const excerpt    = (text) => text ? (text.length > 60 ? text.slice(0, 60) + '…' : text) : '—';
const fileName   = (url) => url ? url.split('/').pop() : '';
const formatDate = (val) => val ? new Date(val).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-') : '—';

onMounted(fetchList);
</script>

<style scoped>
.material-page { padding: 16px; display: flex; flex-direction: column; gap: 16px; }

.add-card { border-radius: 8px; }
.add-title { font-size: 15px; font-weight: 600; color: #1e293b; margin-bottom: 16px; }

.form-row { display: flex; gap: 12px; align-items: flex-start; }
.form-row--bottom { align-items: flex-end; }

.toolbar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }

.pagination { display: flex; justify-content: flex-end; }

.row-title { font-weight: 600; margin-bottom: 2px; }
.excerpt { color: #666; font-size: 12px; }
.file-name { font-size: 13px; color: #409eff; }
.local-preview { margin-top: 10px; }
.preview-img { max-height: 160px; border-radius: 6px; display: block; }
.preview-video { max-height: 200px; width: 100%; border-radius: 6px; display: block; }
</style>
