<script>
  import { onMount } from 'svelte';
  import { getSettings, updateSettings, testDashScopeApi, uploadFile } from '$lib/api';
  import logger from '$lib/utils/logger';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
  import Input from '$lib/components/Input.svelte';
  import Message from '$lib/components/Message';
  
  let registerForm = $state({
    registration_enabled: true,
    machine_code_limit: 1,
    machine_change_cooldown: 30,
    login_fail_limit: 5,
    login_lock_duration: 30
  });
  
  let contentForm = $state({
    disclaimer: '',
    support_qrcode_url: '',
    group_join_url: '',
    tutorial_url: '',
    donate_url: ''
  });
  
  let cloudApiForm = $state({
    dashscope_api_key: ''
  });
  
  let testingCloudApi = $state(false);
  
  async function loadSettings() {
    try {
      const res = await getSettings();
      if (res.data) {
        // 加载注册控制设置
        registerForm.registration_enabled = res.data.registration_enabled === '1' || res.data.registration_enabled === true;
        registerForm.machine_code_limit = parseInt(res.data.machine_code_limit) || 1;
        registerForm.machine_change_cooldown = parseInt(res.data.machine_change_cooldown) || 30;
        registerForm.login_fail_limit = parseInt(res.data.login_fail_limit) || 5;
        registerForm.login_lock_duration = parseInt(res.data.login_lock_duration) || 30;
        // 加载用户条款与客服设置
        contentForm.disclaimer = res.data.disclaimer || '';
        contentForm.support_qrcode_url = res.data.support_qrcode_url || '';
        contentForm.group_join_url = res.data.group_join_url || '';
        contentForm.tutorial_url = res.data.tutorial_url || '';
        contentForm.donate_url = res.data.donate_url || '';
        // 加载云端 API 设置
        cloudApiForm.dashscope_api_key = res.data.dashscope_api_key || '';
      }
    } catch (e) {
      logger.error('加载设置失败', e);
    }
  }
  
  async function saveRegisterSettings() {
    try {
      await updateSettings({
        registration_enabled: registerForm.registration_enabled ? '1' : '0',
        machine_code_limit: String(registerForm.machine_code_limit),
        machine_change_cooldown: String(registerForm.machine_change_cooldown),
        login_fail_limit: String(registerForm.login_fail_limit),
        login_lock_duration: String(registerForm.login_lock_duration)
      });
      Message.success('保存成功');
    } catch (e) {
      // 错误已在拦截器处理
    }
  }
  
  async function saveContentSettings() {
    try {
      await updateSettings({
        disclaimer: contentForm.disclaimer,
        support_qrcode_url: contentForm.support_qrcode_url,
        group_join_url: contentForm.group_join_url,
        tutorial_url: contentForm.tutorial_url,
        donate_url: contentForm.donate_url
      });
      Message.success('保存成功');
    } catch (e) {
      Message.error('保存失败');
    }
  }
  
  function loadDefaultDisclaimer() {
    contentForm.disclaimer = `《丸子配音》免责条款申明

生效日期：2025年1月26日 | 版本：2.0

重要提示：在使用《丸子配音》软件及相关服务前，请您务必审慎阅读、充分理解以下免责条款。点击"同意"或继续使用本软件即表示您已阅读、理解并同意接受以下全部条款的约束。如您不同意任何条款，请立即停止使用本软件。

一、服务性质声明

1.1 本软件是一款基于人工智能技术的配音辅助工具，提供文本转语音、语音克隆等AIGC功能。本软件仅提供技术服务，不对用户使用本软件生成的任何内容承担责任。

1.2 本软件生成的所有音频内容均由人工智能模型自动合成，仅用于体验与展示模型效果，其内容不代表开发者/运营方的任何立场、观点或建议。

二、用户行为规范与责任

2.1 用户承诺在使用本软件时遵守中华人民共和国相关法律法规，包括但不限于《中华人民共和国著作权法》《中华人民共和国民法典》《互联网信息服务深度合成管理规定》等。

2.2 用户严禁利用本软件从事以下行为：
• 制作、复制、传播违反宪法和法律的内容；
• 制作、传播虚假信息、诽谤他人、侵犯他人名誉权；
• 未经授权使用他人声音进行克隆、模仿或深度伪造；
• 侵犯他人著作权、商标权、专利权、肖像权、姓名权等合法权益；
• 制作用于欺诈、诈骗或其他违法犯罪活动的内容；
• 其他违反法律法规或公序良俗的行为。

2.3 用户因违反上述规定而产生的一切法律责任，由用户自行承担，与本软件开发者/运营方无关。

三、知识产权与版权声明

3.1 用户输入素材的版权责任：用户保证其上传、输入的所有文本、音频等素材均为用户合法拥有或已获得合法授权。因用户输入侵权素材而导致的任何法律纠纷，由用户自行承担全部责任。

3.2 生成内容的版权风险：
• 本软件生成的音频内容可能与既有作品存在相似性，本软件不对生成内容的原创性、独创性作任何保证；
• 用户在将生成内容用于商业用途前，应自行进行版权核查，确保不侵犯任何第三方权益；
• 因用户使用生成内容而引发的任何知识产权纠纷、侵权索赔或法律诉讼，均由用户自行承担全部法律责任和经济赔偿，开发者/运营方不承担任何连带责任。

3.3 样音库版权声明：本软件提供的演示样音仅供功能展示和技术演示使用，不构成任何商业授权。用户在使用任何样音进行商业用途前，必须自行确认版权归属并获得相应授权，因使用样音导致的任何侵权责任由用户自行承担。

四、语音克隆特别条款

4.1 授权要求：用户使用语音克隆功能时，必须事先获得原声权利人的明确书面授权。用户应保留相关授权证明，以备核查。

4.2 禁止行为：严禁使用本软件克隆公众人物、名人、政治人物或任何未经授权的第三方声音。

4.3 责任承担：因未经授权使用他人声音进行克隆、传播或商业使用而导致的任何法律责任、侵权纠纷、行政处罚或刑事责任，均由用户自行承担，与本软件开发者/运营方无关。

4.4 深度合成标识：根据《互联网信息服务深度合成管理规定》，用户在公开传播使用本软件生成的内容时，应当以显著方式标识该内容为人工智能生成，不得误导公众。

五、技术局限性声明

5.1 本软件基于人工智能技术，无法保证生成内容的准确性、完整性、真实性或适用性。

5.2 生成内容可能存在发音错误、语调不自然、内容偏差等技术局限，用户应自行判断和核实。

5.3 用户不应将本软件生成的内容视为专业建议（如医疗、法律、金融建议）。

六、责任限制

6.1 在适用法律允许的最大范围内，开发者/运营方不对因使用或无法使用本软件造成的任何直接、间接、附带、特殊或后果性损失承担责任，包括但不限于利润损失、数据丢失、商誉损失等。

6.2 对于因自然灾害、战争、政府行为、黑客攻击、网络故障、软件BUG、电信故障等不可抗力或第三方原因导致的服务中断或数据丢失，开发者/运营方不承担责任。

6.3 本软件按"现状"提供，不作任何明示或暗示的保证，包括但不限于适销性、特定用途适用性、不侵权等保证。

七、隐私保护

7.1 我们收集的信息包括：邮箱地址、密码（加密存储）、机器码（用于设备绑定）、使用数据（用于改进服务）。

7.2 我们采用行业标准的加密技术保护您的数据，不会出售您的个人信息给第三方。

7.3 我们不会上传、存储或使用您通过本软件生成的任何音频内容，所有生成内容仅在您的本地设备处理。

八、条款变更

8.1 开发者/运营方保留随时修改本免责条款的权利，修改后的条款将在本软件内公布。

8.2 如您在条款修改后继续使用本软件，即视为您已接受修改后的条款。

九、法律适用与争议解决

9.1 本免责条款的订立、执行和解释及争议的解决均应适用中华人民共和国法律。

9.2 因本免责条款或使用本软件产生的任何争议，双方应友好协商解决；协商不成的，任何一方均可向开发者/运营方所在地有管辖权的人民法院提起诉讼。

十、其他

10.1 本免责条款构成用户与开发者/运营方之间关于使用本软件的完整协议。

10.2 本免责条款的任何条款被认定为无效或不可执行，不影响其他条款的效力。

10.3 开发者/运营方未行使或延迟行使本免责条款项下的任何权利，不构成对该权利的放弃。

用户确认：点击"同意"或继续使用本软件，即表示用户已完整阅读并理解本免责条款的全部内容，同意受其约束，并承诺遵守相关法律法规。

© 2025 丸子配音 . All Rights Reserved.`;
    Message.success('已加载客户端默认免责条款');
  }
  
  async function saveCloudApiSettings() {
    try {
      await updateSettings({
        dashscope_api_key: cloudApiForm.dashscope_api_key
      });
      Message.success('云端 API 配置已保存');
    } catch (e) {
      Message.error('保存失败');
    }
  }
  
  async function testCloudApi() {
    if (!cloudApiForm.dashscope_api_key) {
      Message.error('请先配置 API Key');
      return;
    }
    
    testingCloudApi = true;
    try {
      await testDashScopeApi({ api_key: cloudApiForm.dashscope_api_key });
      Message.success('API Key 验证成功');
    } catch (e) {
      // 错误已在拦截器处理
    } finally {
      testingCloudApi = false;
    }
  }
  
  function beforeQrcodeUpload(file) {
    const isImage = file.type.startsWith('image/');
    const isLt2M = file.size / 1024 / 1024 < 2;
    
    if (!isImage) {
      Message.error('只能上传图片文件');
      return false;
    }
    if (!isLt2M) {
      Message.error('图片大小不能超过 2MB');
      return false;
    }
    return true;
  }
  
  async function uploadQrcode(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!beforeQrcodeUpload(file)) {
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'qrcode');
      
      const res = await uploadFile(formData);
      if (res.data?.url) {
        contentForm.support_qrcode_url = res.data.url;
        // 自动保存设置
        await saveContentSettings();
        Message.success('上传成功');
      }
    } catch (e) {
      // 错误已在拦截器处理
    }
    
    // 清空 input
    event.target.value = '';
  }
  
  onMount(() => {
    loadSettings();
  });
