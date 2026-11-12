export type ProductCategory = 
  | 'car-tyres'
  | 'suv-4x4'
  | 'motorcycle'
  | 'commercial'
  | 'wheels'
  | 'garage-tools'
  | 'garage-equipment';

export type ProductCondition = 'brand-new' | 'pre-owned-like-new' | 'open-box';

export interface LaptopUpgradeOption {
  id: string;
  name: string;
  priceDelta: number;
}

export interface LaptopConfig {
  ramOptions?: LaptopUpgradeOption[];
  storageOptions?: LaptopUpgradeOption[];
  purpose: ('study' | 'office' | 'graphic-design' | 'gaming')[];
  display: string;
  batteryLife: string;
  condition: ProductCondition;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  sinhalaTitle?: string;
  brand: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  featuredImage: string;
  images: string[];
  inStock: boolean;
  stockCount?: number;
  maxOrderQuantity?: number;
  installmentCount?: number;
  installmentAmount?: number;
  kokoInstallmentCount?: number;
  kokoInstallmentAmount?: number;
  payzyInstallmentCount?: number;
  payzyInstallmentAmount?: number;
  warranty: string;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isFlashDeal?: boolean;
  flashDealDiscount?: number;
  shortDescription: string;
  sinhalaDescription?: string;
  specs: Record<string, string>;
  videoShortUrl?: string;
  youtubeReviewId?: string;
  rating: number;
  reviewCount: number;
  laptopConfig?: LaptopConfig;
}

export interface CategoryInfo {
  id: ProductCategory;
  name: string;
  sinhalaName: string;
  icon: string;
  description: string;
  itemCount: number;
}

export interface OrderLead {
  id?: string;
  productId: string;
  productTitle: string;
  price: number;
  selectedUpgrades?: string[];
  customerName: string;
  address: string;
  city?: string;
  phone1: string;
  phone2?: string;
  paymentMethod: 'Cash on Delivery' | 'Bank Transfer' | 'Koko' | 'Mintpay';
  timestamp: string;
  orderRef: string;
  status: 'pending_whatsapp' | 'confirmed' | 'dispatched' | 'delivered';
}

export interface FlashSaleConfig {
  isActive: boolean;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  productIds: string[];
}

export interface TrendingConfig {
  isActive: boolean;
  productIds: string[];
}

export interface CampaignsData {
  flashSale: FlashSaleConfig;
  trending: TrendingConfig;
  trendingProductIds?: string[];
}

export interface AdminSession {
  token: string;
  username: string;
  loginTime: number;
  editMode: boolean;
}
