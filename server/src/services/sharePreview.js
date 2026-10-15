/**
 * sharePreview.js — fills the website's page with one thing's title, words
 * and picture, so a link pasted in WhatsApp, Facebook or X shows a proper
 * preview card. Those apps never run the site's JavaScript; they only read
 * the <meta> tags in the page the server sends.
 *
 * The built page (web export's index.html) carries default tags between
 * <!--share:start--> and <!--share:end-->; this swaps that block.
 */
const fs = require('fs');

const INDEX_FILE = process.env.WEB_INDEX_HTML || '/var/www/html/index.html';
const SITE = (process.env.WEB_SITE_URL || 'https://allinkigali.rw').replace(/\/$/, '');
const API_PUBLIC = (process.env.API_PUBLIC_URL || 'https://api.allinkigali.rw').replace(/\/$/, '');
const BLOCK = /<!--share:start-->[\s\S]*?<!--share:end-->/;

// Re-read the page only when a deploy has replaced it.
let cached = { mtime: 0, html: '' };
function indexHtml() {
  const { mtimeMs } = fs.statSync(INDEX_FILE);
  if (mtimeMs !== cached.mtime) cached = { mtime: mtimeMs, html: fs.readFileSync(INDEX_FILE, 'utf8') };
  return cached.html;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Plain words from a markdown body, cut at a word near `max` characters.
function summary(text, max = 180) {
  const plain = String(text || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, plain.lastIndexOf(' ', max) > 0 ? plain.lastIndexOf(' ', max) : max)}…`;
}

// Uploaded pictures are stored as /uploads/… on the API.
const absolute = (url) => (!url ? null : /^https?:\/\//.test(url) ? url : `${API_PUBLIC}${url.startsWith('/') ? '' : '/'}${url}`);

/** The page with this thing's preview tags: { title, description, image, path, type }. */
function renderPage({ title, description, image, path, type = 'website' }) {
  const url = `${SITE}${path}`;
  const img = absolute(image);
  const tags = [
    `<meta property="og:site_name" content="allinkigali" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    img ? `<meta property="og:image" content="${esc(img)}" />` : '',
    `<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
  ].filter(Boolean).join('\n    ');
  return indexHtml()
    .replace(BLOCK, `<!--share:start-->\n    ${tags}\n    <!--share:end-->`)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)} · allinkigali</title>`);
}

/** The page exactly as built, for anything without its own preview. */
const plainPage = () => indexHtml();

module.exports = { renderPage, plainPage, summary };
