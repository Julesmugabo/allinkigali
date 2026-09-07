/**
 * orderStatus.js — Intambwe zose ikigemuriwe kinyuramo.
 * The order lifecycle, in one place, so the timeline and the badges can never
 * disagree with each other.
 */
import colors from '../theme/colors';

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  DISPATCHED: 'dispatched',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

/**
 * The happy path, in order. The timeline draws exactly these four steps and
 * fills them in up to the order's current status.
 */
export const STATUS_FLOW = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.DISPATCHED,
  ORDER_STATUS.DELIVERED,
];

export const STATUS_META = {
  [ORDER_STATUS.PENDING]: {
    label: 'Byakiriwe',
    description: 'Icyifuzo cyawe cyakiriwe, turacyemeza.',
    icon: 'receipt',
    color: colors.blue500,
    tint: colors.blue100,
  },
  [ORDER_STATUS.CONFIRMED]: {
    label: 'Byemejwe',
    description: 'Twemeje icyifuzo, gaz irimo gutegurwa.',
    icon: 'check-circle-outline',
    color: colors.blue600,
    tint: colors.blue100,
  },
  [ORDER_STATUS.DISPATCHED]: {
    label: 'Biri mu nzira',
    description: 'Umumotari afite ibicuruzwa byawe, aragenda.',
    icon: 'moped',
    color: colors.warning,
    tint: '#FAEEDA',
  },
  [ORDER_STATUS.DELIVERED]: {
    label: 'Byatanzwe',
    description: 'Ibicuruzwa byagejejwe aho wari uri.',
    icon: 'package-variant-closed-check',
    color: colors.success,
    tint: '#E4F4EA',
  },
  [ORDER_STATUS.CANCELLED]: {
    label: 'Byahagaritswe',
    description: 'Icyifuzo cyahagaritswe.',
    icon: 'close-circle-outline',
    color: colors.danger,
    tint: '#FBE9E8',
  },
};

export function getStatusMeta(status) {
  return STATUS_META[status] || STATUS_META[ORDER_STATUS.PENDING];
}

/**
 * How far along the flow an order is: 0-based index, -1 when cancelled.
 */
export function statusIndex(status) {
  return STATUS_FLOW.indexOf(status);
}

export function isCancelled(status) {
  return status === ORDER_STATUS.CANCELLED;
}

/**
 * An order can only be called off before it leaves the depot.
 */
export function canCancel(status) {
  return status === ORDER_STATUS.PENDING || status === ORDER_STATUS.CONFIRMED;
}

export default { ORDER_STATUS, STATUS_FLOW, STATUS_META, getStatusMeta };
