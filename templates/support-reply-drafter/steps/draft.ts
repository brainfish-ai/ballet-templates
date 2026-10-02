const { message, product_context, tone, sources } = input_data as {
  message: string;
  product_context?: string;
  tone?: string;
  sources?: unknown;
};

const res = await metaphor.agent('support-reply-writer', {
  prompt: [
    `Customer message:\n${message}`,
    product_context ? `Product context:\n${product_context}` : '',
    tone ? `Tone: ${tone}` : '',
    sources ? `Reference material:\n${JSON.stringify(sources)}` : '',
  ]
    .filter(Boolean)
    .join('\n\n'),
});

const result = { reply: typeof res === 'string' ? res : (res?.reply ?? '') };
