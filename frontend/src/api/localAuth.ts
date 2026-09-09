interface LocalAccount {
  userId: string;
  email: string;
  password: string;
}

const STORAGE_KEY = 'accroche.localAccounts';

function readAccounts(): LocalAccount[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const accounts = JSON.parse(stored) as unknown;
    return Array.isArray(accounts) ? accounts as LocalAccount[] : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: LocalAccount[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export function saveLocalAccount(account: LocalAccount) {
  const accounts = readAccounts().filter((item) => item.email !== account.email);
  writeAccounts([...accounts, account]);
}

export function createLocalAccount(email: string, password: string): string {
  const userId = crypto.randomUUID();
  saveLocalAccount({ userId, email, password });
  return userId;
}

export function authenticateLocalAccount(email: string, password: string): string | null {
  return readAccounts().find((account) => account.email === email && account.password === password)?.userId ?? null;
}
