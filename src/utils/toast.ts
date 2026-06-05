/**
 * Helper to trigger toasts without importing UI components directly.
 * This avoids circular dependencies between services and UI components.
 * 
 * The UI's Toast provider should listen for the 'show-toast' event.
 */
export const triggerToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('show-toast', { 
      detail: { message, type } 
    }));
  }
};
