#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { emitKeypressEvents } from 'node:readline';
import { stdin, stdout } from 'node:process';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = parseArgs(process.argv.slice(2));

function parseArgs(values) {
  const parsed = { preview: false };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === '--preview') parsed.preview = true;
    else if (value.startsWith('--')) parsed[value.slice(2)] = values[++index];
    else throw new Error(`Argumento desconhecido: ${value}`);
  }
  return parsed;
}

function findClosing(source, start, opening, closing) {
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === "'" || char === '"' || char === '`') quote = char;
    else if (char === opening) depth += 1;
    else if (char === closing && --depth === 0) return index;
  }
  throw new Error(`Não encontrei o fechamento de ${opening} no arquivo.`);
}

function readQuotedValue(source, field) {
  const match = new RegExp(`\\b${field}\\s*:\\s*(['"\\x60])`).exec(source);
  if (!match) return '';
  const quote = match[1];
  const start = match.index + match[0].length;
  let value = '';
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (escaped) {
      value += char === 'n' ? '\n' : char === 'r' ? '\r' : char;
      escaped = false;
    } else if (char === '\\') escaped = true;
    else if (char === quote) return value;
    else value += char;
  }
  return value;
}

function readNumericValue(source, field) {
  const match = new RegExp(`\\b${field}\\s*:\\s*(\\d+)`).exec(source);
  return match ? Number(match[1]) : null;
}

function readTracks(source) {
  const match = /\btracks\s*:\s*\[/.exec(source);
  if (!match) return [];
  const open = source.indexOf('[', match.index);
  const close = findClosing(source, open, '[', ']');
  const body = source.slice(open + 1, close);
  const tracks = [];
  let objectStart = -1;
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === "'" || char === '"' || char === '`') quote = char;
    else if (char === '{') {
      if (depth === 0) objectStart = index;
      depth += 1;
    } else if (char === '}' && depth > 0) {
      depth -= 1;
      if (depth === 0) {
        const entry = body.slice(objectStart, index + 1);
        const title = readQuotedValue(entry, 'title').trim();
        if (title) tracks.push({ title, genreId: readNumericValue(entry, 'genreId'), moodId: readNumericValue(entry, 'moodId') });
      }
    }
  }
  if (tracks.length) return tracks;

  const quoted = /(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g;
  for (const item of body.matchAll(quoted)) {
    const quote = item[1];
    let name = item[2];
    if (quote === "'") name = name.replace(/\\'/g, "'");
    name = name.replace(/\\\\/g, '\\').trim();
    if (name) tracks.push({ title: name, genreId: null, moodId: null });
  }
  return tracks;
}

const portugueseMonths = new Map([
  ['janeiro', '01'], ['fevereiro', '02'], ['março', '03'], ['marco', '03'], ['abril', '04'],
  ['maio', '05'], ['junho', '06'], ['julho', '07'], ['agosto', '08'], ['setembro', '09'],
  ['outubro', '10'], ['novembro', '11'], ['dezembro', '12'],
]);

function normalizeDate(value) {
  const date = value.trim().toLocaleLowerCase('pt-BR');
  if (!date) return null;
  const full = date.match(/^(\d{1,2})\s+de\s+([\p{L}]+)\s+de\s+(\d{4})$/u);
  if (full) {
    const month = portugueseMonths.get(full[2]);
    return month ? `${full[3]}-${month}-${full[1].padStart(2, '0')}` : null;
  }
  const monthYear = date.match(/^([\p{L}]+)\s+de\s+(\d{4})$/u);
  if (monthYear) {
    const month = portugueseMonths.get(monthYear[1]);
    return month ? `${monthYear[2]}-${month}-01` : null;
  }
  const year = date.match(/^(\d{4})$/);
  return year ? `${year[1]}-01-01` : null;
}

function titleCaseExport(name) {
  return name
    .replace(/Albums$/, '')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .replace(/(^|\s)([a-z])/g, (_, space, letter) => `${space}${letter.toUpperCase()}`)
    .replace(/\bXcx\b/i, 'XCX')
    .replace(/\bBk\b/i, 'BK')
    .trim();
}

function parsePastedFile(source) {
  const exports = /export\s+const\s+(\w+Albums)\s*(?::\s*ArtistAlbum\[\])?\s*=\s*\[/g;
  const albums = [];
  for (const found of source.matchAll(exports)) {
    const open = source.indexOf('[', found.index + found[0].length - 1);
    const close = findClosing(source, open, '[', ']');
    const body = source.slice(open + 1, close);
    let objectStart = -1;
    let depth = 0;
    let quote = '';
    let escaped = false;
    for (let index = 0; index < body.length; index += 1) {
      const char = body[index];
      if (quote) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === quote) quote = '';
        continue;
      }
      if (char === "'" || char === '"' || char === '`') quote = char;
      else if (char === '{') {
        if (depth === 0) objectStart = index;
        depth += 1;
      } else if (char === '}' && depth > 0) {
        depth -= 1;
        if (depth === 0) {
          const entry = body.slice(objectStart, index + 1);
          const title = readQuotedValue(entry, 'title').trim();
          const tracks = readTracks(entry);
          if (title && tracks.length) {
            const releaseDate = readQuotedValue(entry, 'releaseDate');
            albums.push({
              artist: titleCaseExport(found[1]),
              artistId: readNumericValue(entry, 'artistId'),
              title,
              releaseDate: normalizeDate(releaseDate),
              tracks,
            });
          }
        }
      }
    }
  }
  return albums;
}

