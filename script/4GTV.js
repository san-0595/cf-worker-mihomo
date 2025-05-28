import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import { stringify } from 'yaml';

const RULE_URLS = [
  'https://cdn.jsdelivr.net/gh/antn0000/fenliu@main/4GTV.list',
];

const CWD = process.cwd();
const MIHOMO_DIR = path.join(CWD, 'rules/mihomo/4GTV');
const SINGBOX_DIR = path.join(CWD, 'rules/singbox/4GTV');

async function fetchAllRules() {
  const allLines = [];

  for (const url of RULE_URLS) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      const lines = text
        .split('\n')
        .map(l => l.trim())
        .filter(line => line && !line.startsWith('#'));
      allLines.push(...lines);
    } catch (err) {
      console.error(`❌ Failed to fetch ${url}:`, err.message);
    }
  }

  return allLines;
}

async function generate4gtv() {
  const cleanedLines = await fetchAllRules();

  await fs.mkdir(MIHOMO_DIR, { recursive: true });
  await fs.mkdir(SINGBOX_DIR, { recursive: true });

  const domain_suffix = [];
  const domain = [];
  const yamlDomains = [];

  for (const line of cleanedLines) {
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

  const json = {
    version: 3,
    domain_suffix,
    domain,
  };
  const jsonPath = path.join(SINGBOX_DIR, '4GTV.json');
  await fs.writeFile(jsonPath, JSON.stringify(json, null, 2), 'utf8');

  const yamlObject = {
    payload: yamlDomains,
  };
  const yamlPath = path.join(MIHOMO_DIR, '4GTV_Domain.yaml');
  await fs.writeFile(yamlPath, stringify(yamlObject), 'utf8');
}

generate4gtv().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
