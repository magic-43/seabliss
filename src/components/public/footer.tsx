import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'
import { getContactLinks, type PublicSettings } from '@/lib/public/content'
import Brand from './brand'

export default function Footer({ settings }: { settings: PublicSettings | null }) {
  const links = getContactLinks(settings)
  return <footer id="contact" className="public-footer"><div className="public-container">
    <div className="public-footer-grid">
      <div className="public-footer-brand"><Brand /></div>
      <nav aria-label="Footer navigation"><h2>Explore</h2><Link href="/">Home</Link><Link href="/rooms">Accommodations</Link><Link href="/experiences">Experiences</Link><Link href="/private-gatherings">Private Gatherings</Link></nav>
      <nav aria-label="About the resort"><h2>About</h2><Link href="/about">Our Story</Link><Link href="/contact#stay-information">Stay Information</Link><Link href="/dining">Dining</Link><Link href="/contact">Contact</Link></nav>
      <div className="public-footer-contact"><h2>Connect With Us</h2><address>{links.telephone && <a href={links.telephone}><Phone size={14} aria-hidden="true" />{settings?.contact_phone}</a>}{links.mail && <a href={links.mail}><Mail size={14} aria-hidden="true" />{settings?.contact_email}</a>}<p><MapPin size={14} aria-hidden="true" />{settings?.address?.trim() || 'Lian, Batangas, Philippines'}</p></address>{!links.telephone && !links.mail && !links.facebook && <p className="public-contact-unavailable">Contact details are being updated. Please check back shortly.</p>}</div>
      <div className="public-footer-social"><h2>Follow Us</h2><div className="public-socials">{links.facebook && <a href={links.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook (opens in a new tab)"><svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 22v-9h3l.5-3.5h-3.5V7.3c0-1 .3-1.8 1.8-1.8h1.9V2.4c-.3 0-1.5-.2-2.8-.2-2.8 0-4.7 1.7-4.7 4.8v2.5H6.5V13h3.2v9z" /></svg></a>}</div><a href="/reserve" className="public-footer-inquiry">Plan your stay <ArrowUpRight size={13} aria-hidden="true" /></a></div>
    </div>
    <div className="public-footer-bottom"><p>© {new Date().getFullYear()} Seabliss Beach Resort. All rights reserved.</p><Link href="#home">Back to top ↑</Link></div>
  </div></footer>
}
