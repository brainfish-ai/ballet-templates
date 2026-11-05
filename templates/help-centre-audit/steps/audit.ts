const { help_centre_url, top_questions, home, articles } = input_data as {
  help_centre_url: string;
  top_questions?: string;
  home: string;
  articles: string;
};

const result = await metaphor.agent('help-centre-auditor', {
  prompt: [
    `Help centre: ${help_centre_url}`,
    top_questions ? `Top customer questions:\n${top_questions}` : 'Top customer questions: not provided.',
    '',
    'Home page:',
    home,
    '',
    'Articles found by search:',
    articles,
  ].join('\n'),
});
