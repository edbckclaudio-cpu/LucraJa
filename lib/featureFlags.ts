export const FLAGS = {
  authFlow: "implicit" as const,
  detectSessionInUrl: false,
  revenuecatEnabled: true,
  creditsLocalCache: true,
};

export function creditsCacheKey(email: string) {
  return `lucraja:credits:${email}`;
}
