import type { AuthUser } from '../types/auth';
import { JVAS } from './jvas';

export const MINISTRY_USERNAME = 'ministerium';
export const MINISTRY_PASSWORD = 'jm2026';
export const JVA_PASSWORD = 'jva2026';

export const MINISTRY_USER: AuthUser = {
  username: MINISTRY_USERNAME,
  role: 'ministry',
  displayName: 'Justizministerium NRW',
};

export const JVA_USERS: AuthUser[] = JVAS.map((jva) => ({
  username: `jva-${jva.id.replace(/^jva-/, '')}`,
  role: 'jva',
  displayName: jva.name,
  jvaId: jva.id,
}));

const USER_INDEX: Record<string, AuthUser> = {
  [MINISTRY_USERNAME]: MINISTRY_USER,
};
for (const user of JVA_USERS) {
  USER_INDEX[user.username] = user;
}

export function authenticate(username: string, password: string): AuthUser | null {
  const normalized = username.trim().toLowerCase();
  const user = USER_INDEX[normalized];
  if (!user) {
    return null;
  }
  if (user.role === 'ministry' && password === MINISTRY_PASSWORD) {
    return user;
  }
  if (user.role === 'jva' && password === JVA_PASSWORD) {
    return user;
  }
  return null;
}
export function getDemoCredentials(): { role: string; username: string; password: string }[] {
  return [
    { role: 'Justizministerium', username: MINISTRY_USERNAME, password: MINISTRY_PASSWORD },
    { role: 'JVA (Beispiel Aachen)', username: 'jva-aachen', password: JVA_PASSWORD },
    { role: 'JVA (alle)', username: 'jva-[slug]', password: JVA_PASSWORD },
  ];
}
