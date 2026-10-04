import Logo from "./Logo";

export default function Footer() {
  return (
    <footer>
      <Logo testId="footer-brand-logo" muted />
      <span data-testid="footer-note">Small tools. Big output.</span>
      <span>© 2026</span>
    </footer>
  );
}
