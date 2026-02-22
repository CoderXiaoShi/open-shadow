const fs = require('fs');
const path = require('path');
const Log = require('../models/log');
const { logger, errorLogger } = require('../utils/logger');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const uploadController = {
  async uploadFile(ctx) {
    try {
      const file = ctx.request.files?.file;
      if (!file) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '请选择要上传的文件'
        };
        return;
      }

      const fileData = Array.isArray(file) ? file[0] : file;
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substr(2, 9);
      const ext = path.extname(fileData.originalFilename || fileData.name);
      const fileName = `${timestamp}_${randomStr}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      const fileContent = fs.readFileSync(fileData.filepath);
      fs.writeFileSync(filePath, fileContent);

      // 记录上传日志
      await Log.create({
        user_id: ctx.user.id,
        username: ctx.user.username,
        action: '上传文件',
        module: '文件管理',
        ip: ctx.request.ip,
        result: 1,
        message: `上传文件 ${fileData.originalFilename || fileData.name} 成功`
      });

      ctx.body = {
        code: 200,
        message: '文件上传成功',
        data: {
          fileName,
          filePath: `/uploads/${fileName}`,
          originalName: fileData.originalFilename || fileData.name
        }
      };
    } catch (error) {
      errorLogger.error('文件上传失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },

  async getFiles(ctx) {
    try {
      const files = fs.readdirSync(uploadDir);
      const fileList = files.map(fileName => {
        const filePath = path.join(uploadDir, fileName);
        const stats = fs.statSync(filePath);
        return {
          fileName,
          filePath: `/uploads/${fileName}`,
          size: stats.size,
          createdAt: stats.birthtime
        };
      });

      ctx.body = {
        code: 200,
        message: '获取文件列表成功',
        data: fileList
      };
    } catch (error) {
      errorLogger.error('获取文件列表失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },

  async deleteFile(ctx) {
    const { fileName } = ctx.params;
    try {
      const filePath = path.join(uploadDir, fileName);
      if (!fs.existsSync(filePath)) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '文件不存在'
        };
        return;
      }

      fs.unlinkSync(filePath);

      // 记录删除日志
      await Log.create({
        user_id: ctx.user.id,
        username: ctx.user.username,
        action: '删除文件',
        module: '文件管理',
        ip: ctx.request.ip,
        result: 1,
        message: `删除文件 ${fileName} 成功`
      });

      ctx.body = {
        code: 200,
        message: '文件删除成功'
      };
    } catch (error) {
      errorLogger.error('文件删除失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
};

module.exports = uploadController;