import { TradingAccount, AccountStatus } from '../types';

export function getAccountStatus(acc: TradingAccount): AccountStatus {
  if (acc.status) return acc.status;
  return acc.active === false ? 'inactive' : 'active';
}

/** Accounts shown in trade form dropdown — active only */
export function getActiveAccounts(accounts: TradingAccount[]): TradingAccount[] {
  return accounts.filter(a => getAccountStatus(a) === 'active');
}

/** Account names that are archived — their trades are hidden everywhere */
export function getArchivedNames(accounts: TradingAccount[]): Set<string> {
  return new Set(accounts.filter(a => getAccountStatus(a) === 'archived').map(a => a.name));
}
