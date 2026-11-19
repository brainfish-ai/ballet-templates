import type { APIRoute } from 'astro';
import { getAllTemplates } from '@/lib/templates';

export const prerender = true;

export const GET: APIRoute = () => {
  const templates = getAllTemplates();
  
  const lines: string[] = [
    '# Ballet Workflow Templates',
    '> https://templates.ballet.dev/',
    '',
    'Ballet workflow templates: pre-built automation playbooks for lead management, customer support, sales pipeline, marketing campaigns, data management, project management, and tickets & incidents. Import to Ballet and run instantly.',
    '',
  ];

  for (const template of templates) {
    lines.push(`# ${template.seoTitle || template.title}`);
    lines.push(`> https://templates.ballet.dev/templates/${template.id}/`);
    lines.push(template.answer || template.summary);
    lines.push('');
  }

  return new Response(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
