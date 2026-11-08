import { useEffect } from 'react';

export default function ContentProtection() {
  useEffect(() => {
    // 1. Disable Right-Click Context Menu
    const handleContextMenu = (e) => {
      // Allow right-click inside form inputs if user needs to paste
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      e.preventDefault();
    };

    // 2. Disable Copy / Cut actions on static text & images
    const handleCopyCut = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      e.preventDefault();
    };

    // 3. Disable DevTools & View Source Keyboard Shortcuts
    const handleKeyDown = (e) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
      const ctrlOrMeta = e.ctrlKey || e.metaKey;

      // F12 (Inspect DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I / Cmd+Opt+I (Inspect)
      // Ctrl+Shift+J / Cmd+Opt+J (Console)
      // Ctrl+Shift+C / Cmd+Opt+C (Element Picker)
      if (
        ctrlOrMeta &&
        e.shiftKey &&
        ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+U (View Source) & Ctrl+S (Save Page HTML)
      if (ctrlOrMeta && ['u', 'U', 's', 'S'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+C / Ctrl+X outside input forms
      if (ctrlOrMeta && ['c', 'C', 'x', 'X'].includes(e.key) && !isInput) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopyCut);
    window.addEventListener('cut', handleCopyCut);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopyCut);
      window.removeEventListener('cut', handleCopyCut);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return null; // Silent background shield
}