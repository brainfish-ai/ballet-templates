const { deal_name, handoff_summary } = input_data as { deal_name: string; handoff_summary: string };

const doc_name = `CS Handoff - ${deal_name}`;

// Create Google Drive document with handoff summary
const docResult = await metaphor.integration('google_drive', 'files.create_text', {
  name: doc_name,
  content: handoff_summary,
  mimeType: 'text/plain',
});

if (!docResult.ok) {
  throw new Error(`Failed to create Google Drive document: ${docResult.error?.message ?? JSON.stringify(docResult.error)}`);
}

const result = {
  doc_id: docResult.data?.id,
  doc_name,
  doc_url: docResult.data?.webViewLink || `https://drive.google.com/file/d/${docResult.data?.id}`,
};
