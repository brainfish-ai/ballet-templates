import type { APIRoute } from 'astro';
import { getAllTemplates, formatIntegration } from '@/lib/templates';

export const prerender = true;

function humanizeStepId(id: string): string {
  return id
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export const GET: APIRoute = () => {
  const templates = getAllTemplates();
  
  const lines: string[] = [
    '# Ballet Workflow Templates (Full Documentation)',
    '> https://templates.ballet.dev/',
    '',
    'Ballet workflow templates: pre-built automation playbooks for lead management, customer support, sales pipeline, marketing campaigns, data management, project management, and tickets & incidents. Each template includes AI agents, integrations, and step-by-step workflow logic. Import to Ballet and run instantly.',
    '',
  ];

  for (const template of templates) {
    lines.push(`# ${template.seoTitle || template.title}`);
    lines.push(`> https://templates.ballet.dev/templates/${template.id}/`);
    lines.push('');
    
    if (template.answer) {
      lines.push(template.answer);
      lines.push('');
    }
    
    lines.push('## Summary');
    lines.push(template.summary);
    lines.push('');
    
    if (template.integrations.length > 0) {
      lines.push('## Integrations');
      lines.push(template.integrations.map(formatIntegration).join(', '));
      lines.push('');
    }
    
    if (template.setupMinutes) {
      lines.push(`## Setup time`);
      lines.push(`~${template.setupMinutes} minutes`);
      lines.push('');
    }
    
    if (template.setup.length > 0) {
      lines.push('## Setup steps');
      template.setup.forEach((step, idx) => {
        lines.push(`${idx + 1}. ${step}`);
      });
      lines.push('');
    }
    
    if (template.workflowSteps.length > 0) {
      lines.push('## How it works');
      template.workflowSteps.forEach((step, idx) => {
        lines.push(`${idx + 1}. ${humanizeStepId(step.id)}: ${step.description}`);
      });
      lines.push('');
    }
    
    if (template.faq && template.faq.length > 0) {
      lines.push('## FAQ');
      template.faq.forEach(item => {
        lines.push(`Q: ${item.q}`);
        lines.push(`A: ${item.a}`);
        lines.push('');
      });
    }
    
    if (template.related && template.related.length > 0) {
      const relatedTemplates = template.related
        .map(id => getAllTemplates().find(t => t.id === id))
        .filter(Boolean)
        .map(t => `${t!.title} (https://templates.ballet.dev/templates/${t!.id}/)`)
        .join(', ');
      if (relatedTemplates) {
        lines.push('## Related templates');
        lines.push(relatedTemplates);
        lines.push('');
      }
    }
    
    lines.push(`Import: ${template.importUrl}`);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return new Response(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
