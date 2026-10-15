/**
 * i18n.js — the guest page in Kinyarwanda, English and French. The choice
 * is remembered on the phone; the first time, the phone's own language
 * decides (Kinyarwanda, French, otherwise English).
 *   const [L, lang, setLang] = useLang();   L.send, L.status.ready, L.err(code)
 */
import { useState } from 'react';
import { remember } from './device';

export const LANGS = [['rw', 'Kinyarwanda'], ['en', 'English'], ['fr', 'Français']];

const T = {
  rw: {
    orderAtTable: 'Tumiza aho wicaye',
    typeCode: 'Andika kode iri ku ikarita iri ku meza yawe.',
    openMenu: 'Fungura menu',
    enterCode: "Andika kode y'ameza",
    orScan: 'Cyangwa sikana QR code iri ku meza.',
    add: 'Ongeraho',
    yourOrder: 'Ibyo ugiye gutumiza',
    note: 'Icyo wifuza (si ngombwa)',
    notePlaceholder: 'Urugero: nta tungurusumu',
    total: 'Igiteranyo',
    noFees: 'Ibiciro biri kuri menu gusa — nta yandi mafaranga yiyongeraho.',
    send: 'Ohereza',
    sending: 'Biroherezwa…',
    viewOrder: (n) => `Reba ibyo watoranyije (${n})`,
    firstOrder: 'Itumiza ryawe rya mbere ritegereza ko umuserveri yemeza ko uri ku meza.',
    location: 'Telefoni ishobora kukubaza aho uri: ni ukwemeza gusa ko uri hano.',
    tableOrders: 'Ibyatumijwe kuri aya meza',
    yours: 'Ibyawe',
    someoneElse: 'Undi muri kumwe',
    tableTotal: 'Igiteranyo cy\'ameza',
    callWaiter: 'Hamagara umuserveri',
    askBill: 'Saba fagitire',
    waiterCalled: 'Umuserveri yahamagawe',
    billAsked: 'Fagitire yasabwe',
    cancel: 'Kuraho',
    cancelSure: 'Ukuraho iri tumiza?',
    closed: (name) => `${name} ntiyakira amatumiza ubu.`,
    emptyMenu: 'Nta biri kuri menu ubu. Baza umuserveri.',
    sent: 'Byoherejwe!',
    status: {
      needs_confirm: 'Dutegereje ko umuserveri yemeza ameza yawe',
      placed: 'Itumiza ryakiriwe',
      accepted: 'Umuserveri ari kubikurikirana',
      preparing: 'Biri gutegurwa',
      ready: 'Byateguwe — biraje ku meza',
      served: 'Muryoherwe!',
      cancelled: 'Byakuweho',
      rejected: 'Ntibyemejwe — hamagara umuserveri',
    },
    errors: {
      OFFLINE: 'Nta interineti. Ongera ugerageze.',
      BAD_CODE: 'Iyo kode ntibaho. Reba neza ikarita iri ku meza.',
      BAD_TABLE: 'Iyi kode ntigikora. Baza umuserveri.',
      TOO_MANY_TRIES: 'Wagerageje kenshi. Tegereza gato cyangwa usikane QR code.',
      CLOSED: 'Ubu ntibakira amatumiza.',
      TOO_MANY: 'Amatumiza menshi icyarimwe. Tegereza gato cyangwa uhamagare umuserveri.',
      FAR: 'Bisa n\'aho utari hano. Ku Meza ni iy\'abari ku meza gusa.',
      EMPTY: 'Nta kintu wahisemo.',
      UNAVAILABLE: 'Hari ibitakiboneka. Reba ibyo watoranyije.',
      BLOCKED: 'Umuserveri ntiyakwemeje kuri aya meza. Hamagara umuserveri.',
      TOO_LATE: 'Igikoni cyatangiye kubitegura. Baza umuserveri.',
      NOT_CONFIRMED: 'Umuserveri araza vuba, itumiza ryawe rya mbere nirimara kwemezwa.',
      ALREADY_CALLED: 'Umuserveri yamaze guhamagarwa.',
      FAILED: 'Hari ikitagenze neza. Ongera ugerageze.',
    },
  },
  en: {
    orderAtTable: 'Order from your table',
    typeCode: 'Type the code printed on the card on your table.',
    openMenu: 'Open the menu',
    enterCode: 'Type a table code',
    orScan: 'Or scan the QR code on the table.',
    add: 'Add',
    yourOrder: 'Your order',
    note: 'Note (optional)',
    notePlaceholder: 'e.g. no onions, well done',
    total: 'Total',
    noFees: 'Menu prices only — no extra fees.',
    send: 'Send order',
    sending: 'Sending…',
    viewOrder: (n) => `View order (${n})`,
    firstOrder: 'Your first order waits for a waiter to confirm you\'re at the table.',
    location: 'Your phone may ask for your location — only to check you\'re here.',
    tableOrders: 'This table\'s orders',
    yours: 'Yours',
    someoneElse: 'Someone at your table',
    tableTotal: 'Table total',
    callWaiter: 'Call waiter',
    askBill: 'Ask for the bill',
    waiterCalled: 'Waiter called',
    billAsked: 'Bill requested',
    cancel: 'Cancel',
    cancelSure: 'Cancel this order?',
    closed: (name) => `${name} isn't taking orders right now.`,
    emptyMenu: 'The menu is empty right now. Please ask a waiter.',
    sent: 'Sent!',
    status: {
      needs_confirm: 'Waiting for your waiter to confirm your table',
      placed: 'Order received',
      accepted: 'Your waiter is on it',
      preparing: 'Being prepared',
      ready: 'Ready — on its way to you',
      served: 'Enjoy!',
      cancelled: 'Cancelled',
      rejected: 'Not confirmed — please call a waiter',
    },
    errors: {
      OFFLINE: 'No internet connection. Try again.',
      BAD_CODE: 'No table has this code. Check the card on your table.',
      BAD_TABLE: 'This table code no longer works. Please ask a waiter.',
      TOO_MANY_TRIES: 'Too many tries. Wait a few minutes or scan the QR code.',
      CLOSED: 'Not taking orders right now.',
      TOO_MANY: 'Too many orders at once. Wait a moment or call your waiter.',
      FAR: 'You seem to be far away. Ku Meza is only for guests at the table.',
      EMPTY: 'Your order is empty.',
      UNAVAILABLE: 'Some dishes are no longer available. Please check your order.',
      BLOCKED: 'The waiter could not confirm you at this table. Please call a waiter.',
      TOO_LATE: 'The kitchen has already started it. Please ask your waiter.',
      NOT_CONFIRMED: 'Your waiter will come as soon as your first order is confirmed.',
      ALREADY_CALLED: 'Your waiter has already been called.',
      FAILED: 'Something went wrong. Please try again.',
    },
  },
  fr: {
    orderAtTable: 'Commandez depuis votre table',
    typeCode: 'Saisissez le code imprimé sur la carte de votre table.',
    openMenu: 'Ouvrir le menu',
    enterCode: 'Saisir un code de table',
    orScan: 'Ou scannez le QR code sur la table.',
    add: 'Ajouter',
    yourOrder: 'Votre commande',
    note: 'Remarque (facultatif)',
    notePlaceholder: 'ex. sans oignons, bien cuit',
    total: 'Total',
    noFees: 'Prix du menu uniquement — aucun frais en plus.',
    send: 'Envoyer la commande',
    sending: 'Envoi…',
    viewOrder: (n) => `Voir la commande (${n})`,
    firstOrder: 'Votre première commande attend que le serveur confirme votre présence à la table.',
    location: 'Votre téléphone peut demander votre position — seulement pour vérifier que vous êtes sur place.',
    tableOrders: 'Commandes de la table',
    yours: 'Les vôtres',
    someoneElse: 'Quelqu\'un à votre table',
    tableTotal: 'Total de la table',
    callWaiter: 'Appeler le serveur',
    askBill: 'Demander l\'addition',
    waiterCalled: 'Serveur appelé',
    billAsked: 'Addition demandée',
    cancel: 'Annuler',
    cancelSure: 'Annuler cette commande ?',
    closed: (name) => `${name} ne prend pas de commandes pour le moment.`,
    emptyMenu: 'Le menu est vide pour le moment. Demandez au serveur.',
    sent: 'Envoyé !',
    status: {
      needs_confirm: 'En attente de confirmation du serveur',
      placed: 'Commande reçue',
      accepted: 'Votre serveur s\'en occupe',
      preparing: 'En préparation',
      ready: 'Prêt — arrive à votre table',
      served: 'Bon appétit !',
      cancelled: 'Annulée',
      rejected: 'Non confirmée — appelez un serveur',
    },
    errors: {
      OFFLINE: 'Pas de connexion internet. Réessayez.',
      BAD_CODE: 'Aucune table n\'a ce code. Vérifiez la carte sur votre table.',
      BAD_TABLE: 'Ce code de table ne fonctionne plus. Demandez au serveur.',
      TOO_MANY_TRIES: 'Trop d\'essais. Patientez quelques minutes ou scannez le QR code.',
      CLOSED: 'Pas de commandes pour le moment.',
      TOO_MANY: 'Trop de commandes à la fois. Patientez ou appelez le serveur.',
      FAR: 'Vous semblez loin. Ku Meza est réservé aux clients à table.',
      EMPTY: 'Votre commande est vide.',
      UNAVAILABLE: 'Certains plats ne sont plus disponibles. Vérifiez votre commande.',
      BLOCKED: 'Le serveur n\'a pas pu confirmer votre présence. Appelez un serveur.',
      TOO_LATE: 'La cuisine a déjà commencé. Demandez au serveur.',
      NOT_CONFIRMED: 'Votre serveur viendra dès que votre première commande sera confirmée.',
      ALREADY_CALLED: 'Le serveur a déjà été appelé.',
      FAILED: 'Un problème est survenu. Réessayez.',
    },
  },
};

const KEY = 'kumeza-lang';

function firstLang() {
  const saved = remember.get(KEY, null);
  if (T[saved]) return saved;
  const phone = (navigator.language || '').toLowerCase();
  if (phone.startsWith('rw') || phone.startsWith('kin')) return 'rw';
  if (phone.startsWith('fr')) return 'fr';
  return 'en';
}

export function useLang() {
  const [lang, setLangState] = useState(firstLang);
  const setLang = (l) => { setLangState(l); remember.set(KEY, l); document.documentElement.lang = l; };
  const L = T[lang];
  return [{ ...L, err: (e) => L.errors[e?.code] || L.errors.FAILED }, lang, setLang];
}
