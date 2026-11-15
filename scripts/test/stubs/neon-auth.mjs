// بديل اختبار لـ @neondatabase/auth/next/server
export function createNeonAuth() {
  return {
    getSession: async () => ({ data: globalThis.__session || null }),
    handler: () => ({ GET: async () => new Response("auth-get"), POST: async () => new Response("auth-post") }),
  };
}
