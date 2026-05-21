export type UserStatus = 'guest' | 'authenticated_unpaid' | 'authenticated_paid';

export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  createdAt: string;
}

export interface Child {
  id: string;
  nickname: string;
  avatar?: string;
  birthday?: string;
  gender?: string;
  guardianIP?: 'moon' | 'firefly' | 'star';
  guardianSpiritId?: 'moon' | 'firefly' | 'star';
  sleepProblems?: string[];
  createdAt: string;
}

export interface UserState {
  status: UserStatus;
  isAuthenticated: boolean;
  isPaid: boolean;
  user?: User;
  child?: Child;
  lastVisitTime?: string;
  visitCount: number;
}

export const INITIAL_USER_STATE: UserState = {
  status: 'guest',
  isAuthenticated: false,
  isPaid: false,
  visitCount: 0,
};

export function determineUserStatus(isAuthenticated: boolean, isPaid: boolean): UserStatus {
  if (!isAuthenticated) {
    return 'guest';
  }
  return isPaid ? 'authenticated_paid' : 'authenticated_unpaid';
}
