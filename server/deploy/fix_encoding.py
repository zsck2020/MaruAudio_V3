import os

# Fix Users.vue
path = r'E:\Exploitation\MaruAudio\MaruAudio_V3\server\admin-frontend\src\views\Users.vue'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

fixes = {
    '\ufffd': '',  # Remove all replacement characters
}

# Specific contextual fixes
contextual = [
    ('用户组。', '用户组。'),  # already fixed
    ('+30/el-button>', '+30天</el-button>'),
    ('+90/el-button>', '+90天</el-button>'),
    ('+1/el-button>', '+1年</el-button>'),
    ('机器码管-->', '机器码管理 -->'),
    ('机器码验/h5>', '机器码验证</h5>'),
    ('到此用            </el-alert>', '到此用户            </el-alert>'),
    ('邀请记-->', '邀请记录 -->'),
    ('邀请记 name=', '邀请记录" name='),
    ('暂无邀请记 />', '暂无邀请记录" />'),
    ('人数>{{ userInvites.length }}', '人数">{{ userInvites.length }}'),
    (' /el-descriptions-item>', ' 人</el-descriptions-item>'),
    ('已经MySQL', '已经是MySQL'),
    ('返回    if', '返回\n    if'),
    ('绑定列  loadUserMachines', '绑定列表\n  loadUserMachines'),
]

for old, new in contextual:
    content = content.replace(old, new)

# Remove remaining replacement chars
content = content.replace('\ufffd', '')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

remaining = content.count('\ufffd')
print(f'Users.vue remaining: {remaining}')

# Fix api/index.js
path2 = r'E:\Exploitation\MaruAudio\MaruAudio_V3\server\admin-frontend\src\api\index.js'
with open(path2, 'r', encoding='utf-8') as f:
    content2 = f.read()

content2 = content2.replace('\ufffd', '')

with open(path2, 'w', encoding='utf-8') as f:
    f.write(content2)

print(f'api/index.js remaining: {content2.count(chr(0xFFFD))}')
print('Done')
