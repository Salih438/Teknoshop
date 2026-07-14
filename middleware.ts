import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Hangi sayfaların korunacağını belirliyoruz (Admin paneli ve içindeki her şey)
const isProtectedRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // Eğer kullanıcı korumalı bir sayfaya girmeye çalışıyorsa ve giriş yapmamışsa, login sayfasına yönlendir
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

// Middleware'in hangi dosyalarda çalışıp hangilerinde çalışmayacağını belirten ayar
export const config = {
  matcher: [
    // Next.js'in statik dosyalarını ve resimleri es geç (site hızlı çalışsın diye)
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // API rotalarında her zaman çalış
    '/(api|trpc)(.*)',
  ],
};