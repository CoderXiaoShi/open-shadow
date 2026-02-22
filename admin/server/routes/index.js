const Router = require('koa-router');
const userController = require('../controllers/userController');
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/auth');

const router = new Router();

// 认证相关路由
router.post('/api/auth/login', userController.login);
router.post('/api/auth/register', userController.register);

// 需要认证的路由
router.use('/api', authMiddleware);

// 用户管理路由
router.get('/api/user/info', userController.getUserInfo);
router.get('/api/users', userController.getUsers);
router.post('/api/users', userController.updateUser);
router.delete('/api/users/:id', userController.deleteUser);

// 文件上传路由
router.post('/api/upload', uploadController.uploadFile);
router.get('/api/files', uploadController.getFiles);
router.delete('/api/files/:fileName', uploadController.deleteFile);

module.exports = router;