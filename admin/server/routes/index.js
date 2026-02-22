const Router = require('koa-router');
const userController = require('../controllers/userController');
const uploadController = require('../controllers/uploadController');
const roleController = require('../controllers/roleController');
const menuController = require('../controllers/menuController');
const authMiddleware = require('../middleware/auth');

const router = new Router();

router.post('/api/auth/login', userController.login);
router.post('/api/auth/register', userController.register);

router.use('/api', authMiddleware);

router.post('/api/users', userController.updateUser);
router.delete('/api/users/:id', userController.deleteUser);
router.get('/api/users', userController.getUsers);
router.get('/api/user/info', userController.getUserInfo);

router.post('/api/upload', uploadController.uploadFile);
router.get('/api/files', uploadController.getFiles);
router.delete('/api/files/:fileName', uploadController.deleteFile);

router.post('/api/roles', roleController.createRole);
router.put('/api/roles/:id', roleController.updateRole);
router.delete('/api/roles/:id', roleController.deleteRole);
router.get('/api/roles', roleController.getRoles);
router.get('/api/roles/:id', roleController.getRole);
router.get('/api/roles/:id/permissions', roleController.getRolePermissions);
router.post('/api/roles/:id/permissions', roleController.assignPermissions);

router.post('/api/menus', menuController.createMenu);
router.put('/api/menus/:id', menuController.updateMenu);
router.delete('/api/menus/:id', menuController.deleteMenu);
router.get('/api/menus', menuController.getMenus);
router.get('/api/menus/tree', menuController.getMenuTree);
router.get('/api/menus/:id', menuController.getMenu);

module.exports = router;
