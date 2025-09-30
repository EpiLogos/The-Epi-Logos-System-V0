#!/usr/bin/env node
/*
  Batch PNG optimization for frontend assets.
  - Resizes to sensible caps by filename pattern
  - Quantizes palette and applies high-effort PNG compression
  - Creates a one-time backup of originals per run date
*/

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '..');
const targets = [
  path.join(repoRoot, 'frontend', 'public', 'ui-system'),
  path.join(repoRoot, 'frontend', 'public', 'images'),
];

const today = new Date();
const stamp = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function decideMinSize(file) {
  const base = path.basename(file).toLowerCase();
  if (base.includes('zen-circle')) return 157; // render size
  if (base.includes('account-icon') || base.includes('chat-icon') || base.includes('-icon')) return 128;
  if (base.includes('modal-image')) return 300; // matches epi-png-base
  if (base.includes('-hex')) return 384; // keep some detail but allow reduction
  return 256; // conservative default floor
}

async function optimizePng(file) {
  const buf = await fs.promises.readFile(file);
  const image = sharp(buf, { limitInputPixels: false });
  const meta = await image.metadata();

  const width = meta.width || 0;
  const height = meta.height || 0;
  const longest = Math.max(width, height) || 0;
  const floor = decideMinSize(file);
  const scaleTarget = Number(process.env.SCALE || '0.5'); // half-size by default
  const desired = Math.max(floor, Math.round(longest * scaleTarget));
  const scale = longest > 0 ? Math.min(1, desired / longest) : 1;
  const resized = scale < 1 ? image.resize(Math.round(width*scale), Math.round(height*scale), { fit: 'inside', withoutEnlargement: true }) : image;

  // Gentle compression: keep full color (no palette), max compression effort
  const out = await resized.png({ compressionLevel: 9, palette: false, effort: 10 }).toBuffer();
  if (!process.env.DRY_RUN) {
    await fs.promises.writeFile(file, out);
  }
  const saved = ((buf.length - out.length) / 1024).toFixed(1);
  return { before: buf.length, after: out.length, savedKB: parseFloat(saved) };
}

async function main() {
  let totalBefore = 0, totalAfter = 0, files = 0;
  const only = (process.env.ONLY || '').split(',').map(s => s.trim()).filter(Boolean);
  for (const dir of targets) {
    if (!fs.existsSync(dir)) continue;
    const backupDir = path.join(dir, `_backup_${stamp}`);
    ensureDir(backupDir);

    const entries = await fs.promises.readdir(dir);
    for (const name of entries) {
      if (!name.toLowerCase().endsWith('.png')) continue;
      if (only.length && !only.some(sn => name.includes(sn))) continue;
      if (name.startsWith('_backup_')) continue;
      const file = path.join(dir, name);

      // Skip if already backed up this run
      const backupPath = path.join(backupDir, name);
      if (!fs.existsSync(backupPath)) {
        await fs.promises.copyFile(file, backupPath);
      }

      try {
        const { before, after } = await (async () => await optimizePng(file))();
        totalBefore += before; totalAfter += after; files += 1;
        const pct = (((before - after) / before) * 100).toFixed(1);
        const tag = process.env.DRY_RUN ? 'preview' : 'optimized';
        console.log(`[${tag}] ${path.relative(repoRoot, file)}  ${(before/1024).toFixed(1)}KB → ${(after/1024).toFixed(1)}KB (${pct}%)`);
      } catch (err) {
        console.error(`[skip] ${file}:`, err.message || err);
      }
    }
  }

  const saved = ((totalBefore - totalAfter) / 1024).toFixed(1);
  console.log(`\nOptimized ${files} PNGs. Saved ~${saved} KB total.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
