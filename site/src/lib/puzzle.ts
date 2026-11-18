const LOGO_DEV_TOKEN = 'pk_VcdT-XyYRzOEIrXi_56dWA';

export const PUZZLE_TOOLS = [
  'Salesforce', 'Slack', 'HubSpot', 'Gong', 'Zendesk', 'Notion', 'Stripe', 'NetSuite',
  'Zoom', 'Outreach', 'Intercom', 'Google Sheets', 'DocuSign', 'Marketo', 'ZoomInfo', 'ServiceNow',
  'Clearbit', 'Freshdesk', 'Confluence', 'Zuora', 'Ironclad', 'Genesys', 'Cvent', 'Goldcast',
  'Google Drive', 'Excel',
];

export const HERO_PHONE_SRCSET =
  '/assets/pieces-puzzle-phone-v15-480.webp 480w, /assets/pieces-puzzle-phone-v15-728.webp 728w, /assets/pieces-puzzle-phone-v15.webp 840w';

export const PUZZLE_COLOURS: Record<string, string> = {
  Slack: '#4a154b',
  'Google Drive': '#1fa463',
  'Google Sheets': '#0f9d58',
};

const TOOL_ASSETS: Record<string, string> = {
  'Google Sheets': '/assets/tool-google-sheets.svg',
  Excel: '/assets/tool-excel.svg',
  'Ballet data table': '/assets/ballet-mark-v2.svg',
};

const TOOL_DOMAINS: Record<string, string> = {
  Salesforce: 'salesforce.com',
  Slack: 'slack.com',
  HubSpot: 'hubspot.com',
  Gong: 'gong.io',
  Zendesk: 'zendesk.com',
  Notion: 'notion.so',
  Stripe: 'stripe.com',
  NetSuite: 'netsuite.com',
  Zoom: 'zoom.us',
  Outreach: 'outreach.io',
  Intercom: 'intercom.com',
  DocuSign: 'docusign.com',
  Marketo: 'marketo.com',
  ZoomInfo: 'zoominfo.com',
  ServiceNow: 'servicenow.com',
  Clearbit: 'clearbit.com',
  Freshdesk: 'freshdesk.com',
  Confluence: 'atlassian.com',
  Zuora: 'zuora.com',
  Ironclad: 'ironcladapp.com',
  Genesys: 'genesys.com',
  Cvent: 'cvent.com',
  Goldcast: 'goldcast.io',
  'Google Drive': 'google.com',
};

function puzzleLogoFor(tool: string): string | undefined {
  if (TOOL_ASSETS[tool]) return TOOL_ASSETS[tool];
  const domain = TOOL_DOMAINS[tool];
  if (!domain) return undefined;
  const params = new URLSearchParams({
    token: LOGO_DEV_TOKEN,
    size: '128',
    format: 'webp',
    theme: 'light',
    retina: 'true',
  });
  return `https://img.logo.dev/${encodeURIComponent(domain)}?${params}`;
}

export const PUZZLE_STEPS = PUZZLE_TOOLS.map(t => ({
  logo: puzzleLogoFor(t),
  color: PUZZLE_COLOURS[t],
}));
