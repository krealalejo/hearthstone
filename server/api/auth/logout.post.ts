export default defineEventHandler((event) => {
  deleteCookie(event, "access_token");
  deleteCookie(event, "refresh_token");
  return { ok: true };
});
