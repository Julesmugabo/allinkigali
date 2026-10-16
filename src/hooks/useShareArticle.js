/**
 * useShareArticle.js — shares a news article's link; used by the "Sangiza"
 * button on the article page and the share icon on the news cards.
 *
 * Phones (app): the phone's own share sheet (WhatsApp, SMS, …).
 * Web: the share sheet on phone browsers; on computers the link is copied
 * and `copied` turns true for a moment so the button can say so.
 */
import { useState, useCallback } from 'react';
import { Share, Platform } from 'react-native';

const SITE = (process.env.EXPO_PUBLIC_SITE_URL || 'https://allinkigali.rw').replace(/\/$/, '');
export const articleLink = (article) => `${SITE}/news/article/${article.id}`;

export default function useShareArticle(article) {
  const [copied, setCopied] = useState(false);

  const share = useCallback(async () => {
    const url = articleLink(article);
    try {
      if (Platform.OS !== 'web') {
        await Share.share({ message: `${article.title}\n${url}`, url, title: article.title });
        return;
      }
      if (navigator.share && window.matchMedia?.('(pointer: coarse)').matches) {
        await navigator.share({ title: article.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The person closed the share sheet: nothing to do.
    }
  }, [article]);

  return { share, copied };
}
