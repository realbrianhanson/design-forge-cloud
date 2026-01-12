import { Link } from 'react-router-dom';
import { Twitter, Facebook, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import logo from '@/assets/logo.png';

const sectionLinks = [
  { label: 'Local News', href: '/news?category=local' },
  { label: 'Crime & Safety', href: '/news/crime' },
  { label: 'Politics', href: '/news?category=politics' },
  { label: 'Business', href: '/news?category=business' },
  { label: 'Sports', href: '/news?category=sports' },
  { label: 'Entertainment', href: '/news?category=entertainment' },
];

const companyLinks = [
  { label: 'About Us', href: '/news' },
  { label: 'Neighborhoods', href: '/neighborhoods' },
  { label: 'Weather', href: '/weather' },
  { label: 'Crime Map', href: '/crime' },
  { label: 'Newsletter', href: '/newsletter' },
];
const legalLinks = [
  { label: 'Privacy Policy', href: '/news' },
  { label: 'Terms of Service', href: '/news' },
];

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main Footer Content */}
      <div className="container-news py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <img src={logo} alt="904 News" className="h-10 w-auto brightness-0 invert" />
            </Link>
            <p className="text-sm text-primary-foreground/70 leading-relaxed mb-6">
              Jacksonville's trusted source for local news, events, and community connection. 
              Keeping you informed since 2024.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors duration-200"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors duration-200"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors duration-200"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Sections Column */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-foreground mb-4">
              Sections
            </h3>
            <ul className="space-y-3">
              {sectionLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-foreground mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Column */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-foreground mb-4">
              Stay Updated
            </h3>
            <p className="text-sm text-primary-foreground/70 mb-4">
              Get the latest Jacksonville news delivered to your inbox.
            </p>
            <form className="flex" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 rounded-r-none focus:border-accent focus:ring-accent"
              />
              <Button
                type="submit"
                className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-l-none px-4"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container-news py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-primary-foreground/50">
              © 2026 904News. All rights reserved.
            </p>
            <nav className="flex items-center gap-6">
              {legalLinks.map((link, index) => (
                <span key={link.href} className="flex items-center gap-6">
                  <Link
                    to={link.href}
                    className="text-sm text-primary-foreground/50 hover:text-primary-foreground/70 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                  {index < legalLinks.length - 1 && (
                    <span className="text-primary-foreground/20">|</span>
                  )}
                </span>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
