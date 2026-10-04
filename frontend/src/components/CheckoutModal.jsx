import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { LockKeyhole, X } from "lucide-react";
import { api, loadRazorpay } from "../lib/api";

export default function CheckoutModal({ bundle, onClose }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const startCheckout = async () => {
    if (!email.includes("@")) {
      toast.error("Enter a valid email for your receipt");
      return;
    }
    setBusy(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay checkout could not load");
      const { data: order } = await api.post("/orders", { bundle_id: bundle.id, customer_email: email });
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
            const { data } = await api.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Payment verified — your download is starting");
            window.location.href = `${process.env.REACT_APP_BACKEND_URL}/api/download/${data.download_token}`;
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
    <motion.div
      className="modal-backdrop"
      data-testid="checkout-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="checkout-modal"
        initial={{ opacity: 0, y: 34, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <button className="close-button" data-testid="close-checkout-button" onClick={onClose} aria-label="Close checkout">
          <X />
        </button>
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
      </motion.div>
    </motion.div>
  );
}
