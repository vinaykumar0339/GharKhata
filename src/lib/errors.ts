export function friendlyError(error: unknown, fallback: string) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code.includes('network')) return 'You appear to be offline. Your changes will sync when you reconnect.';
  if (code.includes('auth/email-already-in-use')) return 'An account already exists for this email.';
  if (code.includes('auth/invalid-credential')) return 'That email or password is not correct.';
  if (code.includes('permission-denied')) return 'You do not have permission to perform that action.';
  return fallback;
}
