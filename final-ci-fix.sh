#!/bin/bash
# final-ci-fix.sh
# 最终修复所有 CI 问题

set -e

echo "=== 开始最终 CI 修复 ==="

cd /root/museStarlinkpay71

# 1. 确保使用正确的分支
echo "1. 检查分支状态..."
git checkout main
git pull origin main

# 2. 最终修复 ESLint 函数括号空格问题
echo "2. 修复 ESLint 格式问题..."
cat > src/utils.js << 'SCRIPT_EOF'
/**
 * Utility functions for museStarlinkpay71
 */

function isValidIPv4 (ip) {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (typeof ip !== 'string' || !ipv4Regex.test(ip)) return false

  const parts = ip.split('.')
  return parts.every(part => {
    if (!/^\d+$/.test(part)) return false
    const num = Number(part)
    return Number.isInteger(num) && num >= 0 && num <= 255
  })
}

function greet (name = 'world') {
  return "Hello, ${name}! This repo integrates with Starlink."
}

module.exports = {
  isValidIPv4,
  greet
}
SCRIPT_EOF

# 3. 验证修复
echo "3. 验证修复..."
npm run lint
npm test

# 4. 提交最终修复
echo "4. 提交最终修复..."
git add src/utils.js
git commit -m "fix: final ESLint function spacing compliance

- Fixed space-before-function-paren errors in src/utils.js
- All functions now have proper spacing before parentheses
- ESLint rules fully satisfied"

# 5. 推送到 GitHub
echo "5. 推送到 GitHub..."
git push origin main

echo "=== 最终修复完成！ ==="
echo "请访问 https://github.com/San-quan/museStarlinkpay71/actions 查看 CI 状态"
echo "预期结果：所有步骤绿色对勾 ✅"
