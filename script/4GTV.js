import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fetch from 'node-fetch';
import { stringify } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));

const RULE_URL = 'https://cdn.jsdelivr.net/gh/antn0000/fenliu@main/4GTV.list';

const OUT_DIR = path.resolve(__dirname, 'rules');
const MIHOMO_DIR = path.join(OUT_DIR, 'mihomo/4GTV');
const SINGBOX_DIR = path.join(OUT_DIR, 'singbox/4GTV');

async function generate4gtv() {
  const res = await fetch(RULE_URL);
  const rawText = await res.text();

  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(line => line && !line.startsWith('#'));

  await fs.mkdir(MIHOMO_DIR, { recursive: true });
  await fs.mkdir(SINGBOX_DIR, { recursive: true });

  // 保存原始 list
  await fs.writeFile(path.join(MIHOMO_DIR, '4GTV.list'), lines.join('\n'), 'utf8');

  const domain_suffix = [];
  const domain = [];
  const yamlDomains = [];

  for (const line of lines) {
    const [type, valueRaw] = line.split(',');
    const value = valueRaw?.trim();
    if (!value) continue;

    if (type === 'DOMAIN-SUFFIX') {
      domain_suffix.push(value);
      yamlDomains.push(`+.${value}`);
    } else if (type === 'DOMAIN') {
      domain.push(value);
      yamlDomains.push(value);
    }
  }

  // 输出 JSON（sing-box）
  const json = {
    version: 3,
    domain_suffix,
    domain,
  };

  await fs.writeFile(
    path.join(SINGBOX_DIR, '4GTV.json'),
    JSON.stringify(json, null, 2),
    'utf8'
  );

  // 输出 YAML（mihomo），使用 yaml 库格式化
  const yamlObject = {
    payload: yamlDomains,
  };

  const yamlText = stringify(yamlObject);
  await fs.writeFile(
    path.join(MIHOMO_DIR, '4GTV_Domain.yaml'),
    yamlText,
    'utf8'
  );
}

generate4gtv().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
