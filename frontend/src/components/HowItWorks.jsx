import Reveal from "./Reveal";

const STEPS = [
  { n: "01", title: "Choose your kit", text: "Find the prompts that match what you’re making next." },
  { n: "02", title: "Pay once", text: "Secure Razorpay checkout. No subscription, no surprise." },
  { n: "03", title: "Make more", text: "Download the full vault instantly and start creating." },
];

export default function HowItWorks() {
  return (
    <section className="how-section" id="how">
      <Reveal>
        <div className="eyebrow">NO MYSTERY, JUST MOMENTUM</div>
        <h2>
          From blank page<br /><em>to shipped.</em>
        </h2>
      </Reveal>
      <div className="steps">
        {STEPS.map((step, i) => (
          <Reveal key={step.n} delay={i * 0.12} data-testid={`how-step-${step.n}`}>
            <span>{step.n}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
