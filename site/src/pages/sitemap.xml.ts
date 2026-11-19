import type { APIRoute } from 'astro';
import { execSync } from 'node:child_process';
import { getAllTemplates } from '@/lib/templates';

export const prerender = true;

function getGitLastModified(templatePath: string): string | null {
  try {
    const isoDate = execSync(
      `git log -1 --format=%cI ${templatePath}`,
      { encoding: 'utf8', cwd: process.cwd() + '/..' }
    ).trim();
    return isoDate || null;
  } catch {
    return null;
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = () => {
  const templates = getAllTemplates();
  const buildTime = new Date().toISOString();
  
  const urls: Array<{ loc: string; lastmod: string; priority: string }> = [];
  
  urls.push({
    loc: 'https://templates.ballet.dev/',
    lastmod: buildTime,
    priority: '1.0',
  });
  
  urls.push({
    loc: 'https://templates.ballet.dev/templates/',
    lastmod: buildTime,
    priority: '0.9',
  });
  
  for (const template of templates) {
    const gitLastMod = getGitLastModified(template.path);
    const lastmod = gitLastMod || template.lastValidated || buildTime;
    
    urls.push({
      loc: `https://templates.ballet.dev/templates/${template.id}/`,
      lastmod,
      priority: '0.8',
    });
  }
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${escapeXml(url.lastmod)}</lastmod>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
