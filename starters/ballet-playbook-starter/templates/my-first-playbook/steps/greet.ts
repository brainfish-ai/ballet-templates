const { name } = input_data as { name: string };

const res = await metaphor.agent('greeter', { prompt: `Greet ${name}.` });

const result = { greeting: typeof res === 'string' ? res : String(res?.greeting ?? '') };
