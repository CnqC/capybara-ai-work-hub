import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'test-results', 'visual-qa');
fs.mkdirSync(OUT_DIR, { recursive: true });

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Timeout waiting for ${url}`);
}

const server = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['vite', 'preview', '--port', '4179', '--strictPort'],
  { cwd: ROOT, stdio: 'ignore', shell: true }
);

try {
  const url = 'http://localhost:4179/';
  await waitForServer(url);
  const browser = await chromium.launch();

  // 1. Desktop 1920x1080 captures across tabs
  const desktopPage = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await desktopPage.goto(url, { waitUntil: 'networkidle' });
  await desktopPage.screenshot({
    path: path.join(OUT_DIR, '01-desktop-voice-confirm-gate.png'),
    fullPage: true,
  });

  await desktopPage.getByTestId('tab-subagent-qa').click();
  await desktopPage.screenshot({
    path: path.join(OUT_DIR, '02-desktop-subagent-handoff-qa.png'),
    fullPage: true,
  });

  await desktopPage.getByTestId('tab-personal-finance').click();
  await desktopPage.screenshot({
    path: path.join(OUT_DIR, '03-desktop-personal-finance-app.png'),
    fullPage: true,
  });

  // 2. Mobile 390x844 capture
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobilePage.goto(url, { waitUntil: 'networkidle' });
  await mobilePage.screenshot({
    path: path.join(OUT_DIR, '04-mobile-capyhub.png'),
    fullPage: true,
  });

  await browser.close();
  console.log('✔ Captured 4 Playwright Visual QA screenshots in test-results/visual-qa/');
} finally {
  server.kill();
}
