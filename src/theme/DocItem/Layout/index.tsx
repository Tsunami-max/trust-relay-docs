import React, { useState, useCallback } from 'react';
import Layout from '@theme-original/DocItem/Layout';
import type LayoutType from '@theme/DocItem/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';

type Props = React.ComponentProps<typeof LayoutType>;

const KEY = 'tr-docs-toc-hidden';

function TocToggle() {
  const [hidden, setHidden] = useState(
    () => localStorage.getItem(KEY) === 'true'
  );

  const toggle = useCallback(() => {
    const next = !hidden;
    setHidden(next);
    localStorage.setItem(KEY, String(next));
    applyTocVisibility(next);
  }, [hidden]);

  // Apply on every render (catches page navigations)
  React.useEffect(() => {
    const t = setTimeout(() => applyTocVisibility(hidden), 0);
    return () => clearTimeout(t);
  });

  return (
    <button
      className="toc-toggle-btn"
      onClick={toggle}
      title={hidden ? 'Show table of contents' : 'Hide table of contents'}
    >
      {hidden ? 'TOC ▶' : '◀ TOC'}
    </button>
  );
}

function applyTocVisibility(hidden: boolean) {
  const tocCol = document.querySelector<HTMLElement>('.col.col--3');
  if (tocCol) {
    tocCol.style.cssText = hidden ? 'display:none!important' : '';
  }
  const contentCol = document.querySelector<HTMLElement>('[class*="docItemCol"]');
  if (contentCol) {
    contentCol.style.cssText = hidden
      ? 'max-width:100%!important;flex:0 0 100%!important'
      : '';
  }
}

export default function LayoutWrapper(props: Props): React.JSX.Element {
  return (
    <>
      <BrowserOnly>{() => <TocToggle />}</BrowserOnly>
      <Layout {...props} />
    </>
  );
}
