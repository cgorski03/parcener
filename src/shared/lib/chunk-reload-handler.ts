/**
 * Handles stale chunk errors that occur when the app is updated
 * but a client still has old code cached.
 *
 * When dynamic imports fail (e.g., after a deploy changes chunk hashes),
 * this triggers a page reload to fetch the new chunks.
 */
export function initChunkReloadHandler() {
  if (typeof window === 'undefined') return;

  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message ?? '';

    const isChunkError =
      message.includes('Importing a module script failed') ||
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Unable to preload CSS') ||
      // Vite-specific chunk load errors
      message.includes('error loading dynamically imported module');

    if (isChunkError) {
      // Prevent the error from being logged to console
      event.preventDefault();

      // Reload the page to get fresh chunks
      // Use location.reload() instead of router navigation to ensure
      // we get the new HTML with updated script references
      window.location.reload();
    }
  });
}
