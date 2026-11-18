import { useEffect, useState, useRef } from 'react';
import type { Product } from '../types';
import { getReviews, submitReview, getDeliveryRates, type Review, type DeliveryRate } from '../services/customerService';
import { recordViewed, toggleSaved, readIds, SAVED_KEY } from '../utils/shoppingStore';
import '../styles/product-experience.css';

export default function ProductExperience({ product }: { product: Product }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const elements = root.current?.querySelectorAll('section, .experience-review-grid article');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {if(entry.isIntersecting){entry.target.classList.add('experience-entered');observer.unobserve(entry.target);}}), {threshold:.12,rootMargin:'0px 0px -60px 0px'});
    elements?.forEach(element => {element.classList.add('experience-animate');observer.observe(element);});
    return () => observer.disconnect();
  }, []);
  const [saved, setSaved] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rates, setRates] = useState<DeliveryRate[]>([]);
  const [town, setTown] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState('');
  const [reviewState, setReviewState] = useState('loading');
  useEffect(() => {
    recordViewed(product.id);
    const sync = () => setSaved(readIds(SAVED_KEY).includes(product.id));
    sync(); window.addEventListener('tyrelink:shopping', sync);
    let active = true;
    getReviews(product.id).then(rows => { if(active) {setReviews(rows);setReviewState('ready');} }).catch(() => {if(active)setReviewState('offline');});
    getDeliveryRates().then(rows => {if(active)setRates(rows);}).catch(() => {});
    return () => {active=false;window.removeEventListener('tyrelink:shopping', sync);};
  }, [product.id]);
  const enquiry = (text: string) => `https://wa.me/94712500420?text=${encodeURIComponent(`${text}\n${product.title}\n${typeof location !== 'undefined' ? location.href.split('#')[0] : ''}`)}`;
  const rate = rates.find(r => r.town === town);
  async function sendReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form=event.currentTarget;const data=new FormData(form);
    setBusy(true);setMessage('');
    try {
      await submitReview(product.id, {name: String(data.get('name')).trim(), rating: Number(data.get('rating')), text: String(data.get('text')).trim(), ...(photo ? {photoDataUrl:photo} : {})});
      setMessage('Thank you. Your review was submitted for moderation.');form.reset();setPhoto('');
    } catch {setMessage('We could not send your review. Please try again. Your text has been kept.');}
    finally {setBusy(false);}
  }
  async function loadPhoto(file?: File) {
    setPhoto(''); if(!file)return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){setMessage('Choose a JPG, PNG or WebP image smaller than 5 MB.');return;}
    const url=URL.createObjectURL(file);const img=new Image();
    img.onload=()=>{const scale=Math.min(1,640/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=img.width*scale;canvas.height=img.height*scale;canvas.getContext('2d')?.drawImage(img,0,0,canvas.width,canvas.height);setPhoto(canvas.toDataURL('image/jpeg',.75));URL.revokeObjectURL(url);};
    img.onerror=()=>{URL.revokeObjectURL(url);setMessage('This image could not be read.');};img.src=url;
  }
  const samples=[{id:'sample-1',photoDataUrl:'',name:'Sample customer',rating:5,text:'The size guide made comparing the options straightforward.'},{id:'sample-2',photoDataUrl:'',name:'Sample customer',rating:4,text:'Clear product information helped me prepare my questions for the team.'}];
  return <div className="product-experience" ref={root}>
    <nav className="product-utilities" aria-label="Product tools">
      <button type="button" aria-pressed={saved} onClick={()=>{toggleSaved(product.id);setSaved(readIds(SAVED_KEY).includes(product.id));}}>{saved?'♥ Saved':'♡ Save for later'}</button>
      <a href={`/tools?compare=${encodeURIComponent(product.id)}`}>Compare similar ↗</a>
      <a href={enquiry('Take a look at this product at TyreLink:')} target="_blank" rel="noreferrer">Share on WhatsApp ↗</a>
      <a href="/tools#recent">Recently viewed ↗</a>
    </nav>
    <section className="experience-delivery" aria-labelledby="delivery-heading">
      <div><span className="experience-eyebrow">BEFORE YOU ORDER</span><h2 id="delivery-heading">A little certainty.<br/>A better journey.</h2><p>Confirm your tyre size, manufacture date and delivery with our team.</p></div>
      <div className="experience-details">
        <details><summary>Manufacture date & warranty</summary><p>{product.warranty}. Confirm the applicable coverage and current batch date before ordering.</p><a href={enquiry('Please confirm the manufacture date and warranty coverage for:')}>Ask about this batch ↗</a></details>
        <details><summary>Delivery to your town</summary>
          {rates.length ? <><label htmlFor="delivery-town">Your town</label><select id="delivery-town" value={town} onChange={e=>setTown(e.target.value)}><option value="">Select a town</option>{rates.map(r=><option key={r.town}>{r.town}</option>)}</select>{rate&&<p>Delivery estimate: Rs. {Number(rate.fee).toLocaleString('en-US')} · {rate.estimate}. Confirm the final total before ordering.</p>}</> : <p>Delivery rates are confirmed by our team for your location.</p>}
          <a href={enquiry(`Please quote delivery ${town ? `to ${town}` : 'to my town'} for:`)}>Request a delivery quote ↗</a>
        </details>
        <details><summary>Need a different size or more stock?</summary><p>Tell us your size and quantity. Our team can check availability and discuss alternatives.</p><a href={enquiry('Please let me know when stock / alternative sizes are available for:')}>Enquire about availability ↗</a></details>
      </div>
    </section>
    <section className="experience-reviews" aria-labelledby="product-reviews-title">
      <header><span className="experience-eyebrow">REAL EXPERIENCES MATTER</span><h2 id="product-reviews-title">Your journey. Your review.</h2><p>{reviews.length ? `${(reviews.reduce((n,r)=>n+r.rating,0)/reviews.length).toFixed(1)} / 5 · ${reviews.length} approved reviews` : reviewState==='loading' ? 'Loading customer reviews…' : 'Be the first to share your experience.'}</p></header>
      {reviewState==='offline'&&<p role="status">Customer reviews are temporarily unavailable. The examples below are design previews.</p>}
      <div className="experience-review-grid">{(reviews.length?reviews:samples).map((r,i)=><article key={r.id||i}><span className="experience-eyebrow">{reviews.length?'CUSTOMER REVIEW':'SAMPLE · DESIGN PREVIEW'}</span><p aria-label={`${r.rating} out of 5 stars`} className="experience-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</p><blockquote>{r.text}</blockquote>{r.photoDataUrl&&<img src={r.photoDataUrl} alt="Customer product photograph" loading="lazy" width="160" height="120"/>}<strong>{r.name}</strong></article>)}</div>
      <details className="write-review"><summary>Write a review <span>＋</span></summary><form onSubmit={sendReview}>
        <p>Reviews are moderated before publication. Your name and review will be public once approved.</p>
        <div className="review-fields"><label>Your name<input name="name" required minLength={2} maxLength={80} autoComplete="name"/></label><label>Rating<select name="rating" required defaultValue=""><option value="" disabled>Choose rating</option>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} / 5</option>)}</select></label></div>
        <label>Your experience<textarea name="text" required minLength={10} maxLength={2000} rows={4}/></label>
        <label>Product photo (optional)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>loadPhoto(e.target.files?.[0])}/></label>
        {photo&&<img src={photo} alt="Your selected review photo" width="100"/>}
        <button type="submit" disabled={busy}>{busy?'Sending…':'Submit for review ↗'}</button>
        <p role="status" aria-live="polite">{message}</p>
      </form></details>
    </section>
  </div>;
}
