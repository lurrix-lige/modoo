export function normalizeSleepProblems(sleepProblems: string | string[] | undefined): string[] {
  if (!sleepProblems) return [];
  return Array.isArray(sleepProblems) ? sleepProblems : sleepProblems.split(',').filter(Boolean);
}

export function parseGender(gender: string | undefined): 'male' | 'female' {
  return (gender === 'male' || gender === 'female') ? gender : 'male';
}

export function parseGuardianSpiritId(id: string | undefined): 'moon' | 'firefly' | 'star' {
  return (id === 'moon' || id === 'firefly' || id === 'star') ? id : 'moon';
}

export function parseGuardianIP(ip: string | undefined): 'moon' | 'firefly' | 'star' {
  return parseGuardianSpiritId(ip);
}

export function withDefault<T>(value: T | null | undefined, defaultValue: T): T {
  return value ?? defaultValue;
}
