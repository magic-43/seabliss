'use client'

import { useState } from 'react'

export default function FAQSection({ items, id = 'questions' }: { items: { question: string; answer: string }[]; id?: string }) {
  const [open, setOpen] = useState<number | null>(null)
  return <section id={id} className="public-faq public-section"><div className="public-container public-faq-grid">
    <div className="public-faq-heading" data-reveal><p className="public-eyebrow">FAQ</p><h2>Frequently Asked<br />Questions</h2><p>Find quick answers to common questions about your stay at Seabliss.</p></div>
    <div>{items.map(({ question, answer }, index) => <div key={question} className="t-acc public-faq-item" data-open={open === index}>
      <h3><button type="button" id={`faq-question-${index}`} className="t-acc-head" aria-expanded={open === index} aria-controls={`faq-answer-${index}`} onClick={() => setOpen(open === index ? null : index)}>{question}<span className="t-acc-chevron"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="M4 6.5L8 10.5L12 6.5" /></svg></span></button></h3>
      <div id={`faq-answer-${index}`} role="region" aria-labelledby={`faq-question-${index}`} aria-hidden={open !== index} inert={open !== index} className="t-acc-panel"><div className="t-acc-panel-inner"><p>{answer}</p></div></div>
    </div>)}</div>
  </div></section>
}
