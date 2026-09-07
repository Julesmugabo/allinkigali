/**
 * mockNews.js — Amakuru y'igeragezwa (mock news feed).
 *
 * When you plug in a real API later, keep this shape and only replace the
 * source of the array — every component reads these exact field names.
 *
 *   id        unique string
 *   category  key from CATEGORIES below
 *   title     headline (Kinyarwanda)
 *   source    publisher name
 *   publishedAt ISO date string
 *   icon      MaterialCommunityIcons name used for the thumbnail
 *   isBreaking optional flag — shows the red BREAKING badge
 */
import { hoursAgo, minutesAgo } from '../utils/date';

// The category strip under the search bar. `key` is what the feed filters on.
export const CATEGORIES = [
  { key: 'all', label: 'Byose' },
  { key: 'world', label: 'Isi Yose' },
  { key: 'africa', label: 'Afrika' },
  { key: 'politics', label: 'Politike' },
  { key: 'business', label: 'Ubukungu' },
  { key: 'sport', label: 'Siporo' },
  { key: 'science', label: 'Siyansi' },
];

// The big card at the top of the feed.
export const heroArticle = {
  id: 'hero-1',
  category: 'politics',
  title: "Inama Nkuru ya G7 Yatangiye: Abayobozi b'Ibihugu 7 Baganira ku Mahoro n'Ubukungu bw'Isi",
  source: 'BBC News',
  publishedAt: hoursAgo(2),
  icon: 'earth',
  isBreaking: true,
  body: "Abayobozi b'ibihugu birindwi bigize G7 batangiye inama nkuru y'iminsi itatu, bagamije kuganira ku mahoro mpuzamahanga n'uburyo bwo gukomeza ubukungu bw'isi mu gihe cy'ibibazo bitandukanye. Muri gahunda harimo n'ikiganiro ku mihindagurikire y'ikirere n'umutekano w'ibiribwa ku isi. Inama izasozwa n'itangazo rusange rigaragaza imyanzuro bahuriyeho, harimo n'imfashanyo ku bihugu bikennye.",
};

// Horizontal "BISOMWA CYANE" rail.
export const trendingArticles = [
  {
    id: 'trend-1',
    category: 'business',
    title: 'IMF Ivuga ko Afurika Izongera Ubukungu 4.2% muri 2026',
    source: 'Reuters',
    publishedAt: hoursAgo(4),
    icon: 'chart-line',
    body: "Ikigo mpuzamahanga cy'imari (IMF) cyatangaje ko ubukungu bw'ibihugu byo muri Afurika buteganyijwe kwiyongera ku kigero cya 4.2% mu mwaka wa 2026, kurenga ku bipimo byo mu bindi bice by'isi. Iyi terambere riterwa cyane cyane n'ubucukuzi bw'amabuye y'agaciro n'ihinduka ry'ikoranabuhanga mu bucuruzi. IMF yifuza ko ibihugu byakoresha neza aya mahirwe mu kongera imirimo ku rubyiruko.",
  },
  {
    id: 'trend-2',
    category: 'science',
    title: "Ikizamini Gishya Gishobora Gukiza Miliyoni z'Abantu",
    source: 'CNN',
    publishedAt: hoursAgo(6),
    icon: 'dna',
    body: "Abahanga mu bumenyi bw'ubuzima batangaje ko basoje ikizamini cya mbere cy'umuti mushya ushobora gufasha kuvura indwara zandura zica abantu benshi buri mwaka, cyane cyane muri Afurika. Ibisubizo by'ikizamini byerekana ko umuti ufite akamaro kagaragara, ariko hakenewe ubushakashatsi bwinshi mbere yo kuwutangira ku baturage bose. Niba byemejwe, uyu muti ushobora kugera ku baturage mu myaka itatu iri imbere.",
  },
  {
    id: 'trend-3',
    category: 'sport',
    title: 'Real Madrid Yinjiye mu Makipe ya Kabiri ya Champions League',
    source: 'Sky Sports',
    publishedAt: hoursAgo(8),
    icon: 'trophy',
    body: "Real Madrid yemeje ko yinjiye mu majyambere ya Champions League nyuma yo gutsinda umukino wayo wa nyuma mu itsinda. Umutoza w'ikipe yashimiye abakinnyi kubera imikino myiza bagaragaje mu minsi ishize. Ikipe izahura n'umwanzi wayo mu ndunduro zizakurikiraho mu mezi make aza.",
  },
  {
    id: 'trend-4',
    category: 'world',
    title: "Amerika n'Ubushinwa Bisubiranya Gutumanahana",
    source: 'Al Jazeera',
    publishedAt: hoursAgo(9),
    icon: 'handshake',
    body: "Amerika n'Ubushinwa byatangaje ko bisubiranya ibiganiro by'ubucuruzi nyuma y'amezi menshi bidatumanaho neza. Impande zombi zivuga ko zifuza gushaka umuti ku bibazo by'imisoro ku bicuruzwa byinjizwa hagati yabyo. Abanyapolitiki bo ku isi bavuga ko iki cyemezo gishobora kugira uruhare mu guhumuriza isoko mpuzamahanga.",
  },
];

