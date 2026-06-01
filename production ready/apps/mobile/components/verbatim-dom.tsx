'use dom';

import { useEffect, useState } from 'react';

import '../../../assets/css/00-fonts.css';
import '../../../assets/css/10-core.css';
import '../../../assets/css/20-assistant.css';
import '../../../assets/css/30-workspace.css';
import '../../../assets/css/40-overrides.css';

type VerbatimDomProps = {
  dom?: import('expo/dom').DOMProps;
};

export default function VerbatimDom(_props: VerbatimDomProps) {
  const [bootError, setBootError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function bootVerbatim() {
      try {
        // The preserved static app expects #mainContent to exist before its module loads.
        await import('../../../assets/js/main.js');
      } catch (error) {
        if (!cancelled) {
          setBootError(error instanceof Error ? error.message : 'Verbatim failed to load.');
        }
      }
    }

    bootVerbatim();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className="toast-container" id="toastContainer" />
      <div className="page" id="page">
        <main id="mainContent" />
      </div>
      {bootError ? (
        <div role="alert" style={{ padding: 16, color: '#991b1b', fontFamily: 'system-ui, sans-serif' }}>
          {bootError}
        </div>
      ) : null}
    </>
  );
}
