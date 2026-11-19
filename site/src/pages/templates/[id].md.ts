import type { APIRoute, GetStaticPaths } from 'astro';
import { getAllTemplates, formatIntegration } from '@/lib/templates';

export const prerender = true;

function humanizeStepId(id: string): string {
  return id
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export const getStaticPaths: GetStaticPaths = () => {
  return getAllTemplates().map(t => ({
    params: { id: t.id },
    props: { template: t },
  }));
};

export const GET: APIRoute = ({ props }) => {
  const { template } = props as { template: ReturnType<typeof getAllTemplates>[0] };
  
  const lines: string[] = [];
  
  lines.push(`# ${template.seoTitle || template.title}`);
  lines.push('');
  
  if (template.answer) {
    lines.push(template.answer);
    lines.push('');
  }
  
  const whatYouNeedList: string[] = [];
  if (template.integrations.length > 0) {
    whatYouNeedList.push(
      template.integrations.map(formatIntegration).join(', ') + 
      ' account' + (template.integrations.length > 1 ? 's' : '')
    );
  }
  if (template.secretSpecs.length > 0) {
    whatYouNeedList.push(template.secretSpecs.map(s => s.name).join(', '));
  }
  if (template.mcpServerSpecs.length > 0) {
    whatYouNeedList.push(template.mcpServerSpecs.map(m => m.name || m.id).join(', '));
  }
  if (template.setupMinutes) {
    whatYouNeedList.push(`Setup time: ~${template.setupMinutes} minutes`);
  }
  
  if (whatYouNeedList.length > 0) {
    lines.push('## What you need');
    lines.push('');
    whatYouNeedList.forEach(item => {
      lines.push(`- ${item}`);
    });
    lines.push('');
  }
  
  if (template.workflowSteps.length > 0) {
    lines.push('## How it works');
    lines.push('');
    template.workflowSteps.forEach((step, idx) => {
      lines.push(`${idx + 1}. **${humanizeStepId(step.id)}**: ${step.description}`);
    });
    lines.push('');
  }
  
  if (template.setup.length > 0) {
    lines.push('## Setup steps');
    lines.push('');
    template.setup.forEach((step, idx) => {
      lines.push(`${idx + 1}. ${step}`);
    });
    lines.push('');
  }
  
  if (template.faq && template.faq.length > 0) {
    lines.push('## Frequently asked questions');
    lines.push('');
    template.faq.forEach(item => {
      lines.push(`### ${item.q}`);
      lines.push('');
      lines.push(item.a);
      lines.push('');
    });
  }
  
  if (template.related && template.related.length > 0) {
    lines.push('## Related templates');
    lines.push('');
    const allTemplates = getAllTemplates();
    template.related.forEach(relatedId => {
      const related = allTemplates.find(t => t.id === relatedId);
      if (related) {
        lines.push(`- [${related.title}](https://templates.ballet.dev/templates/${related.id}/)`);
      }
    });
    lines.push('');
  }
  
  lines.push('## Import this template');
  lines.push('');
  lines.push(`Import URL: ${template.importUrl}`);
  lines.push('');
  lines.push(`View online: https://templates.ballet.dev/templates/${template.id}/`);
  
  if (template.lastValidated) {
    lines.push('');
    lines.push(`*Last validated: ${template.lastValidated}*`);
  }

  return new Response(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
