#!/usr/bin/env node

import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const argumentsMap = new Map();
let preview = false;

for (let index = 2; index < process.argv.length; index += 1) {
  const value = process.argv[index];
  if (value === '--preview') {
    preview = true;
  } else if (value.startsWith('--')) {
    const key = value.slice(2);
    const next = process.argv[index + 1];
    if (!next || next.startsWith('--')) throw new Error('Missing value for --' + key);
    argumentsMap.set(key, next);
    index += 1;
  } else {
    throw new Error('Unknown argument: ' + value);
  }
}

const csvPath = argumentsMap.get('csv');
const photosPath = argumentsMap.get('photos');
const apiBaseUrl = (argumentsMap.get('api') ?? 'http://localhost:5291').replace(/\/+$/, '');

if (!csvPath || !photosPath) {
  console.log('Usage: node scripts/import-artists.mjs --csv ./artists.csv --photos ./public/artists [--preview] [--api http://localhost:5291]');
  process.exit(1);
}

function parseCsv(text) {
  const input = text.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"' && cell.length === 0) {
      quoted = true;
    } else if (character === ',') {
      row.push(cell);
      cell = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && input[index + 1] === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== '')) rows.push(row);
  if (quoted) throw new Error('CSV contains an unclosed quoted field.');
  if (rows.length < 2) throw new Error('CSV has no artist rows.');

  const headers = rows[0].map((value) => value.trim());
  if (!headers.includes('Name') || !headers.includes('Biography')) {
    throw new Error('CSV must include the Name and Biography columns.');
  }

  return rows.slice(1).map((values, rowIndex) => {
    const data = Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? '').trim()]));
    if (!data.Name) throw new Error('Row ' + (rowIndex + 2) + ' is missing the artist name.');
    return { name: data.Name, biography: data.Biography ?? '', photoFile: data.PhotoFile ?? '' };
  });
}

function normalizeName(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function locatePhoto(row, photoFiles) {
  if (row.photoFile) {
    const candidate = path.resolve(photosPath, row.photoFile);
    try {
      await readFile(candidate);
      return candidate;
    } catch {
      const requestedStem = normalizeName(path.parse(row.photoFile).name);
      const match = photoFiles.find((file) => normalizeName(path.parse(file).name) === requestedStem);
      if (match) return path.resolve(photosPath, match);
      throw new Error("Image '" + row.photoFile + "' for '" + row.name + "' was not found in " + photosPath + '.');
    }
  }

  const match = photoFiles.find((file) => normalizeName(path.parse(file).name) === normalizeName(row.name));
  return match ? path.resolve(photosPath, match) : null;
}

function mimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const types = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
  const type = types[extension];
  if (!type) throw new Error('Unsupported image format: ' + (extension || '(no extension)'));
  return type;
}

async function promptLine(question) {
  const readline = createInterface({ input: stdin, output: stdout });
  try {
    return (await readline.question(question)).trim();
  } finally {
    readline.close();
  }
}

async function promptPassword(question) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    return promptLine(question + ' (input will be visible): ');
  }

  return new Promise((resolve, reject) => {
    stdout.write(question);
    let password = '';
    const onData = (buffer) => {
      for (const character of buffer.toString('utf8')) {
        if (character === '\u0003') {
          cleanup();
          stdout.write('\n');
          reject(new Error('Cancelled.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          cleanup();
          stdout.write('\n');
          resolve(password);
          return;
        }
        if (character === '\u007f' || character === '\b') password = password.slice(0, -1);
        else if (character >= ' ') password += character;
      }
    };
    const cleanup = () => {
      stdin.off('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
    };
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    const message = body?.message ?? body?.title ?? body?.detail ?? ('API returned HTTP ' + response.status);
    throw new Error(message);
  }
  return body;
}

const resolvedCsv = path.resolve(csvPath);
const resolvedPhotos = path.resolve(photosPath);
const rows = parseCsv(await readFile(resolvedCsv, 'utf8'));
const photoFiles = await readdir(resolvedPhotos);
const prepared = [];
for (const row of rows) prepared.push({ ...row, photoPath: await locatePhoto(row, photoFiles) });

if (preview) {
  console.table(prepared.map(({ name, biography, photoPath }) => ({
    Name: name,
    Biography: biography,
    Photo: photoPath ? path.basename(photoPath) : '(no matching photo)',
  })));
  console.log('Preview complete. No changes were sent.');
  process.exit(0);
}

const email = process.env.VISAH_ADMIN_EMAIL ?? await promptLine('Admin email: ');
const password = await promptPassword('Admin password (hidden): ');
const login = await apiRequest(apiBaseUrl + '/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
if (!login?.token) throw new Error('Login response did not contain an access token.');
const headers = { Authorization: 'Bearer ' + login.token };
const existingArtists = await apiRequest(apiBaseUrl + '/api/artists', { headers });
const artistsByName = new Map(existingArtists.map((artist) => [normalizeName(artist.name), artist]));
let created = 0;
let updated = 0;
let photosUploaded = 0;
const errors = [];

for (const row of prepared) {
  try {
    const existing = artistsByName.get(normalizeName(row.name));
    const artistPayload = { name: row.name, biography: row.biography || null, photoUrl: existing?.photoUrl ?? null };
    let artistId;

    if (existing) {
      await apiRequest(apiBaseUrl + '/api/artists/' + existing.id, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(artistPayload),
      });
      artistId = existing.id;
      updated += 1;
    } else {
      const artist = await apiRequest(apiBaseUrl + '/api/artists', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(artistPayload),
      });
      artistId = artist.id;
      created += 1;
    }

    if (row.photoPath) {
      const form = new FormData();
      const image = await readFile(row.photoPath);
      form.set('image', new Blob([image], { type: mimeType(row.photoPath) }), path.basename(row.photoPath));
      await apiRequest(apiBaseUrl + '/api/artists/' + artistId + '/photo', { method: 'POST', headers, body: form });
      photosUploaded += 1;
    } else {
      console.warn("No matching photo for '" + row.name + "'; saved without changing its photo.");
    }
    artistsByName.set(normalizeName(row.name), { id: artistId, ...artistPayload });
  } catch (error) {
    errors.push(row.name + ': ' + error.message);
  }
}

console.log('Import complete: ' + created + ' created, ' + updated + ' updated, ' + photosUploaded + ' photos uploaded.');
if (errors.length) {
  console.warn(errors.length + ' row(s) failed:');
  for (const error of errors) console.warn('- ' + error);
}