function normalizeName(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function slug(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function placeholderSvg(artist, album) {
  const hash = createHash('sha256').update(`${artist}-${album}`).digest();
  const hue = hash.readUInt16BE(0) % 360;
  const hue2 = (hue + 42 + hash[2] % 60) % 360;
  const safeArtist = escapeXml(artist);
  const safeAlbum = escapeXml(album);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(${hue} 42% 30%)"/><stop offset="1" stop-color="hsl(${hue2} 56% 62%)"/></linearGradient><radialGradient id="v"><stop offset="0.35" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#080817" stop-opacity=".3"/></radialGradient></defs><rect width="800" height="800" fill="url(#g)"/><circle cx="630" cy="180" r="250" fill="#fff" opacity=".09"/><circle cx="155" cy="670" r="310" fill="#fff" opacity=".07"/><rect width="800" height="800" fill="url(#v)"/><text x="64" y="610" fill="#fff" font-family="Arial,sans-serif" font-size="28" letter-spacing="5" opacity=".82">${safeArtist.toUpperCase()}</text><text x="64" y="680" fill="#fff" font-family="Arial,sans-serif" font-size="54" font-weight="700">${safeAlbum.slice(0, 24)}</text><text x="64" y="730" fill="#fff" font-family="Arial,sans-serif" font-size="18" letter-spacing="4" opacity=".76">CAPA PROVISÓRIA</text></svg>`;
}

function escapeXml(value) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);
}

async function askHidden(promptText) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    const prompt = readline.createInterface({ input: stdin, output: stdout });
    const value = await prompt.question(promptText);
    prompt.close();
    return value;
  }
  emitKeypressEvents(stdin);
  stdin.setRawMode(true);
  stdin.resume();
  stdout.write(promptText);
  return new Promise((resolve, reject) => {
    let value = '';
    const onKeypress = (character, key = {}) => {
      if (key.ctrl && key.name === 'c') {
        stdin.off('keypress', onKeypress);
        stdin.setRawMode(false);
        stdout.write('\n');
        reject(new Error('Entrada cancelada.'));
      } else if (key.name === 'return' || key.name === 'enter') {
        stdin.off('keypress', onKeypress);
        stdin.setRawMode(false);
        stdout.write('\n');
        resolve(value);
      } else if (key.name === 'backspace') {
        value = value.slice(0, -1);
      } else if (character && !key.ctrl && !key.meta) {
        value += character;
      }
    };
    stdin.on('keypress', onKeypress);
  });
}

async function apiRequest(base, endpoint, token, options = {}) {
  const response = await fetch(`${base}${endpoint}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const text = await response.text();
  if (!response.ok) {
    let detail = text;
    try { detail = JSON.parse(text).message ?? text; } catch { /* response body may not be JSON */ }
    throw new Error(`${options.method ?? 'GET'} ${endpoint} (${response.status}): ${detail || response.statusText}`);
  }
  return text ? JSON.parse(text) : null;
}

async function main() {
  const sourcePath = path.resolve(args.file ?? path.join(projectRoot, 'albuns.ts'));
  const albums = parsePastedFile(await readFile(sourcePath, 'utf8'));
  if (!albums.length) throw new Error('Não encontrei álbuns com título e pelo menos uma faixa nesse arquivo.');
  const artists = [...new Map(albums.map((album) => [album.artistId ?? album.artist, album])).values()];
  const trackCount = albums.reduce((total, album) => total + album.tracks.length, 0);
  console.log(`Encontrei ${albums.length} álbuns, ${trackCount} faixas e ${artists.length} artistas:`);
  const trackGenreIds = [...new Set(albums.flatMap((album) => album.tracks.map((track) => track.genreId).filter(Boolean)))].sort((a, b) => a - b);
  const trackMoodIds = [...new Set(albums.flatMap((album) => album.tracks.map((track) => track.moodId).filter(Boolean)))].sort((a, b) => a - b);
  if (trackGenreIds.length) console.log(`  IDs de gêneros nas faixas: ${trackGenreIds.join(', ')}`);
  if (trackMoodIds.length) console.log(`  IDs de moods nas faixas: ${trackMoodIds.join(', ')}`);
  for (const artist of artists) {
    const count = albums.filter((album) => album.artistId === artist.artistId && album.artist === artist.artist).length;
    console.log(`  • ${artist.artist}${artist.artistId ? ` (ID ${artist.artistId})` : ''}: ${count} álbuns`);
  }
  if (args.preview) {
    console.log('\nPrévia concluída; nenhum dado foi enviado ao backend.');
    return;
  }

  const base = (args.api ?? process.env.VISAH_API_URL ?? 'http://localhost:5291').replace(/\/$/, '');
  const prompt = readline.createInterface({ input: stdin, output: stdout });
  const email = process.env.VISAH_EMAIL || await prompt.question('E-mail de administrador: ');
  prompt.close();
  const password = process.env.VISAH_PASSWORD || await askHidden('Senha de administrador (entrada oculta): ');

  const session = await apiRequest(base, '/api/auth/login', null, {
    method: 'POST', body: JSON.stringify({ email, password }),
  });
  const token = session.token;
  const [apiArtists, apiAlbums, genres, moods] = await Promise.all([
    apiRequest(base, '/api/artists', token),
    apiRequest(base, '/api/albums', token),
    apiRequest(base, '/api/genres', token),
    apiRequest(base, '/api/moods', token),
  ]);
  const artistMap = new Map(apiArtists.map((artist) => [normalizeName(artist.name), artist]));
  const unmatched = artists.filter((item) => item.artistId
    ? !apiArtists.some((candidate) => candidate.id === item.artistId)
    : !artistMap.has(normalizeName(item.artist)));
  if (unmatched.length) {
    const details = unmatched.map((item) => `${item.artist}${item.artistId ? ` (ID ${item.artistId})` : ''}`).join(', ');
    throw new Error(`Artistas não encontrados no backend pelos IDs/nome: ${details}`);
  }
  const nameDifferences = artists.flatMap((item) => {
    if (!item.artistId) return [];
    const artist = apiArtists.find((candidate) => candidate.id === item.artistId);
    return artist && normalizeName(artist.name) !== normalizeName(item.artist)
      ? [`ID ${artist.id}: albuns.ts usa “${item.artist}”; backend usa “${artist.name}”`]
      : [];
  });
  if (nameDifferences.length) {
    console.log('\nNomes diferentes; os álbuns serão associados pelo ID confirmado:');
    for (const difference of nameDifferences) console.log(`  • ${difference}`);
  }
  const knownGenreIds = new Set(genres.map((item) => item.id));
  const knownMoodIds = new Set(moods.map((item) => item.id));
  const missingGenreIds = [...new Set(albums.flatMap((album) => album.tracks.map((track) => track.genreId).filter((id) => id != null && !knownGenreIds.has(id))))];
  const missingMoodIds = [...new Set(albums.flatMap((album) => album.tracks.map((track) => track.moodId).filter((id) => id != null && !knownMoodIds.has(id))))];
  if (missingGenreIds.length || missingMoodIds.length) {
    throw new Error(`IDs de classificação não encontrados no backend. Gêneros: ${missingGenreIds.join(', ') || 'ok'}; moods: ${missingMoodIds.join(', ') || 'ok'}. Corrija albuns.ts ou sincronize os IDs.`);
  }
  const needsGenreFallback = albums.some((album) => album.tracks.some((track) => track.genreId == null));
  const needsMoodFallback = albums.some((album) => album.tracks.some((track) => track.moodId == null));
  const defaultGenre = needsGenreFallback
    ? (args.genre ? genres.find((item) => normalizeName(item.name) === normalizeName(args.genre)) : genres[0])
    : null;
  const defaultMood = needsMoodFallback
    ? (args.mood ? moods.find((item) => normalizeName(item.name) === normalizeName(args.mood)) : moods[0])
    : null;
  if (needsGenreFallback && !defaultGenre) throw new Error(`O gênero de fallback “${args.genre ?? ''}” não existe no backend.`);
  if (needsMoodFallback && !defaultMood) throw new Error(`O mood de fallback “${args.mood ?? ''}” não existe no backend.`);
  console.log(needsGenreFallback || needsMoodFallback
    ? `\nFaixas sem classificação usarão fallback: ${defaultGenre?.name ?? 'ID da faixa'} / ${defaultMood?.name ?? 'ID da faixa'}.`
    : '\nGênero e mood serão usados diretamente dos IDs de cada faixa em albuns.ts; os parâmetros --genre/--mood não são necessários.');
  console.log('As faixas serão cadastradas sem áudio, com duração provisória de 180 segundos.');

  const coverDirectory = path.resolve(args['covers-dir'] ?? path.join(projectRoot, 'public', 'albums-imported'));
  await mkdir(coverDirectory, { recursive: true });
  let createdAlbums = 0;
  let createdTracks = 0;
  let skippedAlbums = 0;
  for (const album of albums) {
    const artist = album.artistId
      ? apiArtists.find((candidate) => candidate.id === album.artistId)
      : artistMap.get(normalizeName(album.artist));
    let existing = apiAlbums.find((item) => item.artistId === artist.id && normalizeName(item.title) === normalizeName(album.title));
    const wasAlreadyCreated = Boolean(existing);
    let albumId;
    let existingTrackNames = new Set();
    if (existing) {
      skippedAlbums += 1;
      albumId = existing.id;
      const detail = await apiRequest(base, `/api/albums/${albumId}`, token);
      existingTrackNames = new Set((detail.tracks ?? []).map((track) => normalizeName(track.title)));
    } else {
      const key = createHash('sha1').update(`${artist.id}-${album.title}`).digest('hex').slice(0, 8);
      const imageName = `${slug(artist.name)}-${slug(album.title)}-${key}.svg`;
      await writeFile(path.join(coverDirectory, imageName), placeholderSvg(artist.name, album.title), 'utf8');
      const created = await apiRequest(base, '/api/albums', token, {
        method: 'POST',
        body: JSON.stringify({ title: album.title, artistId: artist.id, releaseDate: album.releaseDate, coverUrl: `/albums-imported/${imageName}` }),
      });
      albumId = created.id;
      createdAlbums += 1;
      existing = { id: albumId, artistId: artist.id, title: album.title };
      apiAlbums.push(existing);
    }
    let addedForAlbum = 0;
    for (const track of album.tracks) {
      if (existingTrackNames.has(normalizeName(track.title))) continue;
      await apiRequest(base, '/api/tracks', token, {
        method: 'POST',
        body: JSON.stringify({
          title: track.title,
          artistId: artist.id,
          albumId,
          genreId: track.genreId ?? defaultGenre.id,
          moodId: track.moodId ?? defaultMood.id,
          durationSeconds: 180, audioUrl: null, coverUrl: null,
        }),
      });
      createdTracks += 1;
      addedForAlbum += 1;
    }
    console.log(`${wasAlreadyCreated ? 'Conferido' : 'Importado'}: ${artist.name} — ${album.title} (${addedForAlbum} novas faixas)`);
  }
  console.log(`\nConcluído: ${createdAlbums} álbuns, ${createdTracks} faixas; ${skippedAlbums} álbuns já existentes ignorados.`);
  console.log('Capas provisórias gravadas em public/albums-imported. As faixas permanecem sem áudio real.');
}

main().catch((error) => {
  console.error(`\nFalha na importação: ${error.message}`);
  process.exitCode = 1;
});
