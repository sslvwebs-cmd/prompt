import { useEffect, useState } from "react";
import axios from "axios";
import { toast, Toaster } from "sonner";
import { ArrowUpRight, Check, Download, LockKeyhole, Menu, Plus, Sparkles, X } from "lucide-react";
import "@/App.css";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function BundleCard({ bundle, onBuy, index }) {
  return (
    <article className="bundle-card" data-testid={`bundle-card-${bundle.id}`} style={{ animationDelay: `${index * 90}ms` }}>
      <div className="card-topline"><span className="tag" data-testid={`bundle-tag-${bundle.id}`}>{bundle.tag}</span><span className="card-number">0{index + 1}</span></div>
      <div className="icon-tile"><Sparkles size={20} /></div>
      <h3 data-testid={`bundle-title-${bundle.id}`}>{bundle.title}</h3>
      <p data-testid={`bundle-description-${bundle.id}`}>{bundle.description}</p>
      <div className="card-footer"><div><small>ONE-TIME ACCESS</small><strong data-testid={`bundle-price-${bundle.id}`}>₹{bundle.price}</strong></div><button className="buy-button" data-testid={`buy-bundle-${bundle.id}`} onClick={() => onBuy(bundle)}>Get the vault <ArrowUpRight size={17} /></button></div>
    </article>
  );
}

