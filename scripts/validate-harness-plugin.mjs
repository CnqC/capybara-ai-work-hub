import fs from 'node:fs';
import path from 'node:path';

/**
 * Kiểm định tự động toàn bộ cấu trúc .harness-plugin/, YAML Frontmatter của 6 Capybara Subagents,
 * 7 Max Skills, mẫu File Bàn Giao HANDOFF.md, QA-VERDICT.md và Hồ sơ Trí nhớ dài hạn.
 */
const ROOT = process.cwd();
const PLUGIN_DIR = path.join(ROOT, '.harness-plugin');
const errors = [];

function checkExists(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) {
    errors.push(`Thiếu file bắt buộc trong Hub: ${relPath}`);
    return null;
  }
  return fs.readFileSync(full, 'utf8');
}

function parseFrontmatter(content, fileLabel) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    errors.push(`${fileLabel} thiếu khối YAML Frontmatter chuẩn (--- ... ---).`);
    return null;
  }
  const raw = match[1];
  const fields = {};
  for (const line of raw.split(/\r?\n/)) {
    const kv = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (kv) fields[kv[1]] = kv[2].trim();
  }
  return { raw, fields };
}

console.log('======================================================================');
console.log('  CAPYHUB HARNESS PLUGIN VALIDATOR — FRONTMATTER, AGENTS & MAX SKILLS');
console.log('======================================================================\n');

// 1. Validate plugin.json & rules/AGENTS.md
const pluginJsonRaw = checkExists('.harness-plugin/plugin.json');
if (pluginJsonRaw) {
  try {
    const parsed = JSON.parse(pluginJsonRaw);
    if (!parsed.name || !parsed.version || !parsed.description) {
      errors.push('.harness-plugin/plugin.json thiếu trường name, version hoặc description.');
    }
  } catch (e) {
    errors.push(`.harness-plugin/plugin.json lỗi cú pháp JSON: ${e.message}`);
  }
}

checkExists('.harness-plugin/mcp_config.json');
checkExists('.harness-plugin/hooks.json');
const agentsRule = checkExists('.harness-plugin/rules/AGENTS.md');
if (agentsRule && /C:\/Users\/Admin/i.test(agentsRule)) {
  errors.push('.harness-plugin/rules/AGENTS.md chứa đường dẫn cứng C:/Users/Admin — sẽ lỗi trên máy bạn bè!');
}

// 2. Validate 6 Capybara Subagents Frontmatter
const requiredAgents = [
  'boss-capy-coordinator.md',
  'scribe-capy-wps-doc.md',
  'abacus-capy-data-analyst.md',
  'director-capy-capcut-editor.md',
  'treasurer-capy-finance-coder.md',
  'inspector-capy-continuous-qa.md',
];

for (const agentFile of requiredAgents) {
  const rel = `.harness-plugin/agents/${agentFile}`;
  const content = checkExists(rel);
  if (content) {
    if (/C:\/Users\/Admin/i.test(content)) {
      errors.push(`${rel} chứa đường dẫn cứng C:/Users/Admin!`);
    }
    const fm = parseFrontmatter(content, rel);
    if (fm) {
      for (const reqField of ['name', 'description', 'model', 'role_domain', 'handoff_schema']) {
        if (!fm.fields[reqField] && !fm.raw.includes(`${reqField}:`)) {
          errors.push(`${rel} thiếu trường frontmatter chuẩn: '${reqField}'`);
        }
      }
    }
  }
}

// 3. Validate 7 Max Skills Frontmatter
const requiredSkills = [
  'voice-confirm-blueprint-loop',
  'subagent-handoff-qa-relay',
  'wps-multi-doc-synthesis',
  'data-spreadsheet-insight',
  'capcut-automated-editing',
  'personal-finance-customizer',
  'long-term-style-memory',
];

for (const skillSlug of requiredSkills) {
  const rel = `.harness-plugin/skills/${skillSlug}/SKILL.md`;
  const content = checkExists(rel);
  if (content) {
    if (/C:\/Users\/Admin/i.test(content)) {
      errors.push(`${rel} chứa đường dẫn cứng C:/Users/Admin!`);
    }
    const fm = parseFrontmatter(content, rel);
    if (fm && (!fm.fields.name || !fm.raw.includes('description:'))) {
      errors.push(`${rel} thiếu trường 'name' hoặc 'description' trong YAML Frontmatter.`);
    }
  }
}

// 4. Validate Memory Templates & Handoff Protocol Samples
for (const tpl of [
  '03_HoSo_TriNho_CaNhan/USER-STYLE-DNA.template.md',
  '03_HoSo_TriNho_CaNhan/VOICE-GLOSSARY.template.md',
  '03_HoSo_TriNho_CaNhan/LESSONS-LEARNED.template.md',
  '04_BanGiao_SubAgents/CURRENT-BLUEPRINT.md',
  '04_BanGiao_SubAgents/TASK-01_HANDOFF.md',
  '04_BanGiao_SubAgents/TASK-01_QA-VERDICT.md',
]) {
  const content = checkExists(tpl);
  if (content && tpl.startsWith('04_BanGiao_SubAgents/')) {
    parseFrontmatter(content, tpl);
  }
}

console.log(`✔ Đã kiểm định ${requiredAgents.length} Capybara Subagents & ${requiredSkills.length} Max Skills.`);
if (errors.length > 0) {
  for (const err of errors) console.error(`✖ ${err}`);
  process.exit(1);
}
console.log('✔ Toàn bộ cấu trúc Capybara Harness Plugin, Frontmatter & Handoff Protocol đạt chuẩn 100%!\n');
