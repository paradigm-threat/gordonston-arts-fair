import {UserStatus} from '@types';
import {getRegistrationOpenDate} from '@util/date';

const CYCLE_LOOKBACK_DAYS = 183;

export interface FeeTransactionLike {
  type?: string;
  amount?: number | string | null;
  createdAt?: Date | string | null;
}

/** Start of the current fee cycle: ~6 months before registration opens. */
export function getFeeCycleStartDate(): Date {
  const open = getRegistrationOpenDate();
  return new Date(open.getTime() - CYCLE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
}

export function hasPaidFeeThisCycle(
  transactions: FeeTransactionLike[],
  amounts: number[],
): boolean {
  const cycleStart = getFeeCycleStartDate();
  const allowed = new Set(amounts.filter((n) => !Number.isNaN(n)));
  return transactions.some((transaction) => {
    if (transaction.type && transaction.type !== 'charge.succeeded') return false;
    const amount = parseInt(`${transaction.amount}`, 10);
    if (!allowed.has(amount)) return false;
    if (!transaction.createdAt) return false;
    const created = new Date(transaction.createdAt);
    if (Number.isNaN(created.getTime())) return false;
    return created >= cycleStart;
  });
}

function registrationFeeAmount() {
  return parseInt(`${process.env.NEXT_PUBLIC_REGISTRATION_FEE}`, 10);
}

function boothFeeAmounts() {
  return [
    parseInt(`${process.env.NEXT_PUBLIC_BOOTH_FEE}`, 10),
    parseInt(`${process.env.NEXT_PUBLIC_BOOTH_DOUBLE_FEE}`, 10),
  ];
}

const REGISTRATION_PAID_STATUSES: UserStatus[] = [
  'submitted',
  'approved',
  'standby',
  'declined',
  'paid',
];

export function hasPaidRegistrationThisCycle(
  transactions: FeeTransactionLike[],
  status?: UserStatus,
): boolean {
  if (status && REGISTRATION_PAID_STATUSES.includes(status)) return true;
  return hasPaidFeeThisCycle(transactions, [registrationFeeAmount()]);
}

export function hasPaidBoothThisCycle(
  transactions: FeeTransactionLike[],
  status?: UserStatus,
): boolean {
  if (status === 'paid') return true;
  return hasPaidFeeThisCycle(transactions, boothFeeAmounts());
}

export function hasPriorCycleRegistrationPayment(transactions: FeeTransactionLike[]): boolean {
  const cycleStart = getFeeCycleStartDate();
  const fee = registrationFeeAmount();
  return transactions.some((transaction) => {
    if (transaction.type && transaction.type !== 'charge.succeeded') return false;
    if (parseInt(`${transaction.amount}`, 10) !== fee) return false;
    if (!transaction.createdAt) return false;
    const created = new Date(transaction.createdAt);
    return !Number.isNaN(created.getTime()) && created < cycleStart;
  });
}

export function hasPriorCycleBoothPayment(transactions: FeeTransactionLike[]): boolean {
  const cycleStart = getFeeCycleStartDate();
  const allowed = new Set(boothFeeAmounts().filter((n) => !Number.isNaN(n)));
  return transactions.some((transaction) => {
    if (transaction.type && transaction.type !== 'charge.succeeded') return false;
    const amount = parseInt(`${transaction.amount}`, 10);
    if (!allowed.has(amount)) return false;
    if (!transaction.createdAt) return false;
    const created = new Date(transaction.createdAt);
    return !Number.isNaN(created.getTime()) && created < cycleStart;
  });
}

/**
 * Last year's exhibitors may request a homepage feature.
 * Imported roster rows and prior-cycle $15 / booth payments count as last year's Art Fair.
 */
export function canRequestWebsiteFeature(
  transactions: FeeTransactionLike[],
  status?: UserStatus,
): boolean {
  if (status === 'imported') return true;
  return hasPriorCycleRegistrationPayment(transactions)
    || hasPriorCycleBoothPayment(transactions);
}
