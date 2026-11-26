import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
let score = 100;
const issues = [];
const warnings = [];

function penalize(points, msg, isWarning = false) {
  score = Math.max(0, score - points);
  if (isWarning) warnings.push(`⚠ [-${points}đ] ${msg}`);
  else issues.push(`✖ [-${points}đ] ${msg}`);
}

function walkFiles(dir, result = []) {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git', 'playwright-report', 'test-results'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, result);
    else result.push(full);
  }
  return result;
}

console.log('======================================================================');
console.log('  CAPYHUB LOOP DOCTOR — KIEM TOAN VONG LAP, KIEN TRUC & BAO MAT');
console.log('======================================================================\n');

for (const requiredFile of ['STATE.md', 'LOOP.md', 'gate.yaml', 'PRODUCT.md', 'DESIGN.md']) {
  if (!fs.existsSync(path.join(ROOT, requiredFile))) {
    penalize(15, `Thiếu file khung xương bảo trì dài hạn: ${requiredFile}`);
  }
}

const srcFiles = walkFiles(path.join(ROOT, 'src')).filter((f) => /\.(ts|tsx)$/.test(f));
for (const file of srcFiles) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n').length;

  if (lines > 250) {
    penalize(10, `${rel} dài ${lines} dòng (> 250 dòng). Phải tách nhỏ component/module!`);
  }

  if (/:\s*any\b|\bas\s+any\b/.test(content)) {
    penalize(10, `${rel} sử dụng kiểu 'any' — vi phạm cổng kiểm tra kiểu nghiêm ngặt.`);
  }

  const featureMatch = rel.match(/^src\/features\/([^/]+)\//);
  if (featureMatch) {
    const currentFeature = featureMatch[1];
    const crossImports = [...content.matchAll(/from\s+['"]@\/features\/([^/'"]+)\/([^'"]+)['"]/g)];
    for (const m of crossImports) {
      if (m[1] !== currentFeature) {
        penalize(15, `${rel} import chéo trực tiếp ruột của feature '${m[1]}' (${m[2]}).`);
      }
    }
  }

  if (/SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE|sk-[a-zA-Z0-9]{20,}|postgres:\/\//.test(content)) {
    penalize(30, `[BAO MAT NGHIEM TRONG] ${rel} có dấu hiệu chứa khóa bí mật ngay trong mã nguồn!`);
  }

  if (/dangerouslySetInnerHTML|eval\s*\(/.test(content)) {
    penalize(12, `[CANH BAO XSS] ${rel} dùng dangerouslySetInnerHTML hoặc eval().`);
  }
}

console.log(`✔ Đã quét ${srcFiles.length} file mã nguồn TypeScript.`);
if (issues.length === 0 && warnings.length === 0) {
  console.log('✔ Không phát hiện bất kỳ lỗi kiến trúc, vượt rào gate.yaml hay lỗ hổng biên bảo mật nào!');
} else {
  for (const i of issues) console.log(i);
  for (const w of warnings) console.log(w);
}

console.log(`\n=> ĐIỂM SỨC KHỎE & ĐỘ BỀN DỰ ÁN (CAPYHUB DOCTOR SCORE): ${score}/100\n`);
if (issues.length > 0) {
  process.exit(1);
}
