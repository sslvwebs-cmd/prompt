import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle2, Download, LockKeyhole, X } from "lucide-react";
import { loadRazorpay } from "../lib/razorpay";

const DOWNLOAD_URL = "/downloads/promptforge-vault-7f3a9c.zip";

export default function CheckoutModal({ bundle, onClose }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(false);

  const startCheckout = async () => {
    if (!email.includes("@")) {
      toast.error("Enter a valid email for your receipt");
      return;
    }
    setBusy(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay checkout could not load");
      const rzp = new window.Razorpay({
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: bundle.price * 100,
        currency: "INR",
        name: "PromptForge",
        description: bundle.title,
        prefill: { email },
        theme: { color: "#b6ff55" },
        notes: { bundle: bundle.id, email },
        modal: { ondismiss: () => setBusy(false) },
        handler: () => {
          setPaid(true);
          setBusy(false);
          toast.success("Payment successful — your download is ready");
        },
      });
      rzp.on("payment.failed", (response) => {
        toast.error(response.error?.description || "Payment failed — please try again");
        setBusy(false);
      });
      rzp.open();
    } catch (error) {
      toast.error(error.message || "Could not start payment");
      setBusy(false);
    }
  };

  return (
    <motion.div className="modal-backdrop" data-testid="checkout-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div
        className="checkout-modal"
        initial={{ opacity: 0, y: 34, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <button className="close-button" data-testid="close-checkout-button" onClick={onClose} aria-label="Close checkout">
          <X />
        </button>
        {paid ? (
          <div className="success-panel" data-testid="payment-success-panel">
            <CheckCircle2 size={44} className="success-icon" />
            <h2>Payment<br /><em>confirmed.</em></h2>
            <p>{bundle.title} is yours. Download the full vault — keep the file safe.</p>
            <motion.a
              className="pay-button"
              data-testid="download-bundle-button"
              href={DOWNLOAD_URL}
              download="promptforge-bundles.zip"
              whileTap={{ scale: 0.98 }}
            >
              Download your vault <Download size={16} />
            </motion.a>
            <small className="secure-note"><LockKeyhole size={12} /> Full ZIP · {bundle.title}</small>
          </div>
        ) : (
          <>
            <div className="eyebrow">SECURE CHECKOUT</div>
            <h2>Unlock your<br /><em>{bundle.title}</em></h2>
            <p>Full ZIP bundle · instant download after payment</p>
            <label htmlFor="checkout-email">Email for your receipt</label>
            <input
              id="checkout-email"
              data-testid="checkout-email-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
            <div className="checkout-total">
              <span>Total today</span>
              <strong data-testid="checkout-total-amount">₹{bundle.price}</strong>
            </div>
            <motion.button
              className="pay-button"
              data-testid="pay-now-button"
              disabled={busy}
              onClick={startCheckout}
              whileTap={{ scale: 0.98 }}
            >
              {busy ? "Opening secure checkout…" : <>Pay securely <LockKeyhole size={16} /></>}
            </motion.button>
            <small className="secure-note"><LockKeyhole size={12} /> Razorpay secured · Test mode</small>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
