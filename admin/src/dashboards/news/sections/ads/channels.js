/**
 * channels.js — what each ad channel is and where its ads appear, shown at
 * the top of its page and in the ad form.
 */
export const CHANNELS = {
  app: {
    title: 'App ads',
    where: 'Shown in the app (and on phones): as the 2nd and 4th "Bisomwa cyane" cards, then one after every 6 stories, taking turns.',
    size: 'Use a clear photo; it is shown small (story-card picture) and as a tall card in Bisomwa cyane.',
  },
  web: {
    title: 'Web ads',
    where: 'Shown on the website: the first running ad on the right of the news page, the second on the left, and under "Bisomwa cyane" on article pages (the ad the writer picked, otherwise taking turns).',
    size: 'Best size: 600 × 500 px (landscape, a little wider than tall).',
  },
};

export const adStatus = (ad) => {
  const today = new Date().toISOString().slice(0, 10);
  if (!ad.isActive) return { label: 'Off', color: '#94A3B8' };
  if (ad.startsOn && ad.startsOn > today) return { label: 'Scheduled', color: '#60A5FA' };
  if (ad.endsOn && ad.endsOn < today) return { label: 'Ended', color: '#94A3B8' };
  return { label: 'Running', color: '#34D399' };
};
