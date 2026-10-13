/**
 * ArticleDetailScreen.web.js — Metro resolves this instead of
 * ArticleDetailScreen.js on web. A phone-width browser keeps the phone
 * layout; a wide one gets the reading layout (ArticleDetailWide).
 */
import React from 'react';

import ArticleDetailNarrow from './ArticleDetailNarrow';
import ArticleDetailWide from './ArticleDetailWide';
import useIsWideWeb from '../../web/hooks/useIsWideWeb';

export default function ArticleDetailScreen(props) {
  const isWideWeb = useIsWideWeb();
  return isWideWeb ? <ArticleDetailWide {...props} /> : <ArticleDetailNarrow {...props} />;
}
