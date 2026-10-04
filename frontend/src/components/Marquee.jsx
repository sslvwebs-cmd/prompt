const ITEMS = [
  "PROMPTS THAT SHIP",
  "₹299 FLAT",
  "INSTANT ZIP DOWNLOAD",
  "RAZORPAY SECURED",
  "NO SUBSCRIPTIONS",
  "MADE FOR MAKERS",
];

export default function Marquee() {
  const row = (key) => (
    <div className="marquee-row" key={key} aria-hidden={key === "b"}>
      {ITEMS.map((item) => (
        <span key={`${key}-${item}`}>
          {item} <em>✦</em>
        </span>
      ))}
    </div>
  );
  return (
    <div className="marquee" data-testid="editorial-marquee">
      <div className="marquee-track">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
