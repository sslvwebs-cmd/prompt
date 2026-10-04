import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import Logo from "./Logo";

export default function Nav() {
  return (
    <motion.header
      className="nav"
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="nav-inner">
        <Logo />
        <div className="nav-links">
          <a href="#vault" data-testid="nav-vault-link">The vault</a>
          <a href="#how" data-testid="nav-how-link">How it works</a>
        </div>
        <button className="menu-button" data-testid="mobile-menu-button" aria-label="Menu">
          <Menu size={19} />
        </button>
      </div>
    </motion.header>
  );
}
