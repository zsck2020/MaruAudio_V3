import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const files = [
  'src/routes/dubbing/+page.svelte',
  'src/lib/components/dubbing/AudioUploader.svelte',
  'src/lib/components/dubbing/AudioPlayer.svelte',
  'src/lib/components/dubbing/EngineSelector.svelte',
  'src/lib/components/dubbing/LeftBottomBar.svelte',
  'src/lib/components/dubbing/PlayerBar.svelte',
  'src/lib/components/dubbing/PresetLibrary.svelte',
  'src/lib/components/dubbing/TabReferenceAudio.svelte',
  'src/lib/components/dubbing/TextToolbar.svelte',
];

function readUtf8(relativePath: string): string {
  return readFileSync(new URL(`./${relativePath}`, import.meta.url), 'utf8');
}

test('配音页关键文件使用 UTF-8 中文文案', () => {
  for (const relativePath of files) {
    const text = readUtf8(relativePath);
    assert.equal(text.includes('\uFFFD'), false, `${relativePath} 含有替换字符`);
  }

  const page = readUtf8('src/routes/dubbing/+page.svelte');
  assert.match(page, /开始生成|生成配音|导入文案/);

  const uploader = readUtf8('src/lib/components/dubbing/AudioUploader.svelte');
  assert.match(uploader, /上传参考音频|拖拽音频到这里/);
});
