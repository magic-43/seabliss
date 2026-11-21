'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import ResortImage from './resort-image'

export default function RoomGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0)
  const dialog = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLButtonElement>(null)
  const previousOverflow = useRef<string | null>(null)
  const pointerStart = useRef<number | null>(null)
  const swiped = useRef(false)
  useEffect(() => () => {
    if (previousOverflow.current !== null) document.documentElement.style.overflow = previousOverflow.current
  }, [])
  function move(direction: number) { setActive(index => (index + direction + images.length) % images.length) }
  function close() { dialog.current?.close() }
  function restore() {
    if (previousOverflow.current !== null) document.documentElement.style.overflow = previousOverflow.current
    previousOverflow.current = null
    opener.current?.focus({ preventScroll: true })
  }
  function open() {
    if (swiped.current) { swiped.current = false; return }
    previousOverflow.current = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    dialog.current?.showModal()
  }
  function keys(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1) }
    if (event.key === 'Tab') {
      const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button')
      const first = buttons[0], last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
  }
  if (!images.length) return <div className="public-room-gallery"><div className="public-gallery-main"><ResortImage alt={name} sizes="100vw" /></div></div>
  const photo = <ResortImage src={images[active]} alt={name + ' — photograph ' + (active + 1)} sizes="(min-width: 1440px) 1440px, 100vw" preload={active === 0} />
  return <div className="public-room-gallery" role="region" aria-label={name + ' photographs'}>
    <button ref={opener} type="button" className="public-gallery-main" aria-label={'Open full-screen photographs of ' + name} onClick={open} onPointerDown={event => { pointerStart.current = event.clientX; swiped.current = false }} onPointerCancel={() => { pointerStart.current = null }} onPointerUp={event => { if (pointerStart.current !== null && Math.abs(event.clientX - pointerStart.current) > 45) { move(event.clientX < pointerStart.current ? 1 : -1); swiped.current = true } pointerStart.current = null }}>{photo}<span className="public-gallery-expand"><Expand size={18} aria-hidden="true" />View gallery</span></button>
    <div className="public-gallery-toolbar"><p aria-live="polite" aria-atomic="true">Photograph {active + 1} of {images.length}</p><div><button type="button" onClick={() => move(-1)} aria-label="Previous photograph"><ChevronLeft aria-hidden="true" /></button><button type="button" onClick={() => move(1)} aria-label="Next photograph"><ChevronRight aria-hidden="true" /></button></div></div>
    <div className="public-gallery-thumbnails" aria-label="Select a photograph">{images.map((src, index) => <button key={src + index} type="button" aria-label={'Show photograph ' + (index + 1)} aria-pressed={active === index} onClick={() => setActive(index)}><ResortImage src={src} alt="" sizes="130px" /></button>)}</div>
    <dialog ref={dialog} className="public-lightbox" aria-label={name + ' full-screen gallery'} onKeyDown={keys} onClose={restore}>
      <div className="public-lightbox-top"><p>{name} · {active + 1} / {images.length}</p><button type="button" autoFocus onClick={close} aria-label="Close photo gallery"><X aria-hidden="true" /></button></div>
      <div className="public-lightbox-photo"><ResortImage src={images[active]} alt={name + ' — photograph ' + (active + 1)} sizes="100vw" /></div>
      <div className="public-lightbox-controls"><button type="button" onClick={() => move(-1)} aria-label="Previous full-screen photograph"><ChevronLeft aria-hidden="true" />Previous</button><button type="button" onClick={() => move(1)} aria-label="Next full-screen photograph">Next<ChevronRight aria-hidden="true" /></button></div>
    </dialog>
  </div>
}
