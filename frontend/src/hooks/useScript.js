import { useEffect, useState } from 'react';

export const useScript = (src) => {
  const [status, setStatus] = useState(src ? 'loading' : 'idle');

  useEffect(() => {
    if (!src) {
      setStatus('idle');
      return;
    }

    // Fetch existing script element by src
    // It may have been added by another instance of this hook
    let script = document.querySelector(`script[src="${src}"]`);

    if (!script) {
      // Create script
      script = document.createElement('script');
      script.src = src;
      script.async = true;
      // Midtrans Snap will get configuration from the token
      document.body.appendChild(script);
    }

    // Handle script lifecycle
    const handleLoad = () => setStatus('ready');
    const handleError = () => setStatus('error');

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);

    return () => {
      // Clean up event listeners
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, [src]);

  return status;
};
