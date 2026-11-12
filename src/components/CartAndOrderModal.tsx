import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Send,
  AlertCircle,
  CheckCircle2,
  Check,
  CreditCard,
  Phone,
  MapPin,
  User,
  Sparkles,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiRequest } from '../lib/api';
import { submitOrderLead } from '../services/leadService';
import {
  getCart,
  saveCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  getCartSubtotal,
  COURIER_CHARGE,
  type CartItem,
  type CheckoutPayload
} from '../utils/cartStore';

type PaymentMethod = 'Cash on Delivery (COD)' | 'Koko (3 Installments)' | 'Payzy Digital' | 'Online / Bank Transfer';

export default function CartAndOrderModal() {
  // Cart Drawer State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CheckoutPayload['items']>([]);
  const [isFromCart, setIsFromCart] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>('forward');

  // Form Fields
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash on Delivery (COD)');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Initialize and listen to custom events
  useEffect(() => {
    setCartItems(getCart());

    const handleCartUpdated = (e: CustomEvent<CartItem[]>) => {
      setCartItems(e.detail || getCart());
    };

    const handleOpenCart = () => {
      setCartItems(getCart());
      setIsCartOpen(true);
    };

    const handleCloseCart = () => {
      setIsCartOpen(false);
    };

    const handleOpenCheckout = (e: CustomEvent<CheckoutPayload>) => {
      if (e.detail?.items && e.detail.items.length > 0) {
        setCheckoutItems(e.detail.items);
        setIsFromCart(false);
        setIsCartOpen(false);
        setCheckoutStep(1);
        setStepDirection('forward');
        setErrorMessage(null);
        setIsCheckoutOpen(true);
      }
    };

    window.addEventListener('tyrelink:cart-updated', handleCartUpdated as EventListener);
    window.addEventListener('tyrelink:open-cart', handleOpenCart);
    window.addEventListener('tyrelink:close-cart', handleCloseCart);
    window.addEventListener('tyrelink:open-checkout', handleOpenCheckout as EventListener);

    return () => {
      window.removeEventListener('tyrelink:cart-updated', handleCartUpdated as EventListener);
      window.removeEventListener('tyrelink:open-cart', handleOpenCart);
      window.removeEventListener('tyrelink:close-cart', handleCloseCart);
      window.removeEventListener('tyrelink:open-checkout', handleOpenCheckout as EventListener);
    };
  }, []);

  // Lock body scroll and hide background floating widgets when either drawer or modal is open
  useEffect(() => {
    if (isCartOpen || isCheckoutOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('cart-drawer-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('cart-drawer-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('cart-drawer-open');
    };
  }, [isCartOpen, isCheckoutOpen]);

  const cartSubtotal = getCartSubtotal(cartItems);
  const cartGrandTotal = cartItems.length > 0 ? cartSubtotal + COURIER_CHARGE : 0;

  const checkoutSubtotal = checkoutItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const checkoutGrandTotal = checkoutSubtotal + COURIER_CHARGE;
  const totalCheckoutQuantity = checkoutItems.reduce((acc, i) => acc + i.quantity, 0);

  const updateCheckoutQuantity = (itemId: string, delta: number) => {
    setCheckoutItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
    if (isFromCart) {
      updateCartQuantity(itemId, delta);
    }
  };

  const handleCheckoutFromCart = () => {
    if (cartItems.length === 0) return;
    setCheckoutItems(cartItems.map(i => ({
      id: i.id,
      title: i.title,
      price: i.price,
      quantity: i.quantity,
      image: i.image,
      selectedUpgrades: i.selectedUpgrades
    })));
    setIsFromCart(true);
    setIsCartOpen(false);
    setCheckoutStep(1);
    setStepDirection('forward');
    setErrorMessage(null);
    setIsCheckoutOpen(true);
  };

  const validatePhone = (num: string) => {
    const cleaned = num.replace(/\D/g, '');
    return cleaned.length >= 9 && cleaned.length <= 11;
  };

  const handleGoToStep2 = () => {
    setErrorMessage(null);
    if (!name.trim()) {
      setErrorMessage('Please enter your full name (කරුණාකර ඔබගේ සම්පූර්ණ නම ඇතුළත් කරන්න).');
      return;
    }
    if (!address.trim()) {
      setErrorMessage('Please enter your delivery address & city (භාණ්ඩය ලැබිය යුතු ලිපිනය සහ නගරය ඇතුළත් කරන්න).');
      return;
    }
    if (!validatePhone(phone1)) {
      setErrorMessage('Please enter a valid 10-digit primary phone number (වලංගු ප්‍රධාන දුරකථන අංකයක් ඇතුළත් කරන්න).');
      return;
    }
    setStepDirection('forward');
    setCheckoutStep(2);
  };

  const handleBackToStep1 = () => {
    setErrorMessage(null);
    setStepDirection('backward');
    setCheckoutStep(1);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (checkoutStep === 1) {
      handleGoToStep2();
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Please enter your full name (කරුණාකර ඔබගේ නම ඇතුළත් කරන්න).');
      setCheckoutStep(1);
      return;
    }
    if (!address.trim()) {
      setErrorMessage('Please enter your delivery address & city (භාණ්ඩය ලැබිය යුතු ලිපිනය සහ නගරය ඇතුළත් කරන්න).');
      setCheckoutStep(1);
      return;
    }
    if (!validatePhone(phone1)) {
      setErrorMessage('Please enter a valid 10-digit primary phone number (වලංගු ප්‍රධාන දුරකථන අංකයක් ඇතුළත් කරන්න).');
      setCheckoutStep(1);
      return;
    }

    setIsSubmitting(true);
    const orderRef = `TL-${Date.now().toString().slice(-8)}`;

    // Prepare Async Backend Payload
    const orderPayload = {
      orderRef,
      customerName: name.trim(),
      address: address.trim(),
      phone1: phone1.trim(),
      phone2: phone2.trim() || undefined,
      paymentMethod,
      items: checkoutItems,
      subtotal: checkoutSubtotal,
      courierCharge: COURIER_CHARGE,
      grandTotal: checkoutGrandTotal,
      timestamp: new Date().toISOString()
    };

    try {
      await submitOrderLead(orderPayload);
    } catch (err) {
      console.warn('Backend order logging skipped, continuing to WhatsApp:', err);
    }

    // Festive Confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (_) { }

    // Build Formatted WhatsApp Message
    const itemsFormatted = checkoutItems.map((item, idx) => {
      const upgrades = item.selectedUpgrades && item.selectedUpgrades.length > 0
        ? ` (${item.selectedUpgrades.join(', ')})`
        : '';
      return `${idx + 1}. *${item.title}*${upgrades}\n   Quantity: ${item.quantity} × Rs. ${item.price.toLocaleString('en-US')} = Rs. ${(item.price * item.quantity).toLocaleString('en-US')}`;
    }).join('\n\n');

    const message = `*Tyrelink - NEW ORDER CONFIRMATION*
━━━━━━━━━━━━━━━━━━━━━━━
📦 *ORDERED ITEMS:*
${itemsFormatted}

━━━━━━━━━━━━━━━━━━━━━━━
💰 *Subtotal:* Rs. ${checkoutSubtotal.toLocaleString('en-US')}
🚚 *Courier Delivery Charge:* Rs. ${COURIER_CHARGE.toLocaleString('en-US')}
🔥 *TOTAL PAYABLE AMOUNT:* Rs. ${checkoutGrandTotal.toLocaleString('en-US')}
━━━━━━━━━━━━━━━━━━━━━━━
💳 *Payment Method:* ${paymentMethod}

👤 *Customer Name:* ${name.trim()}
📍 *Delivery Address:* ${address.trim()}
📞 *Primary Mobile:* ${phone1.trim()}
${phone2.trim() ? `📱 *Alternative Mobile:* ${phone2.trim()}\n` : ''}🏷️ *Order Reference:* #${orderRef}
━━━━━━━━━━━━━━━━━━━━━━━
කරුණාකර මගේ මෙම ඇණවුම තහවුරු කර ඉක්මනින් dispatch කිරීමට කටයුතු කරන්න. ස්තූතියි!`;

    const whatsappNumber = '94783724920';
    const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    setIsSuccess(true);

    if (isFromCart) {
      clearCart();
    }

    setTimeout(() => {
      window.open(waUrl, '_blank');
      setIsSubmitting(false);
      setIsCheckoutOpen(false);
      setIsSuccess(false);
    }, 1200);
  };

  return (
    <>
      {/* =========================================================================
          1. SLIDE-OUT CART DRAWER
          ========================================================================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[60] overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-md bg-white/95 backdrop-blur-2xl shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 border-l border-white/80">

              {/* Drawer Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100/80 flex items-center justify-between bg-white/50 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 font-display">Shopping Cart</h2>
                    <p className="text-[11px] text-slate-400 font-sinhala">ඔබ තෝරාගත් භාණ්ඩ ({cartItems.length})</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
                  aria-label="Close cart"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Body (Items List) */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-800">Your Cart is Empty</h3>
                      <p className="text-xs text-slate-400 font-sinhala">ඔබගේ බාස්කට් එකට තවමත් භාණ්ඩ එකතු කර නැත.</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        window.location.href = '/shop';
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-white font-bold text-xs hover:bg-brand-600 transition-colors shadow-sm"
                    >
                      <span>Explore Store (භාණ්ඩ තෝරන්න)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80"
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-16 h-16 rounded-xl object-cover bg-white border border-slate-200/60 shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{item.title}</h4>
                          <p className="text-sm font-black text-brand-600 mt-0.5 font-display">
                            Rs. {(item.price * item.quantity).toLocaleString('en-US')}
                          </p>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2.5 mt-2">
                            <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs">
                              <button
                                onClick={() => updateCartQuantity(item.id, -1)}
                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-8 text-center text-xs sm:text-sm font-bold text-slate-800 font-mono">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateCartQuantity(item.id, 1)}
                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={clearCart}
                        className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors"
                      >
                        Clear Cart (හිස් කරන්න)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer (Price Breakdown & CTA) */}
              {cartItems.length > 0 && (
                <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
                  <div className="space-y-2.5 text-xs sm:text-sm">
                    <div className="flex items-center justify-between text-slate-500 font-medium">
                      <span>Item Subtotal</span>
                      <span className="font-mono font-bold text-slate-800 text-sm">
                        Rs. {cartSubtotal.toLocaleString('en-US')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                        <Truck className="w-4 h-4" />
                        Islandwide Courier (දිවයින පුරා)
                      </span>
                      <span className="font-mono font-bold text-slate-800 text-sm">
                        Rs. {COURIER_CHARGE.toLocaleString('en-US')}
                      </span>
                    </div>

                    <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between">
                      <div>
                        <span className="font-black text-slate-900 font-display text-sm sm:text-base">Total Amount Payable</span>
                        <p className="text-xs text-slate-400 font-sinhala">මුළු මුදල (භාණ්ඩ + කුරියර් ගාස්තු)</p>
                      </div>
                      <span className="text-xl font-black text-brand-600 font-display">
                        Rs. {cartGrandTotal.toLocaleString('en-US')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckoutFromCart}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-red-600 hover:from-brand-500 hover:to-red-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.01] active:scale-98 cursor-pointer"
                  >
                    <span>Proceed to Order (ඇණවුම් කරන්න)</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* Clean In-Drawer WhatsApp Assistance Shortcut */}
                  <a
                    href="https://wa.me/94783724920?text=Hi%20Tyrelink,%20I%20have%20a%20question%20about%20my%20cart"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-emerald-600 transition-colors pt-0.5 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Need Help? Chat on WhatsApp</span>
                  </a>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. ORDER NOW / CHECKOUT MODAL (2-STEP ULTRA-CLEAN UX)
          ========================================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl sm:max-w-[680px] max-h-[90vh] max-h-[90dvh] flex flex-col my-auto rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 sm:px-8 pt-5 sm:pt-7 pb-4 sm:pb-5 border-b border-slate-100 bg-white flex-shrink-0">
              <div className="flex items-start justify-between">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200/70 text-brand-700 text-xs font-bold uppercase tracking-wider">
                      <Zap className="w-3.5 h-3.5 fill-current text-brand-500" />
                      <span>Instant Order Confirmation</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-display mt-2 tracking-tight">
                      Complete Your Order <span className="font-sinhala font-bold text-slate-600 text-sm sm:text-base">(ඇණවුම සම්පූර්ණ කරන්න)</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 font-sinhala mt-1">
                      {checkoutStep === 1
                        ? 'පියවර 1: ඔබගේ නම, ලිපිනය සහ දුරකථන අංකය ඇතුළත් කරන්න'
                        : 'පියවර 2: ගෙවීම් ක්‍රමය තෝරා WhatsApp හරහා ඇණවුම තහවුරු කරන්න'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Progress Stepper Bar */}
                <div className="mt-6 flex items-center justify-between">
                  {/* Step 1 Pill */}
                  <button
                    type="button"
                    onClick={() => checkoutStep === 2 && handleBackToStep1()}
                    className={`flex items-center gap-3 text-left transition-all ${checkoutStep === 1
                        ? 'cursor-default'
                        : 'cursor-pointer hover:opacity-80'
                      }`}
                  >
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-xs sm:text-sm font-black transition-all ${checkoutStep === 1
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30 ring-4 ring-brand-100'
                        : 'bg-emerald-500 text-white'
                      }`}>
                      {checkoutStep === 2 ? <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" /> : '1'}
                    </div>
                    <div>
                      <span className="block text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400">Step 1</span>
                      <span className={`block text-xs sm:text-sm font-bold ${checkoutStep === 1 ? 'text-brand-600' : 'text-slate-700'}`}>
                        Delivery Details
                      </span>
                    </div>
                  </button>

                  {/* Animated Connecting Line */}
                  <div className="flex-1 mx-4 sm:mx-6 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-400 ease-out"
                      style={{ width: checkoutStep === 1 ? '40%' : '100%' }}
                    />
                  </div>

                  {/* Step 2 Pill */}
                  <div className="flex items-center gap-3 text-left">
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-xs sm:text-sm font-black transition-all ${checkoutStep === 2
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30 ring-4 ring-brand-100'
                        : 'bg-slate-100 text-slate-400'
                      }`}>
                      2
                    </div>
                    <div>
                      <span className="block text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400">Step 2</span>
                      <span className={`block text-xs sm:text-sm font-bold ${checkoutStep === 2 ? 'text-brand-600' : 'text-slate-400'}`}>
                        Payment & Review
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Notification Alert */}
              {errorMessage && (
                <div className="mx-6 sm:mx-8 mt-5 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-xs sm:text-sm text-red-700 animate-in fade-in duration-200">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                  <span className="font-semibold">{errorMessage}</span>
                </div>
              )}

              {/* Success State */}
              {isSuccess ? (
                <div className="py-20 px-6 text-center space-y-4">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">Order Prepared!</h4>
                    <p className="text-sm sm:text-base text-slate-600 font-sinhala">WhatsApp වෙත යොමු කරමින් පවතී. කරුණාකර රැඳී සිටින්න...</p>
                  </div>
                </div>
              ) : (
                /* Modal Scrollable Body */
                <div className="overflow-y-auto px-5 sm:px-8 pt-5 pb-8 sm:pb-10 flex-1 bg-white scroll-py-6">
                  <form onSubmit={handleFormSubmit}>

                    {/* =========================================================
                      STEP 1: DELIVERY & CONTACT DETAILS
                      ========================================================= */}
                    {checkoutStep === 1 && (
                      <div className={`space-y-5 sm:space-y-6 ${stepDirection === 'backward' ? 'step-enter-left' : 'step-enter-right'}`}>

                        {/* Delivery Assurance Notice */}
                        <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 bg-amber-50/80 border border-amber-200/80 p-4 sm:p-4.5 rounded-2xl">
                          <Truck className="w-5 h-5 text-brand-600 shrink-0" />
                          <span className="font-medium leading-relaxed">
                            දිවයින පුරා ආරක්ෂිත Doorstep Delivery — Cash on Delivery (COD) පහසුකම සහිතයි.
                          </span>
                        </div>

                        {/* Your Full Name */}
                        <div className="space-y-2.5">
                          <label className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800">
                            <span className="flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-400" />
                              <span>Your Full Name</span>
                              <span className="font-sinhala font-medium text-slate-500">(ඔබගේ සම්පූර්ණ නම)</span>
                            </span>
                            <span className="text-brand-500 font-bold">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => { setName(e.target.value); if (errorMessage) setErrorMessage(null); }}
                              placeholder="e.g. Kasun Chamara / කසුන් චාමර"
                              className="w-full rounded-2xl bg-slate-50/80 border border-slate-200 px-5 sm:px-5.5 py-3.5 sm:py-4 text-sm sm:text-base font-medium text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none transition-all placeholder:text-slate-400"
                            />
                          </div>
                        </div>

                        {/* Delivery Address & City */}
                        <div className="space-y-2.5">
                          <label className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800">
                            <span className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              <span>Delivery Address & City</span>
                              <span className="font-sinhala font-medium text-slate-500">(භාණ්ඩය ලැබිය යුතු ලිපිනය සහ නගරය)</span>
                            </span>
                            <span className="text-brand-500 font-bold">*</span>
                          </label>
                          <div className="relative">
                            <textarea
                              required
                              rows={3}
                              value={address}
                              onChange={(e) => { setAddress(e.target.value); if (errorMessage) setErrorMessage(null); }}
                              placeholder="e.g. No 45, Temple Road, Horana / හෝමාගම"
                              className="w-full rounded-2xl bg-slate-50/80 border border-slate-200 px-5 sm:px-5.5 py-3.5 sm:py-4 text-sm sm:text-base font-medium text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none transition-all resize-none placeholder:text-slate-400 leading-relaxed"
                            />
                          </div>
                        </div>

                        {/* Phone Numbers Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2.5">
                            <label className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800">
                              <span className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span>Phone 1 (Main / WhatsApp)</span>
                              </span>
                              <span className="text-brand-500 font-bold">*</span>
                            </label>
                            <input
                              type="tel"
                              required
                              value={phone1}
                              onChange={(e) => { setPhone1(e.target.value); if (errorMessage) setErrorMessage(null); }}
                              placeholder="077 123 4567"
                              className="w-full rounded-2xl bg-slate-50/80 border border-slate-200 px-5 sm:px-5.5 py-3.5 sm:py-4 text-sm sm:text-base font-mono font-medium text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none transition-all placeholder:text-slate-400"
                            />
                          </div>

                          <div className="space-y-2.5">
                            <label className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800">
                              <span className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span>Phone 2 (Alternative / අමතර)</span>
                              </span>
                              <span className="text-xs text-slate-400 font-medium">(Optional)</span>
                            </label>
                            <input
                              type="tel"
                              value={phone2}
                              onChange={(e) => setPhone2(e.target.value)}
                              placeholder="071 987 6543 (Optional)"
                              className="w-full rounded-2xl bg-slate-50/80 border border-slate-200 px-5 sm:px-5.5 py-3.5 sm:py-4 text-sm sm:text-base font-mono font-medium text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none transition-all placeholder:text-slate-400"
                            />
                          </div>
                        </div>

                        {/* Order Items & Quantity Selector Section */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-red-50/70 via-rose-50/30 to-white border border-red-200/80 shadow-xs space-y-3.5">
                              <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 border-b border-red-100/90 pb-2.5">
                                <span className="flex items-center gap-2">
                                  <ShoppingBag className="w-4 h-4 text-brand-500" />
                                  <span>Order Items ({totalCheckoutQuantity} {totalCheckoutQuantity === 1 ? 'item' : 'items'})</span>
                                </span>
                                <span className="text-[11px] text-brand-600 font-sinhala font-bold bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200/60">
                                  ප්‍රමාණය වෙනස් කළ හැක (Set Qty)
                                </span>
                              </div>

                              {/* Items List with Interactive Quantity Stepper */}
                              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-0.5">
                                {checkoutItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-brand-300 transition-colors"
                                  >
                                    {item.image && (
                                      <img
                                        src={item.image}
                                        alt={item.title}
                                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-contain bg-slate-50 border border-slate-100 p-1 shrink-0"
                                      />
                                    )}

                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={item.title}>
                                        {item.title}
                                      </h4>
                                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-mono">
                                        <span>Rs. {item.price.toLocaleString('en-US')} each</span>
                                        {item.selectedUpgrades && item.selectedUpgrades.length > 0 && (
                                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 truncate max-w-[120px]">
                                            +{item.selectedUpgrades.join(', ')}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Interactive Quantity Stepper */}
                                    <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50/80 overflow-hidden shadow-2xs">
                                        <button
                                          type="button"
                                          onClick={() => updateCheckoutQuantity(item.id, -1)}
                                          disabled={item.quantity <= 1}
                                          aria-label="Decrease quantity"
                                          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                                        >
                                          <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="w-8 sm:w-9 text-center text-xs sm:text-sm font-bold text-slate-900 font-mono select-none">
                                          {item.quantity}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => updateCheckoutQuantity(item.id, 1)}
                                          aria-label="Increase quantity"
                                          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-brand-600 hover:bg-brand-100/70 active:bg-brand-200 transition-colors cursor-pointer"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                        </button>
                                      </div>

                                      {/* Item Total */}
                                      <div className="text-right min-w-[70px] sm:min-w-[85px]">
                                        <div className="text-xs sm:text-sm font-black font-mono text-slate-900">
                                          Rs. {(item.price * item.quantity).toLocaleString('en-US')}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Estimated Total Bar */}
                                <div className="pt-2.5 border-t border-red-100 flex items-center justify-between text-xs sm:text-sm">
                                  <div className="text-slate-500 text-[11px] sm:text-xs">
                                    Delivery: <b className="text-slate-700 font-mono">Rs. {COURIER_CHARGE.toLocaleString('en-US')} (COD)</b>
                                  </div>
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-slate-600 font-semibold text-xs sm:text-sm">Estimated Total:</span>
                                    <span className="font-mono font-black text-brand-600 text-base sm:text-lg">
                                      Rs. {checkoutGrandTotal.toLocaleString('en-US')}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Step 1 Next Action */}
                              <div className="pt-2">
                                <button
                                  type="button"
                                  onClick={handleGoToStep2}
                                  className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-red-600 hover:from-brand-500 hover:to-red-500 py-4 sm:py-4.5 px-6 text-sm sm:text-base font-bold text-white shadow-xl shadow-brand-500/25 transition-all hover:scale-[1.01] active:scale-98 cursor-pointer group"
                                >
                                  <span>Next: Payment & Review (ඉදිරියට යන්න)</span>
                                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                              </div>

                            </div>
                  )}

                            {/* =========================================================
                      STEP 2: PAYMENT METHOD & ORDER CONFIRMATION
                      ========================================================= */}
                            {checkoutStep === 2 && (
                              <div className={`space-y-6 ${stepDirection === 'backward' ? 'step-enter-left' : 'step-enter-right'}`}>

                                {/* 1. Payment Method Options */}
                                <div>
                                  <label className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800 mb-3">
                                    <span className="flex items-center gap-2">
                                      <CreditCard className="w-4 h-4 text-slate-400" />
                                      <span>Select Payment Method (ගෙවීම් ක්‍රමය තෝරන්න)</span>
                                    </span>
                                    <span className="text-brand-500 font-bold">*</span>
                                  </label>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
                                    {/* 1. Cash on Delivery */}
                                    <label
                                      onClick={() => setPaymentMethod('Cash on Delivery (COD)')}
                                      className={`group relative flex flex-col justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${paymentMethod === 'Cash on Delivery (COD)'
                                            ? 'border-brand-500 bg-gradient-to-br from-red-50/90 via-white to-rose-50/30 text-brand-950 shadow-[0_8px_22px_-6px_rgba(237,28,36,0.18)] ring-2 ring-brand-500/25'
                                            : 'border-slate-200/90 bg-white hover:bg-slate-50/80 hover:border-slate-300 shadow-2xs'
                            }`}
                                    >
                                      <div>
                                        {/* Top Row: Radio + Standardized Icon Slot + Status Badge */}
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            {/* Custom Glowing Radio Button */}
                                            <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${paymentMethod === 'Cash on Delivery (COD)'
                                                ? 'border-brand-500 bg-brand-500 ring-2 ring-brand-500/30'
                                                : 'border-slate-300 bg-white group-hover:border-slate-400'
                                              }`}>
                                              {paymentMethod === 'Cash on Delivery (COD)' && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                                              )}
                                            </div>

                                            {/* Standardized Logo Badge (identical h-9 min-w-[62px] px-2 across all 4) */}
                                            <div className="h-9 min-w-[62px] px-2 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-center shrink-0 shadow-2xs group-hover:border-slate-300 transition-colors">
                                              <img src="/images/payments/cod-logo.svg" alt="Cash on Delivery" className="h-5.5 w-auto object-contain" />
                                            </div>
                                          </div>

                                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/80 shrink-0">
                                            Popular
                                          </span>
                                        </div>

                                        {/* Title & Subtitle */}
                                        <div className="space-y-0.5">
                                          <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                                            Cash on Delivery
                                          </h4>
                                          <p className="text-[11px] sm:text-xs text-slate-500 font-sinhala">
                                            ලැබුණු පසු මුදල් ගෙවන්න
                                          </p>
                                        </div>
                                      </div>

                                      {/* Bottom Note */}
                                      <div className="mt-3 pt-2.5 border-t border-slate-150 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                                        <span>Pay upon home delivery</span>
                                        <span className="text-emerald-600 font-bold">100% Safe</span>
                                      </div>
                                    </label>

                                    {/* 2. Koko Pay */}
                                    <label
                                      onClick={() => setPaymentMethod('Koko (3 Installments)')}
                                      className={`group relative flex flex-col justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${paymentMethod === 'Koko (3 Installments)'
                                            ? 'border-brand-500 bg-gradient-to-br from-red-50/90 via-white to-rose-50/30 text-brand-950 shadow-[0_8px_22px_-6px_rgba(237,28,36,0.18)] ring-2 ring-brand-500/25'
                                            : 'border-slate-200/90 bg-white hover:bg-slate-50/80 hover:border-slate-300 shadow-2xs'
                            }`}
                                    >
                                      <div>
                                        {/* Top Row: Radio + Standardized Icon Slot + Status Badge */}
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${paymentMethod === 'Koko (3 Installments)'
                                                ? 'border-brand-500 bg-brand-500 ring-2 ring-brand-500/30'
                                                : 'border-slate-300 bg-white group-hover:border-slate-400'
                                              }`}>
                                              {paymentMethod === 'Koko (3 Installments)' && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                                              )}
                                            </div>

                                            {/* Standardized Logo Badge (identical h-9 min-w-[62px] px-2 across all 4) */}
                                            <div className="h-9 min-w-[62px] px-2 rounded-xl bg-white border border-slate-200/90 flex items-center justify-center shrink-0 shadow-2xs group-hover:border-slate-300 transition-colors">
                                              <img src="/images/payments/koko-logo.png" alt="Koko Pay" className="h-4.5 max-h-[18px] w-auto object-contain" />
                                            </div>
                                          </div>

                                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200/80 shrink-0">
                                            0% Interest
                                          </span>
                                        </div>

                                        {/* Title, Subtitle & Info Link */}
                                        <div className="space-y-0.5">
                                          <div className="flex items-center gap-1.5">
                                            <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                                              Koko Pay (3 ×)
                                            </h4>
                                            <a
                                              href="https://paykoko.com/"
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              onClick={(e) => e.stopPropagation()}
                                              className="w-3.5 h-3.5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[9px] font-bold font-serif hover:bg-brand-500 transition-colors cursor-pointer"
                                              title="Learn more about Koko Pay (opens paykoko.com in new tab)"
                                            >
                                              i
                                            </a>
                                          </div>
                                          <p className="text-[11px] sm:text-xs text-slate-500 font-sinhala">
                                            පොලී රහිත මාසික වාරික 3කින්
                                          </p>
                                        </div>
                                      </div>

                                      {/* Bottom Note with Installment Calculation */}
                                      <div className="mt-3 pt-2.5 border-t border-slate-150 flex items-center justify-between text-[11px] text-slate-700 font-medium">
                                        <span>or 3 × <b className="font-mono text-slate-900 font-bold">Rs. {Math.round(checkoutGrandTotal / 3).toLocaleString('en-US')}</b> / mo</span>
                                        <span className="text-purple-600 font-bold">Debit / Credit</span>
                                      </div>
                                    </label>

                                    {/* 3. Payzy Digital */}
                                    <label
                                      onClick={() => setPaymentMethod('Payzy Digital')}
                                      className={`group relative flex flex-col justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${paymentMethod === 'Payzy Digital'
                                            ? 'border-brand-500 bg-gradient-to-br from-red-50/90 via-white to-rose-50/30 text-brand-950 shadow-[0_8px_22px_-6px_rgba(237,28,36,0.18)] ring-2 ring-brand-500/25'
                                            : 'border-slate-200/90 bg-white hover:bg-slate-50/80 hover:border-slate-300 shadow-2xs'
                            }`}
                                    >
                                      <div>
                                        {/* Top Row: Radio + Standardized Icon Slot + Status Badge */}
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${paymentMethod === 'Payzy Digital'
                                                ? 'border-brand-500 bg-brand-500 ring-2 ring-brand-500/30'
                                                : 'border-slate-300 bg-white group-hover:border-slate-400'
                                              }`}>
                                              {paymentMethod === 'Payzy Digital' && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                                              )}
                                            </div>

                                            {/* Standardized Logo Badge (identical h-9 min-w-[62px] px-2 across all 4) */}
                                            <div className="h-9 min-w-[62px] px-2 rounded-xl bg-white border border-slate-200/90 flex items-center justify-center shrink-0 shadow-2xs group-hover:border-slate-300 transition-colors">
                                              <img src="/images/payments/payzy-logo.png" alt="Payzy" className="h-4 max-h-[16px] w-auto object-contain" />
                                            </div>
                                          </div>

                                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200/80 shrink-0">
                                            Flexible
                                          </span>
                                        </div>

                                        {/* Title, Subtitle & Info Link */}
                                        <div className="space-y-0.5">
                                          <div className="flex items-center gap-1.5">
                                            <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                                              Payzy (up to 4 ×)
                                            </h4>
                                            <a
                                              href="https://payzy.lk/"
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              onClick={(e) => e.stopPropagation()}
                                              className="w-3.5 h-3.5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[9px] font-bold font-serif hover:bg-sky-500 transition-colors cursor-pointer"
                                              title="Learn more about PayZy (opens payzy.lk in new tab)"
                                            >
                                              i
                                            </a>
                                          </div>
                                          <p className="text-[11px] sm:text-xs text-slate-500 font-sinhala">
                                            නම්‍යශීලී මාසික වාරික
                                          </p>
                                        </div>
                                      </div>

                                      {/* Bottom Note with Installment Calculation */}
                                      <div className="mt-3 pt-2.5 border-t border-slate-150 flex items-center justify-between text-[11px] text-slate-700 font-medium">
                                        <span>or up to 4 × <b className="font-mono text-slate-900 font-bold">Rs. {Math.round(checkoutGrandTotal / 4).toLocaleString('en-US')}</b> / mo</span>
                                        <span className="text-sky-600 font-bold">Pay Later</span>
                                      </div>
                                    </label>

                                    {/* 4. Online / Bank Transfer */}
                                    <label
                                      onClick={() => setPaymentMethod('Online / Bank Transfer')}
                                      className={`group relative flex flex-col justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${paymentMethod === 'Online / Bank Transfer'
                                            ? 'border-brand-500 bg-gradient-to-br from-red-50/90 via-white to-rose-50/30 text-brand-950 shadow-[0_8px_22px_-6px_rgba(237,28,36,0.18)] ring-2 ring-brand-500/25'
                                            : 'border-slate-200/90 bg-white hover:bg-slate-50/80 hover:border-slate-300 shadow-2xs'
                            }`}
                                    >
                                      <div>
                                        {/* Top Row: Radio + Standardized Icon Slot + Status Badge */}
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${paymentMethod === 'Online / Bank Transfer'
                                                ? 'border-brand-500 bg-brand-500 ring-2 ring-brand-500/30'
                                                : 'border-slate-300 bg-white group-hover:border-slate-400'
                                              }`}>
                                              {paymentMethod === 'Online / Bank Transfer' && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                                              )}
                                            </div>

                                            {/* Standardized Logo Badge (identical h-9 min-w-[62px] px-2 across all 4) */}
                                            <div className="h-9 min-w-[62px] px-2 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-center shrink-0 shadow-2xs group-hover:border-slate-300 transition-colors">
                                              <img src="/images/payments/bank-transfer.svg" alt="Bank Transfer" className="h-5.5 w-auto object-contain" />
                                            </div>
                                          </div>

                                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200/80 shrink-0">
                                            Direct Bank
                                          </span>
                                        </div>

                                        {/* Title & Subtitle */}
                                        <div className="space-y-0.5">
                                          <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                                            Online / Bank Transfer
                                          </h4>
                                          <p className="text-[11px] sm:text-xs text-slate-500 font-sinhala">
                                            බැංකු තැන්පතු හෝ Online Banking
                                          </p>
                                        </div>
                                      </div>

                                      {/* Bottom Note */}
                                      <div className="mt-3 pt-2.5 border-t border-slate-150 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                                        <span>Slip verification via WhatsApp</span>
                                        <span className="text-indigo-600 font-bold">Fast Verify</span>
                                      </div>
                                    </label>
                                  </div>
                                </div>

                                {/* 2. Order Summary Card */}
                                <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-4">
                                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800 border-b border-slate-200 pb-3">
                                    <span className="flex items-center gap-2">
                                      <ShoppingBag className="w-4 h-4 text-slate-500" />
                                      <span>Selected Items ({checkoutItems.length})</span>
                                    </span>
                                    <span className="font-mono text-brand-600 font-bold text-sm sm:text-base">
                                      Rs. {checkoutSubtotal.toLocaleString('en-US')}
                                    </span>
                                  </div>

                                  {/* Items list with quantity controls */}
                                  <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
                                    {checkoutItems.map((item) => (
                                      <div key={item.id} className="flex items-center justify-between gap-3 text-xs sm:text-sm bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                          {item.image && (
                                            <img
                                              src={item.image}
                                              alt={item.title}
                                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                              className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-100 p-0.5 shrink-0"
                                            />
                                          )}
                                          <div className="truncate">
                                            <span className="font-semibold text-slate-800 text-xs sm:text-sm truncate block">{item.title}</span>
                                            <span className="text-slate-500 font-mono text-[11px]">Rs. {item.price.toLocaleString('en-US')} each</span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 shrink-0">
                                          {/* Quantity stepper */}
                                          <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden shadow-2xs">
                                            <button
                                              type="button"
                                              onClick={() => updateCheckoutQuantity(item.id, -1)}
                                              disabled={item.quantity <= 1}
                                              aria-label="Decrease quantity"
                                              className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                                            >
                                              <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-6 text-center text-xs font-bold font-mono text-slate-900 select-none">
                                              {item.quantity}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => updateCheckoutQuantity(item.id, 1)}
                                              aria-label="Increase quantity"
                                              className="w-6 h-6 flex items-center justify-center text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer"
                                            >
                                              <Plus className="w-3 h-3" />
                                            </button>
                                          </div>

                                          <span className="font-mono text-slate-900 font-bold shrink-0 min-w-[70px] text-right text-xs sm:text-sm">
                                            Rs. {(item.price * item.quantity).toLocaleString('en-US')}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Cost breakdown */}
                                  <div className="pt-3 border-t border-slate-200 space-y-2 text-xs sm:text-sm">
                                    <div className="flex items-center justify-between text-slate-600">
                                      <span>Item Subtotal:</span>
                                      <span className="font-mono font-bold text-slate-800">Rs. {checkoutSubtotal.toLocaleString('en-US')}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-600">
                                      <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                                        <Truck className="w-4 h-4" />
                                        <span>Courier Delivery Charge:</span>
                                      </span>
                                      <span className="font-mono font-bold text-slate-800">Rs. {COURIER_CHARGE.toLocaleString('en-US')}</span>
                                    </div>
                                    <div className="pt-3 border-t border-dashed border-slate-200 flex items-center justify-between">
                                      <div>
                                        <span className="text-sm sm:text-base font-black text-slate-900">Total Amount Payable:</span>
                                        <p className="text-xs text-slate-400 font-sinhala font-normal">(මුළු මුදල - භාණ්ඩ + කුරියර් ගාස්තු)</p>
                                      </div>
                                      <span className="text-xl sm:text-2xl text-brand-600 font-mono font-black">
                                        Rs. {checkoutGrandTotal.toLocaleString('en-US')}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* 3. Delivery Details Snapshot with Edit button */}
                                <div className="flex items-center justify-between p-4 sm:p-4.5 rounded-2xl bg-white border border-slate-200 shadow-2xs text-xs sm:text-sm">
                                  <div className="flex items-center gap-3.5 truncate">
                                    <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <div className="truncate">
                                      <p className="font-bold text-slate-900 truncate text-sm sm:text-base">{name} • {phone1}</p>
                                      <p className="text-xs sm:text-sm text-slate-500 truncate mt-0.5">{address}</p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleBackToStep1}
                                    className="text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 px-3 py-1.5 rounded-xl hover:bg-brand-50 transition-colors shrink-0 ml-2 cursor-pointer"
                                  >
                                    Edit (වෙනස්)
                                  </button>
                                </div>

                                {/* 4. Guarantee strip */}
                                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70">
                                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                                  <span className="font-medium">100% Genuine Company Warranty & Safe Doorstep Dispatch.</span>
                                </div>

                                {/* 5. Dual Action Buttons (Back + Confirm WhatsApp) */}
                                <div className="flex items-center gap-3 sm:gap-4 pt-2">
                                  <button
                                    type="button"
                                    onClick={handleBackToStep1}
                                    className="px-5 sm:px-6 py-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:border-slate-300"
                                  >
                                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span>Back (ආපසු)</span>
                                  </button>

                                  <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-4 sm:py-4.5 px-6 text-sm sm:text-base font-bold text-white shadow-xl shadow-emerald-600/25 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-75 cursor-pointer"
                                  >
                                    {isSubmitting ? (
                                      <span className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Confirming Order...</span>
                                      </span>
                                    ) : (
                                      <>
                                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span>Confirm Order via WhatsApp (ඇණවුම තහවුරු කරන්න)</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                              </div>
                            )}

                          </form>
                        </div>
            )}

                      </div>
        </div>
              )}
            </>
            );
}
