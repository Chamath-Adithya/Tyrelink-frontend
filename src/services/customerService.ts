import { request } from './apiClient';
export interface Review { photoDataUrl?:string; id:string; productId:string; name:string; rating:number; text:string; status:'pending'|'approved'|'rejected'; createdAt:string }
export interface DeliveryRate { town:string; fee:number; estimate:string }
export async function getReviews(productId:string):Promise<Review[]> { const res=await request<{data:Review[]}>(`/v1/products/${encodeURIComponent(productId)}/reviews`); return res.data || []; }
export async function submitReview(productId:string,review:{name:string;rating:number;text:string;photoDataUrl?:string}):Promise<void> { await request(`/v1/products/${encodeURIComponent(productId)}/reviews`,{method:'POST',body:JSON.stringify(review)}); }
export async function getDeliveryRates():Promise<DeliveryRate[]> { const res=await request<{data:DeliveryRate[]}>('/v1/delivery-rates'); return res.data || []; }
