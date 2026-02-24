/**
 * 重置用户密码脚本
 * 用法: node scripts/reset-password.js <用户名> <新密码>
 * 示例: node scripts/reset-password.js admin admin123
 */

const User = require('../models/user');
const sequelize = require('../config/database');

const [, , username, newPassword] = process.argv;

if (!username || !newPassword) {
  console.error('用法: node scripts/reset-password.js <用户名> <新密码>');
  process.exit(1);
}

(async () => {
  try {
    await sequelize.authenticate();

    // 查询出所有用户
    const users = await User.findAll();
    console.log('所有用户:', JSON.stringify(users, null, 2));

    const user = await User.findOne({ where: { username } });
    if (!user) {
      console.error(`用户 "${username}" 不存在`);
      process.exit(1);
    }

    // 直接赋值，beforeUpdate hook 会自动 bcrypt 加密
    await user.update({ password: newPassword });

    console.log(`✓ 用户 "${username}" 密码已重置成功`);
  } catch (err) {
    console.error('重置失败:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
})();
