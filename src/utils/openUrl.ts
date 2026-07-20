/**
 * Open URL in default system browser
 */
export async function openExternalUrl(url: string) {
  if (!url || url === '#') return;

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('open_external_url', { url });
  } catch (e) {
    console.warn('Tauri open_external_url failed, falling back to window.open', e);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