// The vertical "AMAKURU MASHYA" list.
export const latestArticles = [
  {
    id: 'news-1',
    category: 'world',
    title: "Ubushinwa Bwemeje Gufungura Inzira Nshya yo Gutumanahana n'Uburengerazuba",
    source: 'Reuters',
    publishedAt: hoursAgo(1),
    icon: 'bank',
    body: "Ubuyobozi bw'Ubushinwa bwatangaje ko bwemeje gufungura inzira nshya y'ibiganiro n'ibihugu by'Uburengerazuba, nyuma y'igihe kirekire hari ibibazo hagati yabo. Iyi ntambwe iteganyijwe gutangira n'inama y'abadipolomate bakuru mu byumweru bike biri imbere. Abasesenguzi bavuga ko iki cyemezo gishobora kugabanya ibyago by'intonganya z'ubucuruzi hagati y'impande ebyiri.",
  },
  {
    id: 'news-2',
    category: 'africa',
    title: "AU Itangaza Gahunda yo Gushyira Amashanyarazi mu Bihugu 30 by'Afurika",
    source: 'Al Jazeera',
    publishedAt: hoursAgo(3),
    icon: 'map',
    body: "Umuryango w'Afurika Yunze Ubumwe (AU) watangaje gahunda nshya igamije gushyira amashanyarazi mu bihugu 30 bitarabigeraho, ikazatwara imyaka itanu. Iyi gahunda izashingira ku ngufu z'izuba n'amazi, kandi izafasha imiryango miriyoni nyinshi kubona amashanyarazi ku nshuro ya mbere. Ibihugu bimwe byatangiye kwiyandikisha kugira ngo bibashe kubona inkunga.",
  },
  {
    id: 'news-3',
    category: 'sport',
    title: '3 — 1: Real Madrid Yatsinze Bayern Munich',
    source: 'Sky Sports',
    publishedAt: hoursAgo(5),
    icon: 'trophy',
    body: "Real Madrid yatsinze Bayern Munich amanota 3 kuri 1 mu mukino wakinnye ku mugoroba wa ejo, ikomeza urugendo rwiza muri Champions League. Ibitego byatsinzwe n'abakinnyi batatu batandukanye, aho igitego cya nyuma cyatsinzwe mu minota ya nyuma y'umukino. Uyu mukino wari umwe mu yagaragaje imikino myiza y'ibipimo bibiri.",
  },
  {
    id: 'news-4',
    category: 'science',
    title: "Ubushakashatsi Bushya Bwerekana Uko Ikirere cy'Isi Cyahindutse mu Myaka 10,000",
    source: 'CNN',
    publishedAt: hoursAgo(6),
    icon: 'dna',
    body: "Ubushakashatsi bushya bwakozwe n'abahanga mu bumenyi bw'ikirere bwerekanye uko ikirere cy'isi cyahindutse mu myaka 10,000 ishize, bakoresheje ibimenyetso byavuye mu barafu n'amabuye. Iyi mibare igaragaza ko ihindagurika ry'iki gihe rifite umuvuduko utigeze ubaho mu mateka. Abashakashatsi bavuga ko iyi nyandiko izafasha mu gutegura politiki nziza ku kirere.",
  },
  {
    id: 'news-5',
    category: 'business',
    title: "Igiciro cy'Ibikomoka kuri Peteroli Cyongeye Kuzamura Ubukungu bw'Uburayi",
    source: 'BBC',
    publishedAt: hoursAgo(7),
    icon: 'chart-line',
    body: "Igiciro cy'ibikomoka kuri peteroli cyazamutse ku isoko mpuzamahanga, bigatuma ibihugu byinshi byo mu Burayi bihura n'ikibazo cyo kongera igiciro cy'ingufu. Ibi bishobora kugira ingaruka ku bucuruzi n'ubukungu bw'imiryango myinshi mu gihe cy'itumba. Guverinoma zimwe zatangiye gutegura ingamba zo gufasha abaturage bakennye.",
  },
  {
    id: 'news-6',
    category: 'politics',
    title: "Inteko Ishinga Amategeko Yemeje Itegeko Rishya ry'Uburezi",
    source: 'The New Times',
    publishedAt: hoursAgo(9),
    icon: 'gavel',
    body: "Inteko Ishinga Amategeko yemeje itegeko rishya rigamije kunoza uburezi mu mashuri abanza n'ayisumbuye, harimo n'ivugurura ry'inyigisho z'ikoranabuhanga. Iri tegeko rizatangira gushyirwa mu bikorwa mu mwaka utaha w'amashuri. Abarimu bemejwe ko bazahabwa amahugurwa mbere yo gutangira gukoresha uburyo bushya.",
  },
  {
    id: 'news-7',
    category: 'africa',
    title: 'Kigali Yakiriye Inama Nkuru ya Tekinoloji Yitabiriwe n\'Ibihugu 40',
    source: 'KT Press',
    publishedAt: hoursAgo(11),
    icon: 'city',
    body: "Umujyi wa Kigali wakiriye inama nkuru mpuzamahanga y'ikoranabuhanga yitabiriwe n'intumwa ziturutse mu bihugu 40. Abitabiriye bagaranije uburyo Afurika ishobora gukoresha ikoranabuhanga mu kunoza ubukungu n'imibereho y'abaturage. Rwanda yashimiwe kubera uruhare rwayo mu iterambere ry'ikoranabuhanga muri aka karere.",
  },
  {
    id: 'news-8',
    category: 'business',
    title: "Banki Nkuru y'u Rwanda Yagabanyije Inyungu ku Nguzanyo",
    source: 'The New Times',
    publishedAt: hoursAgo(13),
    icon: 'cash-multiple',
    body: "Banki Nkuru y'u Rwanda yatangaje ko igabanyije igipimo cy'inyungu ku nguzanyo, igamije guteza imbere ishoramari n'ubucuruzi bw'ibigo bito n'ibiciriritse. Iki cyemezo giteganyijwe gufasha abanyarwanda benshi kubona inguzanyo ku giciro gikwiye. Inzobere mu bukungu zishimira iki cyemezo, zivuga ko gishobora gukangura ubukungu mu gihe gito.",
  },
  {
    id: 'news-9',
    category: 'world',
    title: 'Umuriro wo mu Mashyamba Wagize Ingaruka ku Bantu Ibihumbi mu Burayi',
    source: 'Reuters',
    publishedAt: minutesAgo(38),
    icon: 'fire',
    body: "Umuriro ukomeye wo mu mashyamba wagize ingaruka ku baturage ibihumbi byinshi mu bice bimwe by'Uburayi, utuma abenshi bimurwa mu mutekano. Abazimya umuriro bakomeje kurwana n'inkongi, bafashijwe n'ibindi bihugu byoherereje ubufasha. Ubuyobozi bwasabye abaturage kwitondera amabwiriza y'umutekano mu gihe umuriro ukiriho.",
  },
  {
    id: 'news-10',
    category: 'science',
    title: 'Icyogajuru Gishya Cyoherejwe mu Kirere Kizafasha Kumenya Ibihe',
    source: 'BBC',
    publishedAt: hoursAgo(15),
    icon: 'rocket-launch',
    body: "Icyogajuru gishya cyoherejwe mu kirere cyagenewe gufasha abahanga kumenya neza ihinduka ry'ibihe ku isi hose. Iki cyogajuru gizakoresha ikoranabuhanga rigezweho mu gukusanya amakuru ajyanye n'imiterere y'ikirere buri munsi. Abahanga bizeye ko amakuru azavamo azafasha ibihugu gutegura neza ibiza bishobora guterwa n'ikirere.",
  },
];

/**
 * Everything in one array — handy for search and for "Byose".
 */
export const allArticles = [heroArticle, ...trendingArticles, ...latestArticles];

/**
 * Feed for a given category key.
 * Returns { hero, trending, latest } so the screen stays dumb.
 */
export function getFeed(categoryKey = 'all') {
  if (categoryKey === 'all') {
    return {
      hero: heroArticle,
      trending: trendingArticles,
      latest: latestArticles,
    };
  }

  const matching = allArticles.filter((a) => a.category === categoryKey);
  const [first, ...rest] = matching;

  return {
    hero: first || null,
    trending: trendingArticles.filter((a) => a.category === categoryKey),
    latest: rest,
  };
}

export default { CATEGORIES, getFeed, allArticles };