</script>

<div>
  <!-- 云端 API 配置 -->
  <Card title="云端 API 配置" style="margin-bottom: 20px;">
    <div style="background: #e6f7ff; border: 1px solid #91d5ff; border-radius: 4px; padding: 12px; margin-bottom: 16px;">
      <div style="font-weight: 500; margin-bottom: 8px;">阿里云百炼 DashScope API</div>
      <p style="margin: 8px 0 0 0; line-height: 1.8;">
        用于云端 TTS 语音合成，获取 API Key：
        <a href="https://help.aliyun.com/zh/model-studio/get-api-key" target="_blank" style="color: #1890ff;">阿里云百炼控制台</a>
      </p>
    </div>
    
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div>
        <label for="software-dashscope-api-key" style="display: block; margin-bottom: 8px; font-weight: 500;">DashScope API Key</label>
        <Input
          id="software-dashscope-api-key"
          type="password"
          bind:value={cloudApiForm.dashscope_api_key}
          placeholder="sk-xxxxxxxxxxxxxxxx"
          style="width: 400px;"
        />
      </div>
      
      <div style="display: flex; gap: 10px;">
        <Button type="primary" onClick={saveCloudApiSettings}>保存配置</Button>
        <Button onClick={testCloudApi} loading={testingCloudApi}>测试连接</Button>
      </div>
    </div>
  </Card>
  
  <!-- 注册控制 -->
  <Card title="注册控制" style="margin-bottom: 20px;">
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div>
        <label style="display: flex; align-items: center; gap: 8px;">
          <input
            type="checkbox"
            bind:checked={registerForm.registration_enabled}
            style="width: 16px; height: 16px; cursor: pointer;"
          />
          <span style="font-weight: 500;">开启注册</span>
        </label>
        <span style="margin-left: 24px; color: #666; font-size: 14px;">
          {registerForm.registration_enabled ? '允许新用户注册' : '禁止新用户注册'}
        </span>
      </div>
      
      <div>
        <label for="software-machine-code-limit" style="display: block; margin-bottom: 8px; font-weight: 500;">机器码注册限制</label>
        <Input
          id="software-machine-code-limit"
          type="number"
          bind:value={registerForm.machine_code_limit}
          min="1"
          max="10"
          style="width: 180px;"
        />
        <span style="margin-left: 12px; color: #666;">个账号/机器码</span>
      </div>
      
      <div>
        <label for="software-machine-change-cooldown" style="display: block; margin-bottom: 8px; font-weight: 500;">机器码更换冷却</label>
        <Input
          id="software-machine-change-cooldown"
          type="number"
          bind:value={registerForm.machine_change_cooldown}
          min="1"
          max="365"
          style="width: 180px;"
        />
        <span style="margin-left: 12px; color: #666;">天</span>
      </div>
      
      <div>
        <label for="software-login-fail-limit" style="display: block; margin-bottom: 8px; font-weight: 500;">登录失败锁定</label>
        <Input
          id="software-login-fail-limit"
          type="number"
          bind:value={registerForm.login_fail_limit}
          min="3"
          max="20"
          style="width: 180px;"
        />
        <span style="margin-left: 12px; color: #666;">次后锁定</span>
      </div>
      
      <div>
        <label for="software-login-lock-duration" style="display: block; margin-bottom: 8px; font-weight: 500;">登录锁定时长</label>
        <Input
          id="software-login-lock-duration"
          type="number"
          bind:value={registerForm.login_lock_duration}
          min="5"
          max="1440"
          style="width: 180px;"
        />
        <span style="margin-left: 12px; color: #666;">分钟</span>
      </div>
      
      <div>
        <Button type="primary" onClick={saveRegisterSettings}>保存配置</Button>
      </div>
    </div>
  </Card>
  
  <!-- 免责条款申明与客服设置 -->
  <Card title="免责条款申明与客服">
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div>
        <label for="software-disclaimer" style="display: block; margin-bottom: 8px; font-weight: 500;">免责条款申明</label>
        <div style="width: 600px;">
          <textarea
            id="software-disclaimer"
            bind:value={contentForm.disclaimer}
            placeholder="请输入免责条款内容"
            rows="12"
            style="width: 100%; padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px; font-family: inherit; resize: vertical;"
          ></textarea>
          <div style="margin-top: 8px; display: flex; gap: 8px; align-items: center;">
            <Button size="small" onClick={loadDefaultDisclaimer}>加载客户端默认免责条款</Button>
            <span style="color: #999; font-size: 12px;">修改后客户端将同步显示此内容</span>
          </div>
        </div>
      </div>
      
      <div style="height: 1px; background: #e8e8e8; margin: 16px 0;"></div>
      
      <div>
        <div style="display: block; margin-bottom: 8px; font-weight: 500;">客服二维码</div>
        <div>
          <div class="qrcode-uploader">
            {#if contentForm.support_qrcode_url}
              <div class="qrcode-preview">
                <img src={contentForm.support_qrcode_url} alt="客服二维码" style="width: 100%; height: 100%; object-fit: contain;" />
                <div class="qrcode-overlay">
                  <span>更换</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onchange={uploadQrcode}
                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;"
                />
              </div>
            {:else}
              <label class="qrcode-placeholder">
                <span style="font-size: 28px; margin-bottom: 8px;">+</span>
                <span>上传二维码</span>
                <input
                  type="file"
                  accept="image/*"
                  onchange={uploadQrcode}
                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;"
                />
              </label>
            {/if}
          </div>
          <div style="color: #999; font-size: 12px; margin-top: 8px;">点击上传客服微信二维码，支持 JPG、PNG 格式，大小不超过 2MB</div>
        </div>
      </div>
      
      <div>
        <label for="software-group-join-url" style="display: block; margin-bottom: 8px; font-weight: 500;">售后群链接</label>
        <Input
          id="software-group-join-url"
          bind:value={contentForm.group_join_url}
          placeholder="QQ群或微信群链接"
          style="width: 400px;"
        />
        <div style="color: #999; font-size: 12px; margin-top: 4px;">对应客户端左侧"售后群"菜单</div>
      </div>
      
      <div>
        <label for="software-tutorial-url" style="display: block; margin-bottom: 8px; font-weight: 500;">使用教程链接</label>
        <Input
          id="software-tutorial-url"
          bind:value={contentForm.tutorial_url}
          placeholder="使用教程链接"
          style="width: 400px;"
        />
        <div style="color: #999; font-size: 12px; margin-top: 4px;">对应客户端左侧"使用教程"菜单</div>
      </div>
      
      <div>
        <label for="software-donate-url" style="display: block; margin-bottom: 8px; font-weight: 500;">推广赚钱链接</label>
        <Input
          id="software-donate-url"
          bind:value={contentForm.donate_url}
          placeholder="推广赚钱页面链接"
          style="width: 400px;"
        />
        <div style="color: #999; font-size: 12px; margin-top: 4px;">对应客户端左侧"推广赚钱"菜单</div>
      </div>
      
      <div>
        <Button type="primary" onClick={saveContentSettings}>保存设置</Button>
      </div>
    </div>
  </Card>
</div>

<style>
  .qrcode-uploader {
    width: 120px;
    height: 120px;
    flex-shrink: 0;
  }
  
  .qrcode-preview {
    width: 120px;
    height: 120px;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    cursor: pointer;
  }
  
  .qrcode-preview:hover .qrcode-overlay {
    opacity: 1;
  }
  
  .qrcode-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  .qrcode-overlay span:first-child {
    font-size: 24px;
    margin-bottom: 4px;
  }
  
  .qrcode-placeholder {
    width: 120px;
    height: 120px;
    border: 1px dashed #ddd;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #999;
    cursor: pointer;
    transition: border-color 0.3s;
    position: relative;
  }
  
  .qrcode-placeholder:hover {
    border-color: #409eff;
    color: #409eff;
  }
  
  .qrcode-placeholder span:first-child {
    font-size: 28px;
    margin-bottom: 8px;
  }
</style>
