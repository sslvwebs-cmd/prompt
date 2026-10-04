import { useState } from "react";
import Lenis from "lenis";
import { useEffect } from "react";
import { Toaster } from "sonner";
import "@/App.css";
import { BUNDLES } from "./data/bundles";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import VaultGrid from "./components/VaultGrid";
import HowItWorks from "./components/HowItWorks";
import Footer from "./components/Footer";
import CheckoutModal from "./components/CheckoutModal";

export default function App() {
  const [selected, setSelected] = useState(null);

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
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <VaultGrid bundles={BUNDLES} onBuy={setSelected} />
        <HowItWorks />
      </main>
      <Footer />
      {selected && <CheckoutModal bundle={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
