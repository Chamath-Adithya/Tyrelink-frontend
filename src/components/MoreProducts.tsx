import React, {useEffect, useMemo, useRef, useState} from 'react';
import type {Product} from '../types';
import {fetchProducts} from '../services/productService';
import products from '../data/products.json';

export default function MoreProducts({current}:{current:Product}) {
  const [catalog,setCatalog]=useState<Product[]>(products as Product[]);
  const [count,setCount]=useState(4);
  const sentinel=useRef<HTMLDivElement>(null);
  useEffect(()=>{let active=true; fetchProducts().then(result=>{if(active)setCatalog(result.products)}); return ()=>{active=false}},[]);
  const ranked=useMemo(()=>catalog.filter(p=>p.id!==current.id && p.slug && p.title).sort((a,b)=>{
    const score=(p:Product)=>(p.category===current.category?100:0)+(p.brand===current.brand?15:0)+(p.inStock?8:0)+(p.isBestSeller?3:0);
    return score(b)-score(a) || a.title.localeCompare(b.title);
  }),[catalog,current]);
  useEffect(()=>{if(count>=ranked.length || !sentinel.current || !('IntersectionObserver' in window))return; const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting)setCount(n=>Math.min(n+4,ranked.length))},{rootMargin:'200px'}); observer.observe(sentinel.current);return()=>observer.disconnect()},[count,ranked.length]);
  return <section className="pd-related" aria-labelledby="more-products-title"><header><div><span className="pd-eyebrow">Keep exploring</span><h2 id="more-products-title">More products.</h2></div><a href="/shop">View all products ↗</a></header><div className="pd-related-grid">{ranked.slice(0,count).map(p=><a key={p.id} href={`/product/${encodeURIComponent(p.slug)}/`} className="more-product"><img src={p.featuredImage} alt={p.title} loading="lazy" decoding="async"/><span>{p.brand}</span><strong>{p.title}</strong><b>Rs. {Number(p.price).toLocaleString('en-US')}</b><small>View product ↗</small></a>)}</div>{count<ranked.length ? <div ref={sentinel}><button className="more-load" onClick={()=>setCount(n=>Math.min(n+4,ranked.length))}>Load more products</button></div> : <p className="more-end" role="status">{ranked.length ? 'You’ve seen all available suggestions.' : 'No other products are available right now.'} <a href="/shop">Explore the shop ↗</a></p>}</section>;
}
