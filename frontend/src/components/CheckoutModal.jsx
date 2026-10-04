import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle2, Download, LockKeyhole, X } from "lucide-react";
import { loadRazorpay } from "../lib/razorpay";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CheckoutModal({ bundle, onClose }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const startCheckout = async () => {
    if (!email.includes("@")) {
      toast.error("Enter a valid email for your receipt");
      return;
    }
    setBusy(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay checkout could not load");
      const { data: order } = await axios.post(`${API}/orders`, {
        bundle_id: bundle.id,
        customer_email: email,
      });
      const rzp = new window.Razorpay({
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "PromptForge",
        description: bundle.title,
        order_id: order.order_id,
        prefill: { email },
        theme: { color: "#b6ff55" },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (response) => {
          try {
            const { data } = await axios.post(`${API}/payments/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setDownloadUrl(`${process.env.REACT_APP_BACKEND_URL}/api/download/${data.download_token}`);
            setBusy(false);
            toast.success("Payment verified — your download is ready");
          } catch (error) {
            toast.error(error.response?.data?.detail || "Payment could not be verified");
            setBusy(false);
          }
        },
      });
      rzp.on("payment.failed", (response) => {
        toast.error(response.error?.description || "Payment failed — please try again");
        setBusy(false);
      });
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || "Could not start payment");
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
        {downloadUrl ? (
          <div className="success-panel" data-testid="payment-success-panel">
            <CheckCircle2 size={44} className="success-icon" />
            <h2>Payment<br /><em>verified.</em></h2>
            <p>{bundle.title} is yours. Your secure one-time download link is valid for 24 hours.</p>
            <motion.a
              className="pay-button"
              data-testid="download-bundle-button"
              href={downloadUrl}
              whileTap={{ scale: 0.98 }}
            >
              Download your vault <Download size={16} />
            </motion.a>
            <small className="secure-note"><LockKeyhole size={12} /> Server-verified · one-time link</small>
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
