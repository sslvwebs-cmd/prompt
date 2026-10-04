import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Download, Plus, X } from "lucide-react";
import { api } from "../lib/api";

export default function AdminModal({ onClose, onAdded }) {
  const [admin, setAdmin] = useState({ title: "", description: "", tag: "NEW" });
  const [busy, setBusy] = useState(false);

  const addBundle = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post(
        "/admin/bundles",
        { ...admin, price: 299 },
        { headers: { "X-Admin-Key": window.prompt("Enter your admin key") || "" } }
      );
      onAdded(data);
      setAdmin({ title: "", description: "", tag: "NEW" });
      onClose();
      toast.success("New bundle added to the vault");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not add bundle");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div className="modal-backdrop" data-testid="admin-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div
        className="checkout-modal admin-modal"
        initial={{ opacity: 0, y: 34, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <button className="close-button" data-testid="close-admin-button" onClick={onClose} aria-label="Close creator console">
          <X />
        </button>
        <div className="eyebrow">CREATOR CONSOLE</div>
        <h2>Add a new<br /><em>bundle.</em></h2>
        <form onSubmit={addBundle}>
          <label>
            Bundle name
            <input
              required
              data-testid="admin-title-input"
              value={admin.title}
              onChange={(e) => setAdmin({ ...admin, title: e.target.value })}
              placeholder="e.g. AI Marketing Kit"
            />
          </label>
          <label>
            Short description
            <textarea
              required
              data-testid="admin-description-input"
              value={admin.description}
              onChange={(e) => setAdmin({ ...admin, description: e.target.value })}
              placeholder="What will this help people make?"
            />
          </label>
          <label>
            Tag
            <input
              data-testid="admin-tag-input"
              value={admin.tag}
              onChange={(e) => setAdmin({ ...admin, tag: e.target.value })}
            />
          </label>
          <motion.button className="pay-button" data-testid="admin-submit-button" type="submit" disabled={busy} whileTap={{ scale: 0.98 }}>
            {busy ? "Adding…" : <>Add to vault <Plus size={16} /></>}
          </motion.button>
        </form>
        <small className="secure-note"><Download size={12} /> New bundles are listed at ₹299</small>
      </motion.div>
    </motion.div>
  );
}
