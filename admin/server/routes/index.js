const Router = require('koa-router');
const userController = require('../controllers/userController');
const uploadController = require('../controllers/uploadController');
const roleController = require('../controllers/roleController');
const permissionController = require('../controllers/permissionController');
const materialController = require('../controllers/materialController');
const personaController  = require('../controllers/personaController');
const aiConfigController = require('../controllers/aiConfigController');
const chatController     = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = new Router();

router.post('/api/auth/login', userController.login);
router.post('/api/auth/register', userController.register);

router.use('/api', authMiddleware);

router.post('/api/users', checkPermission('system:user:add'), userController.updateUser);
router.delete('/api/users/:id', checkPermission('system:user:delete'), userController.deleteUser);
router.get('/api/users', userController.getUsers);
router.get('/api/user/info', userController.getUserInfo);

router.post('/api/upload', checkPermission('file:upload'), uploadController.uploadFile);
router.get('/api/files', uploadController.getFiles);
router.delete('/api/files/:fileName', checkPermission('file:delete'), uploadController.deleteFile);

router.post('/api/roles', checkPermission('system:role:add'), roleController.createRole);
router.put('/api/roles/:id', checkPermission('system:role:edit'), roleController.updateRole);
router.delete('/api/roles/:id', checkPermission('system:role:delete'), roleController.deleteRole);
router.get('/api/roles', roleController.getRoles);
router.get('/api/roles/:id', roleController.getRole);
router.get('/api/roles/:id/permissions', roleController.getRolePermissions);
router.post('/api/roles/:id/permissions', checkPermission('system:role:assign'), roleController.assignPermissions);

router.post('/api/permissions', checkPermission('system:menu:add'), permissionController.createPermission);
router.put('/api/permissions/:id', checkPermission('system:menu:edit'), permissionController.updatePermission);
router.delete('/api/permissions/:id', checkPermission('system:menu:delete'), permissionController.deletePermission);
router.get('/api/permissions', permissionController.getPermissions);
router.get('/api/permissions/tree', permissionController.getPermissionTree);
router.get('/api/permissions/:id', permissionController.getPermission);

// ── 素材管理 ─────────────────────────────────────────────────
router.post('/api/materials/upload', materialController.upload);
router.get('/api/materials', materialController.getList);
router.post('/api/materials', materialController.create);
router.put('/api/materials/:id', materialController.update);
router.delete('/api/materials/:id', materialController.delete);

// ── 角色人设 ─────────────────────────────────────────────────
router.get('/api/persona',              personaController.get);
router.put('/api/persona',              personaController.save);
router.get('/api/persona/build-prompt', personaController.buildPrompt);

// ── AI 配置 ──────────────────────────────────────────────────
router.get('/api/ai-config',       aiConfigController.get);
router.put('/api/ai-config',       aiConfigController.save);
router.post('/api/ai-config/test', aiConfigController.test);

// ── 模型测试 ─────────────────────────────────────────────────
router.post('/api/chat', chatController.chat);

module.exports = router;

