import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthCartSync from "@/components/AuthCartSync";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthCartSync />
      <div className="flex flex-col min-h-screen overflow-x-hidden">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto p-4 w-full">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}

