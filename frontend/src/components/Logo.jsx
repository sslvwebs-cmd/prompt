export default function Logo({ testId = "brand-logo", muted = false }) {
  return (
    <a className={`logo${muted ? " logo-muted" : ""}`} href="#top" data-testid={testId}>
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true" className="logo-mark">
        <rect width="32" height="32" rx="8" fill="#b6ff55" />
        <path d="M18 3 8.5 17.5h5.6L12 29l9.5-14.5h-5.6L18 3z" fill="#0a0d0a" />
      </svg>
      <span>PROMPTFORGE</span>
    </a>
  );
}
