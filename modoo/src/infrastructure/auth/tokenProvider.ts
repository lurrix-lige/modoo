export interface TokenProvider {
  isAuthenticated(): boolean;
  isSessionTimedOut(): boolean;
  isTokenExpiringSoon(): boolean;
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  refreshAccessToken(): Promise<string>;
  clearAuth(): Promise<void>;
  recordActivity(): void;
}

let tokenProvider: TokenProvider | null = null;

export function setTokenProvider(provider: TokenProvider): void {
  tokenProvider = provider;
}

export function getTokenProvider(): TokenProvider {
  if (!tokenProvider) {
    throw new Error('TokenProvider not initialized. Call setTokenProvider() first.');
  }
  return tokenProvider;
}
