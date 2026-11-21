import { getContactLinks, type PublicSettings } from '@/lib/public/content'

export default function ContactDetails({ settings }: { settings: PublicSettings | null }) {
  const links = getContactLinks(settings)
  return <div className="public-contact-details">
    <div><h2>Find Us by the Sea</h2><address>{settings?.address?.trim() || 'Lian, Batangas, Philippines'}</address><p>Contact management for directions and arrival arrangements.</p></div>
    <div><h2>Speak With Our Team</h2>{links.telephone && <a href={links.telephone}><span>Phone</span>{settings?.contact_phone}</a>}{links.mail && <a href={links.mail}><span>Email</span>{settings?.contact_email}</a>}{links.facebook && <a href={links.facebook} target="_blank" rel="noopener noreferrer"><span>Facebook</span>Contact Seabliss on Facebook<span className="sr-only"> (opens in a new tab)</span></a>}{links.instagram && <a href={links.instagram} target="_blank" rel="noopener noreferrer"><span>Instagram</span>Seabliss Beach Resort<span className="sr-only"> (opens in a new tab)</span></a>}{!links.telephone && !links.mail && !links.facebook && <p>Contact details are being updated. Please check back shortly.</p>}</div>
  </div>
}
