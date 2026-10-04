import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import Reveal from "./Reveal";

const FEATURED_IMG =
  "https://images.unsplash.com/photo-1760931969401-9bd6ee902798?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODl8MHwxfHNlYXJjaHwyfHxBSSUyMGFydCUyMHByb21wdCUyMGZ1dHVyaXN0aWMlMjBuZW9uJTIwY3liZXJwdW5rfGVufDB8fHx8MTc5MTEwNjg3OHww&ixlib=rb-4.1.0&q=85";

function BundleCard({ bundle, index, onBuy }) {
  const featured = index === 0;
  return (
    <motion.article
      className={`bento-card${featured ? " featured" : ""}`}
      data-testid={`bundle-card-${bundle.id}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
    >
      {featured && (
        <div className="card-image">
          <img src={FEATURED_IMG} alt="" aria-hidden="true" />
          <div className="spotlight" />
        </div>
      )}
      <div className="card-topline">
        <span className="tag" data-testid={`bundle-tag-${bundle.id}`}>{bundle.tag}</span>
        <span className="card-number">0{index + 1}</span>
      </div>
      <div className="icon-tile"><Sparkles size={20} /></div>
      <h3 data-testid={`bundle-title-${bundle.id}`}>{bundle.title}</h3>
      <p data-testid={`bundle-description-${bundle.id}`}>{bundle.description}</p>
      <div className="card-footer">
        <div>
          <small>ONE-TIME ACCESS</small>
          <strong data-testid={`bundle-price-${bundle.id}`}>₹{bundle.price}</strong>
        </div>
        <motion.button
          className="buy-button"
          data-testid={`buy-bundle-${bundle.id}`}
          onClick={() => onBuy(bundle)}
          whileTap={{ scale: 0.96 }}
        >
          Get the vault <ArrowUpRight size={17} />
        </motion.button>
      </div>
    </motion.article>
  );
}

export default function VaultGrid({ bundles, onBuy }) {
  return (
    <section className="vault-section" id="vault">
      <Reveal className="section-heading">
        <div>
          <div className="eyebrow">CURATED COLLECTIONS</div>
          <h2 data-testid="vault-heading">
            Pick your unfair<br /><em>advantage.</em>
          </h2>
        </div>
        <p>Every bundle is built around a real creative workflow — so you can stop staring at the blank page.</p>
      </Reveal>
      <div className="bento-grid" data-testid="vault-grid">
        {bundles.map((bundle, index) => (
          <BundleCard key={bundle.id} bundle={bundle} index={index} onBuy={onBuy} />
        ))}
      </div>
    </section>
  );
}
