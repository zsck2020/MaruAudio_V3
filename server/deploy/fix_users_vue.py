"""Fix Users.vue and api/index.js encoding damage"""
import re

# ===== Fix Users.vue =====
users_fixes = [
    # Template section - missing closing quotes in attributes
    ('label="机器码? value=', 'label="机器码" value='),
    ('个用户?/span>', '个用户</span>'),
    ('用户组?/el-button>', '用户组</el-button>'),
    ('label="用户组? width=', 'label="用户组" width='),
    ('label="机器码? min-width=', 'label="机器码" min-width='),
    ('label="状态? width="70"', 'label="状态" width="70"'),
    ('对话框?-->', '对话框 -->'),
    ('label="用户组?>', 'label="用户组">'),
    ('label="状态?>', 'label="状态">'),
    ('用户组?            </el-alert>', '用户组。\n            </el-alert>'),
    ('到期时间?/span>', '到期时间</span>'),
    ('+30?/el-button>', '+30天</el-button>'),
    ('+90?/el-button>', '+90天</el-button>'),
    ('+1?/el-button>', '+1年</el-button>'),
    ('自定义天）?>', '自定义天数">'),
    ('机器码管?-->', '机器码管理 -->'),
    ('label="机器码? name=', 'label="机器码" name='),
    ('label="机器码? show-overflow', 'label="机器码" show-overflow'),
    ('机器码验?/h5>', '机器码验证</h5>'),
    ('到此用?            </el-alert>', '到此用户\n            </el-alert>'),
    ('中注册?            </el-alert>', '中注册\n            </el-alert>'),
    ('新密码?>', '新密码">'),
    ('新密码? show-password', '新密码" show-password'),
    ('邀请记?-->', '邀请记录 -->'),
    ('label="邀请记? name=', 'label="邀请记录" name='),
    ("'未生成? }", "'未生成' }"),
    ('已邀请人数?>', '已邀请人数">'),
    (' ?/el-descriptions-item>', ' 人</el-descriptions-item>'),
    ('被邀请用户? show-overflow', '被邀请用户" show-overflow'),
    ('label="用户组? width="100"', 'label="用户组" width="100"'),
    ('暂无邀请记? />', '暂无邀请记录" />'),
    ('可提现余额?>', '可提现余额">'),
    ('label="状态? width="80"', 'label="状态" width="80"'),
    ("'已提示?", "'已提现'"),
    ('日志对话框?-->', '日志对话框 -->'),
    # Script section
    ('搜索状态?', '搜索状态'),
    ('搜索占位符?const', '搜索占位符\nconst'),
    ("机器码搜索?,", "机器码搜索',"),
    ('时间显示?const', '时间显示\nconst'),
    ('如果是?Date', '如果是 Date'),
    ('字符串?  if', '字符串\n  if'),
    ('直接返回?  return', '直接返回\n  return'),
    ('格式）?const', '格式）\nconst'),
    ('如果是?Date 对象', '如果是 Date 对象'),
    ('已经?MySQL 格式，直接返回?    if', '已经是 MySQL 格式，直接返回\n    if'),
    ('如果是?ISO 格式，转换?    if', '如果是 ISO 格式，转换\n    if'),
    ('补全时间?    if', '补全时间\n    if'),
    ('传选搜索参数?    const', '传递搜索参数\n    const'),
    ('为空时提示?      if', '为空时提示\n      if'),
    ('机器码列表?  userMachines', '机器码列表\n  userMachines'),
    ('绑定列?  loadUserMachines', '绑定列表\n  loadUserMachines'),
    ('列表失败?, e)', "列表失败', e)"),
    ('记录失败?, e)', "记录失败', e)"),
    ('已增加?${days}', '已增加 ${days}'),
    ('永久会员?)', "永久会员')"),
    ('拦截器处理?  }', '拦截器处理\n  }'),
    ('中注册?)', "中注册')"),
    ('不一致?)', "不一致')"),
    ("密码吗？?, '提示'", "密码吗？', '提示'"),
    ('确定要?{action}', '确定要${action}'),
    ("选择用户组?, '批量设置用户组?,", "选择用户组', '批量设置用户组',"),
    ("选择用户组?,", "选择用户组',"),
    ('下一个?      }', '下一个\n      }'),
    ('已成功更新?${', '已成功更新 ${'),
    ('封禁选中的?${', '封禁选中的 ${'),
    ('已封禁?${', '已封禁 ${'),
    ('解封选中的?${', '解封选中的 ${'),
    ('已解封?${', '已解封 ${'),
    ('发选到期时间?    if', '发送到期时间\n    if'),
]

path1 = r'E:\Exploitation\MaruAudio\MaruAudio_V3\server\admin-frontend\src\views\Users.vue'
with open(path1, 'r', encoding='utf-8') as f:
    content = f.read()
for old, new in users_fixes:
    content = content.replace(old, new)
# Remove consecutive empty lines
content = re.sub(r'\n{3,}', '\n\n', content)
with open(path1, 'w', encoding='utf-8') as f:
    f.write(content)

# Count remaining ?
lines = content.split('\n')
issues = []
for i, line in enumerate(lines, 1):
    s = line.strip()
    if '?' in s:
        # Skip ternary operators and regex
        if '===' in s or '?' in s and ':' in s and ('row.' in s or 'time' in s.lower()):
            continue
        if s.startswith('//') or s.startswith('*'):
            continue
        issues.append(f'L{i}: {s[:120]}')

print(f'Users.vue: {len(issues)} potential issues remaining')
for iss in issues:
    print(iss)

# ===== Fix api/index.js =====
api_fixes = [
    ('请求拦截器?api', '请求拦截器\napi'),
    ('响应拦截器?api', '响应拦截器\napi'),
    ('用户密码?export', '用户密码\nexport'),
    ('邀请记录?export', '邀请记录\nexport'),
    ('绑定列表?export', '绑定列表\nexport'),
    ('机器码?export', '机器码\nexport'),
    ('机器码归属?export', '机器码归属\nexport'),
    ('新版本?export', '新版本\nexport'),
    ('管理员信息?export', '管理员信息\nexport'),
]

path2 = r'E:\Exploitation\MaruAudio\MaruAudio_V3\server\admin-frontend\src\api\index.js'
with open(path2, 'r', encoding='utf-8') as f:
    content2 = f.read()
for old, new in api_fixes:
    content2 = content2.replace(old, new)
content2 = re.sub(r'\n{3,}', '\n\n', content2)
with open(path2, 'w', encoding='utf-8') as f:
    f.write(content2)

print(f'\napi/index.js fixed')
print('Done')
