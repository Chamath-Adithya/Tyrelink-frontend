import { useEffect, useMemo, useState } from 'react';
import productsData from '../data/products.json';
import categories from '../data/categories.json';
import { fetchProducts } from '../services/productService';
import { COMPARE_KEY, RECENT_KEY, SAVED_KEY, readIds, writeIds } from '../utils/shoppingStore';
import type { Product } from '../types';
import '../styles/shopping-tools.css';

const money = (value: number) => `Rs. ${value.toLocaleString('en-US')}`;
const sizeParts = (product: Product) => (product.specs.Size || '').match(/^(\d+)\/(\d+)\s*(?:R|-)?\s*(\d+)/i)?.slice(1) || [];

export default function ShoppingTools() {
  const [products, setProducts] = useState<Product[]>(productsData as Product[]);
  const [tab, setTab] = useState('finder');
  const [saved, setSaved] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [compare, setCompare] = useState<string[]>([]);
  const [size, setSize] = useState(['', '', '']);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [differences, setDifferences] = useState(false);
  const [message, setMessage] = useState('');
  const [replace, setReplace] = useState<Product | null>(null);

  useEffect(() => {
    let active = true;
    fetchProducts().then(({ products: data }) => { if (active && data.length) setProducts(data); });
    const sync = () => { setSaved(readIds(SAVED_KEY)); setRecent(readIds(RECENT_KEY)); };
    sync();
    if (location.hash === '#recent') setTab('recent');
    const query = new URLSearchParams(location.search);
    const requested = (query.get('compare') || '').split(',').filter(Boolean);
    const existing = readIds(COMPARE_KEY);
    const requestedProduct = (productsData as Product[]).find(p => p.id === requested[0]);
    const existingProduct = (productsData as Product[]).find(p => p.id === existing[0]);
    const conflicts = requested.length === 1 && requestedProduct && existingProduct && requestedProduct.category !== existingProduct.category;
    let ids = requested.length > 1 ? requested : requested.length === 1 && !conflicts ? [...new Set([...existing, ...requested])] : existing;
    if (conflicts) setReplace(requestedProduct);
    if (ids.length > 3) setMessage('Your comparison already has three products. Remove one before adding another.');
    const first = (productsData as Product[]).find(p => p.id === ids[0]);
    ids = ids.filter(id => (productsData as Product[]).some(p => p.id === id && p.category === first?.category)).slice(0, 3);
    setCompare(ids);
    if (first) setCategory(first.category);
    if (requested.length) { setTab('compare'); writeIds(COMPARE_KEY, ids); }
    const save = query.get('saved');
    if (save && (productsData as Product[]).some(p => p.id === save)) { writeIds(SAVED_KEY, [save, ...readIds(SAVED_KEY)]); setTab('saved'); }
    window.addEventListener('storage', sync);
    window.addEventListener('tyrelink:shopping', sync);
    return () => { active = false; window.removeEventListener('storage', sync); window.removeEventListener('tyrelink:shopping', sync); };
  }, []);
  const selected = compare.map(id => products.find(p => p.id === id)).filter((p): p is Product => !!p);
  function persist(ids: string[]) { setCompare(ids); if (!writeIds(COMPARE_KEY, ids)) setMessage('Browser storage is unavailable. Your shortlist works until you leave this page.'); }
  function add(product: Product) {
    if (compare.includes(product.id)) { persist(compare.filter(id => id !== product.id)); return; }
    if (selected.length && selected[0].category !== product.category) { setReplace(product); return; }
    if (compare.length === 3) { setMessage('Compare up to three products. Remove one to add another.'); return; }
    persist([...compare, product.id]); setCategory(product.category); setMessage(`${product.title} added. Open Compare to see your shortlist.`);
  }
  const filtered = products.filter(p => (tab === 'saved' ? saved.includes(p.id) : tab === 'recent' ? recent.includes(p.id) : tab === 'compare' ? (!category || p.category === category) : sizeParts(p).length && size.every((value, i) => !value || sizeParts(p)[i] === value)) && `${p.title} ${p.brand} ${p.specs.Size || ''}`.toLowerCase().includes(search.trim().toLowerCase()));
  const displayed = tab === 'recent' ? [...filtered].sort((a,b) => recent.indexOf(a.id)-recent.indexOf(b.id)) : filtered;
  const options = useMemo(() => [0,1,2].map(index => [...new Set(products.filter(p => sizeParts(p).length && size.slice(0,index).every((value,i) => !value || sizeParts(p)[i] === value)).map(p => sizeParts(p)[index]))].sort((a,b) => +a-+b)), [products,size]);
  const rows: {label: string; values: string[]}[] = [
    {label:'Price', values:selected.map(p=>money(p.price))},
    {label:'Availability', values:selected.map(p=>p.inStock ? 'In stock · confirm quantity' : 'Enquire about availability')},
    {label:'Warranty', values:selected.map(p=>p.warranty || 'Ask our team')},
    {label:'Koko · 3 payments', values:selected.map(p=>money(p.kokoInstallmentAmount || Math.ceil(p.price/(p.kokoInstallmentCount || 3))))},
    {label:'Payzy · 4 payments', values:selected.map(p=>money(p.payzyInstallmentAmount || Math.ceil(p.price/(p.payzyInstallmentCount || 4))))},
    ...[...new Set(selected.flatMap(p=>Object.keys(p.specs).filter(key=>key!=='Warranty')))].map(label=>({label,values:selected.map(p=>p.specs[label] || 'Not specified')})),
  ].filter(row => !differences || new Set(row.values).size > 1);
  const shareUrl = typeof location === 'undefined' ? '' : `${location.origin}/tools?compare=${compare.map(encodeURIComponent).join(',')}`;

  return <div className="shopping-tools">
    <header className="tools-heading"><p className="tools-eyebrow">YOUR NEXT JOURNEY, CONSIDERED.</p><h1>A little clarity.<br/><span>A better choice.</span></h1><p>Find your size. Compare the details. Keep your favourites close.</p></header>
    <nav className="tools-tabs" aria-label="Shopping tools">{[['finder','Find your size'],['compare',`Compare (${compare.length})`],['saved',`Saved (${saved.length})`],['recent','Recently viewed']].map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>{setTab(id);setMessage('');setSearch('');}}>{label}</button>)}</nav>
    <p className="tools-status" role="status">{message}</p>
    {tab==='finder' && <section className="tools-finder"><div><p className="tools-eyebrow">01 / READ YOUR SIDEWALL</p><h2>Your size is your starting point.</h2><p>Match the numbers on your current tyre. Our team will confirm vehicle fitment before you order.</p><div className="tools-size-fields">{['Width','Profile','Rim'].map((label,index)=><label key={label}>{label}<select value={size[index]} onChange={e=>setSize(previous=>previous.map((value,i)=>i===index?e.target.value:i>index?'':value))}><option value="">Any {label.toLowerCase()}</option>{options[index].map(value=><option key={value}>{value}</option>)}</select></label>)}</div><button className="tools-text-button" onClick={()=>setSize(['','',''])}>Reset size</button></div><figure className="sidewall-guide"><svg viewBox="0 0 440 230" role="img" aria-label="195 is width in millimetres, 65 is aspect ratio, R means radial, 15 is rim diameter in inches"><path d="M25 195 Q220 -50 415 195" fill="none" stroke="#20231f" strokeWidth="58"/><path d="M25 195 Q220 -50 415 195" fill="none" stroke="#555a51" strokeWidth="1" strokeDasharray="5 7"/><rect x="91" y="88" width="258" height="59" rx="6" fill="#fff"/><text x="220" y="128" textAnchor="middle" fill="#20231f" fontSize="31" fontWeight="800">195 / 65 R15</text><path d="M135 151V185M207 151V205M300 151V185" stroke="#ed1c24" strokeWidth="2"/><text x="135" y="204" textAnchor="middle" fontSize="12">Width · mm</text><text x="207" y="223" textAnchor="middle" fontSize="12">Profile · %</text><text x="300" y="204" textAnchor="middle" fontSize="12">Rim · inches</text></svg><figcaption>Example only: 195/65 R15 · R means radial construction.</figcaption></figure></section>}
    {tab==='compare' && <section className="tools-comparison"><div className="tools-section-head"><div><p className="tools-eyebrow">THE DETAILS, SIDE BY SIDE</p><h2>Compare with confidence.</h2></div><label className="tools-check"><input type="checkbox" checked={differences} onChange={e=>setDifferences(e.target.checked)}/> Show differences only</label></div><p>Choose up to three products in the same category. A matching category does not guarantee vehicle fitment.</p>{selected.length ? <><div className="tools-table-wrap" tabIndex={0} role="region" aria-label="Product comparison, scroll horizontally on small screens"><table><caption className="sr-only">Product specifications and prices</caption><thead><tr><th scope="col">Your shortlist</th>{selected.map(p=><th scope="col" key={p.id}><img src={p.featuredImage} alt=""/><a href={`/product/${p.slug}`}>{p.title}</a><button onClick={()=>persist(compare.filter(id=>id!==p.id))} aria-label={`Remove ${p.title}`}>Remove ×</button></th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.label}><th scope="row">{row.label}</th>{row.values.map((value,i)=><td key={selected[i].id}>{value}</td>)}</tr>)}</tbody></table></div>{differences && rows.length===0 && <p>No differences to show. Add another product or turn off the filter.</p>}<div className="tools-share"><a href={`https://wa.me/?text=${encodeURIComponent(`My TyreLink shortlist: ${shareUrl}`)}`} target="_blank" rel="noreferrer">Share comparison on WhatsApp ↗</a><button onClick={()=>persist([])}>Clear comparison</button></div><small>Instalment amounts are indicative. Provider eligibility and terms apply.</small></>:<p className="tools-empty">Add products below to start comparing.</p>}<label className="tools-category">Browse category<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{categories.map(cat=><option value={cat.id} key={cat.id}>{cat.name}</option>)}</select></label></section>}
    <section><div className="tools-section-head"><h2>{tab==='finder'?'Matching tyres':tab==='saved'?'Your saved collection':tab==='recent'?'Pick up where you left off':'Add to your comparison'}</h2><span>{displayed.length} products</span></div><label className="tools-search"><span>Search products</span><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by brand, name or size" /></label>{(tab==='saved'||tab==='recent')&&<p className="tools-local-note">Saved in this browser. No account needed.</p>}{!displayed.length&&<div className="tools-empty"><p>{search ? 'No products match your search. Try another name, brand or size.' : tab==='finder'?'No exact match in the current catalogue. Send us your size and we’ll help.':tab==='recent'?'Visit a product page to start your recently viewed collection.':'Save products using the heart button to build your shortlist.'}</p><a href={tab==='finder'?`https://wa.me/94712500420?text=${encodeURIComponent(`Hi TyreLink, can you help me find tyre size ${size.filter(Boolean).join(' / ')}?`)}`:'/shop'}>{tab==='finder'?'Ask about this size ↗':'Explore the collection ↗'}</a></div>}<div className="tools-products">{displayed.map(p=><article key={p.id} className="tools-product"><div className="tools-product-image"><a href={`/product/${p.slug}`}><img src={p.featuredImage} alt={p.title} loading="lazy"/></a><button aria-label={`${saved.includes(p.id)?'Unsave':'Save'} ${p.title}`} aria-pressed={saved.includes(p.id)} onClick={()=>{const ids=saved.includes(p.id)?saved.filter(id=>id!==p.id):[p.id,...saved];setSaved(ids);if(!writeIds(SAVED_KEY,ids))setMessage('Could not save to browser storage.');}}>{saved.includes(p.id)?'♥':'♡'}</button></div><p className="tools-eyebrow">{p.brand}</p><h3><a href={`/product/${p.slug}`}>{p.title}</a></h3><div className="tools-product-bottom"><strong>{money(p.price)}</strong><button onClick={()=>add(p)} aria-pressed={compare.includes(p.id)}>{compare.includes(p.id)?'− Remove':'+ Compare'}</button></div></article>)}</div></section>
    {replace&&<div className="tools-replace" role="alert"><p>Your comparison contains a different category. Replace it with {replace.title}?</p><button onClick={()=>{persist([replace.id]);setCategory(replace.category);setReplace(null);setTab('compare');}}>Replace comparison</button><button onClick={()=>setReplace(null)}>Keep current</button></div>}
  </div>;
}
