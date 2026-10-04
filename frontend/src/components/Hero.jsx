import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";

const HERO_IMG =
  "https://images.unsplash.com/photo-1787105577115-a42207979fcb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODl8MHwxfHNlYXJjaHwxfHxBSSUyMGFydCUyMHByb21wdCUyMGZ1dHVyaXN0aWMlMjBuZW9uJTIwY3liZXJwdW5rfGVufDB8fHx8MTc5MTEwNjg3OHww&ixlib=rb-4.1.0&q=85";

const line = {
  hidden: { y: "115%" },
  visible: (i) => ({
    y: 0,
    transition: { delay: 0.25 + i * 0.13, duration: 0.95, ease: [0.22, 1, 0.36, 1] },
  }),
};

const fade = {
  hidden: { opacity: 0, y: 26 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.65 + i * 0.14, duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yImage = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const yOrb = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 6]);

  return (
    <section className="hero" ref={ref}>
      <div className="hero-copy">
        <motion.div
          className="eyebrow"
          data-testid="hero-eyebrow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.7 }}
        >
          <span className="pulse-dot" /> DIGITAL PROMPTS / 2026
        </motion.div>
        <h1 data-testid="hero-heading">
          <span className="mask">
            <motion.span custom={0} variants={line} initial="hidden" animate="visible">
              Make your next
            </motion.span>
          </span>
          <span className="mask">
            <motion.span custom={1} variants={line} initial="hidden" animate="visible">
              <em>idea inevitable.</em>
            </motion.span>
          </span>
        </h1>
        <motion.p className="hero-text" data-testid="hero-description" custom={0} variants={fade} initial="hidden" animate="visible">
          Curated AI prompt bundles for people who ship, create and move faster. One payment. Instant access. Zero fluff.
        </motion.p>
        <motion.div custom={1} variants={fade} initial="hidden" animate="visible">
          <motion.a
            className="hero-cta"
            href="#vault"
            data-testid="browse-vault-button"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
          >
            Explore the vault <ArrowUpRight size={18} />
          </motion.a>
        </motion.div>
        <motion.div className="proof-row" custom={2} variants={fade} initial="hidden" animate="visible">
          <span><Check size={14} /> instant download</span>
          <span><Check size={14} /> one-time payment</span>
          <span><Check size={14} /> ₹299 each</span>
        </motion.div>
      </div>
      <div className="hero-visual" data-testid="hero-art">
        <motion.div className="orb orb-one" style={{ y: yOrb }} />
        <motion.div className="orb orb-two" />
        <motion.div
          className="frame-wrap"
          style={{ y: yImage, rotate }}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.45, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="hero-frame">
            <img src={HERO_IMG} alt="Neon-lit portrait representing AI creativity" />
            <div className="spotlight" />
            <span className="frame-tag">VAULT / 001</span>
          </div>
          <motion.div
            className="chip chip-a"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <span>01 / INPUT</span>
            <b>turn ideas into output</b>
          </motion.div>
          <motion.div
            className="chip chip-b"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <span>02 / SHIP</span>
            <b>less prompting. more making.</b>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