function App() {
  const [bundles, setBundles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [admin, setAdmin] = useState({ title: "", description: "", tag: "NEW" });

  useEffect(() => { axios.get(`${API}/bundles`).then((res) => setBundles(res.data)).catch(() => toast.error("Bundles could not load")); }, []);

  const startCheckout = async () => {
    if (!selected || !email.includes("@")) return toast.error("Enter a valid email for your receipt");
    setBusy(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay checkout could not load");
      const { data: order } = await axios.post(`${API}/orders`, { bundle_id: selected.id, customer_email: email });
      const options = { key: order.key_id, amount: order.amount, currency: order.currency, name: "PromptForge", description: selected.title, order_id: order.order_id, prefill: { email }, theme: { color: "#a6ff4d" }, handler: async (response) => {
        const { data } = await axios.post(`${API}/payments/verify`, response);
        window.location.href = `${process.env.REACT_APP_BACKEND_URL}${data.download_url}`;
      }, modal: { ondismiss: () => setBusy(false) } };
      new window.Razorpay(options).open();
    } catch (error) { toast.error(error.response?.data?.detail || "Could not start payment"); setBusy(false); }
  };

  const addBundle = async (event) => {
    event.preventDefault();
    try {
      const { data } = await axios.post(`${API}/admin/bundles`, { ...admin, price: 299 }, { headers: { "X-Admin-Key": prompt("Enter your admin key") } });
      setBundles((items) => [...items, data]); setAdmin({ title: "", description: "", tag: "NEW" }); setShowAdmin(false); toast.success("New bundle added");
    } catch (error) { toast.error(error.response?.data?.detail || "Could not add bundle"); }
  };

  return <div className="storefront"><Toaster theme="dark" position="top-center" /><nav className="nav"><a className="logo" href="#top" data-testid="brand-logo"><span>PF</span> PROMPTFORGE</a><div className="nav-links"><a href="#vault" data-testid="nav-vault-link">The vault</a><a href="#how" data-testid="nav-how-link">How it works</a><button className="admin-link" data-testid="open-admin-button" onClick={() => setShowAdmin(true)}>Creator console <Plus size={14} /></button></div><button className="menu-button" data-testid="mobile-menu-button"><Menu size={19} /></button></nav>
    <main id="top"><section className="hero"><div className="hero-copy"><div className="eyebrow" data-testid="hero-eyebrow"><span className="pulse-dot" /> DIGITAL PROMPTS / 2026</div><h1 data-testid="hero-heading">Make your next<br /><em>idea inevitable.</em></h1><p className="hero-text" data-testid="hero-description">Curated AI prompt bundles for people who ship, create and move faster. One payment. Instant access. Zero fluff.</p><a className="hero-cta" href="#vault" data-testid="browse-vault-button">Explore the vault <ArrowUpRight size={18} /></a><div className="proof-row"><span><Check size={14} /> instant download</span><span><Check size={14} /> one-time payment</span><span><Check size={14} /> ₹299 each</span></div></div><div className="hero-art" aria-label="Abstract neon prompt vault illustration" data-testid="hero-art"><div className="orb orb-one" /><div className="orb orb-two" /><div className="hero-grid" /><div className="floating-card card-a"><span>01 / INPUT</span><b>turn ideas<br />into output</b></div><div className="floating-card card-b"><span>02 / SHIP</span><b>less prompting.<br />more making.</b></div><div className="hero-stamp">PROMPTS<br /><strong>THAT<br />WORK</strong></div></div></section>
      <section className="stats"><div><strong data-testid="bundle-count">{bundles.length || "—"}</strong><span>bundles in the vault</span></div><div><strong>₹299</strong><span>simple, always</span></div><div><strong>∞</strong><span>ways to create</span></div><div className="stats-note">Built for the<br /><b>in-between.</b></div></section>
      <section className="vault-section" id="vault"><div className="section-heading"><div><div className="eyebrow">CURATED COLLECTIONS</div><h2 data-testid="vault-heading">Pick your unfair<br /><em>advantage.</em></h2></div><p>Every bundle is built around a real creative workflow — so you can stop staring at the blank page.</p></div><div className="bundle-grid">{bundles.map((bundle, index) => <BundleCard key={bundle.id} bundle={bundle} index={index} onBuy={setSelected} />)}</div></section>
      <section className="how-section" id="how"><div className="eyebrow">NO MYSTERY, JUST MOMENTUM</div><h2>From blank page<br /><em>to shipped.</em></h2><div className="steps"><div><span>01</span><h3>Choose your kit</h3><p>Find the prompts that match what you’re making next.</p></div><div><span>02</span><h3>Pay once</h3><p>Secure Razorpay checkout. No subscription, no surprise.</p></div><div><span>03</span><h3>Make more</h3><p>Download the full vault instantly and start creating.</p></div></div></section>
    </main><footer><a className="logo" href="#top" data-testid="footer-brand-logo"><span>PF</span> PROMPTFORGE</a><span data-testid="footer-note">Small tools. Big output.</span><span>© 2026</span></footer>
    {selected && <div className="modal-backdrop" data-testid="checkout-modal"><div className="checkout-modal"><button className="close-button" data-testid="close-checkout-button" onClick={() => setSelected(null)}><X /></button><div className="eyebrow">SECURE CHECKOUT</div><h2>Unlock your<br /><em>{selected.title}</em></h2><p>Full ZIP bundle · instant download after payment</p><label htmlFor="email">Email for your receipt</label><input id="email" data-testid="checkout-email-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /><div className="checkout-total"><span>Total today</span><strong>₹{selected.price}</strong></div><button className="pay-button" data-testid="pay-now-button" disabled={busy} onClick={startCheckout}>{busy ? "Opening secure checkout…" : <>Pay securely <LockKeyhole size={16} /></>}</button><small className="secure-note"><LockKeyhole size={12} /> Razorpay secured · Test mode</small></div></div>}
    {showAdmin && <div className="modal-backdrop" data-testid="admin-modal"><div className="checkout-modal admin-modal"><button className="close-button" data-testid="close-admin-button" onClick={() => setShowAdmin(false)}><X /></button><div className="eyebrow">CREATOR CONSOLE</div><h2>Add a new<br /><em>bundle.</em></h2><form onSubmit={addBundle}><label>Bundle name<input required data-testid="admin-title-input" value={admin.title} onChange={(e) => setAdmin({ ...admin, title: e.target.value })} placeholder="e.g. AI Marketing Kit" /></label><label>Short description<textarea required data-testid="admin-description-input" value={admin.description} onChange={(e) => setAdmin({ ...admin, description: e.target.value })} placeholder="What will this help people make?" /></label><label>Tag<input data-testid="admin-tag-input" value={admin.tag} onChange={(e) => setAdmin({ ...admin, tag: e.target.value })} /></label><button className="pay-button" data-testid="admin-submit-button" type="submit">Add to vault <Plus size={16} /></button></form><small className="secure-note"><Download size={12} /> New bundles are listed at ₹299</small></div></div>}
  </div>;
}

export default App;