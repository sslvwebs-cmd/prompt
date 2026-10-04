import { useEffect, useState } from "react";
import Lenis from "lenis";
import { Toaster, toast } from "sonner";
import "@/App.css";
import { api } from "./lib/api";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import VaultGrid from "./components/VaultGrid";
import HowItWorks from "./components/HowItWorks";
import Footer from "./components/Footer";
import CheckoutModal from "./components/CheckoutModal";
import AdminModal from "./components/AdminModal";

export default function App() {
  const [bundles, setBundles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    api.get("/bundles").then((res) => setBundles(res.data)).catch(() => toast.error("Bundles could not load"));
  }, []);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    let frame;
    const raf = (time) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="storefront" id="top">
      <div className="noise" aria-hidden="true" />
      <Toaster theme="dark" position="top-center" />
      <Nav onOpenAdmin={() => setShowAdmin(true)} />
      <main>
        <Hero bundleCount={bundles.length} />
        <Marquee />
        <VaultGrid bundles={bundles} onBuy={setSelected} />
        <HowItWorks />
      </main>
      <Footer />
      {selected && <CheckoutModal bundle={selected} onClose={() => setSelected(null)} />}
      {showAdmin && (
        <AdminModal
          onClose={() => setShowAdmin(false)}
          onAdded={(bundle) => setBundles((items) => [...items, bundle])}
        />
      )}
    </div>
  );
}
