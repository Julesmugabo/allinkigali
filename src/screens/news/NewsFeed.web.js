/**
 * NewsFeed.web.js — Metro resolves this instead of NewsFeed.js on web.
 * A phone-width browser still gets the exact same feed as native
 * (NewsFeedNarrow); only once the viewport crosses the breakpoint does the
 * desktop layout (NewsFeedWide) take over.
 */
import React from 'react';

import NewsFeedNarrow from './NewsFeedNarrow';
import NewsFeedWide from './NewsFeedWide';
import useIsWideWeb from '../../web/hooks/useIsWideWeb';

export default function NewsFeed(props) {
  const isWideWeb = useIsWideWeb();
  return isWideWeb ? <NewsFeedWide {...props} /> : <NewsFeedNarrow {...props} />;
}
