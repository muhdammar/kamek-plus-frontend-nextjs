import { auth } from "@/auth";

export default auth;

export const config = {
  // Exclude /api/auth (NextAuth handler) and static assets from proxy.
  // To protect additional API routes in the future, replace the /api exclusion
  // with a more specific pattern such as (?!api/auth).
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
