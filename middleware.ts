import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Hangi sayfaların ve API'lerin korunacağını belirliyoruz (Admin, Admin API, Profil, Ödeme ve Sipariş Onay)
const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)',
  '/profile(.*)',
  '/checkout(.*)',
  '/order-success(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Eğer kullanıcı korumalı bir sayfaya girmeye çalışıyorsa ve giriş yapmamışsa, login sayfasına yönlendir
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
}, {
  // Production ve Vercel proxy yönlendirmelerinde Clerk Frontend API isteklerini otomatik yönet
  frontendApiProxy: {
    enabled: true,
  },
});

// Middleware'in hangi dosyalarda çalışıp hangilerinde çalışmayacağını belirten ayar
export const config = {
  matcher: [
    // Clerk Frontend API proxy rotaları (statik dosya filtresi tarafından atlanmasın)
    '/__clerk/(.*)',
    // Next.js'in statik dosyalarını ve resimleri es geç (site hızlı çalışsın diye)
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // API rotalarında her zaman çalış
    '/(api|trpc)(.*)',
  ],
};