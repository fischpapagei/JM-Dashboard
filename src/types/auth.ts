export type UserRole = 'ministry' | 'jva';

export interface AuthUser {
  username: string;
  role: UserRole;
  displayName: string;
  jvaId?: string;
}
