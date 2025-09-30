#!/usr/bin/env node
// Restore PNGs from a chosen _backup_YYYY-MM-DD folder (BACKUP_DATE) or latest if not provided
import fs from 'fs';
import path from 'path';

const targets = [
  path.join('frontend', 'public', 'ui-system'),
  path.join('frontend', 'public', 'images'),
];

function listBackups(dir) {
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const backups = entries
    .filter((e) => e.isDirectory() && e.name.startsWith('_backup_'))
    .map((e) => e.name)
    .sort();
  return backups;
}

let restored = 0;
for (const dir of targets) {
  if (!fs.existsSync(dir)) continue;
  const backups = listBackups(dir) || [];
  if (!backups.length) { console.log(`[info] No backups found in ${dir}`); continue; }
  const tag = process.env.BACKUP_DATE ? `_backup_${process.env.BACKUP_DATE}` : backups[backups.length - 1];
  if (!backups.includes(tag)) {
    console.log(`[warn] Backup ${tag} not found in ${dir}. Available: ${backups.join(', ')}`);
    continue;
  }
  const backupDir = path.join(dir, tag);
  const files = fs.readdirSync(backupDir).filter((f) => f.toLowerCase().endsWith('.png'));
  for (const f of files) {
    const src = path.join(backupDir, f);
    const dst = path.join(dir, f);
    fs.copyFileSync(src, dst);
    console.log(`[restored] ${path.join(dir, f)} from ${tag}`);
    restored++;
  }
}

console.log(`Restored ${restored} files from latest backups.`);
