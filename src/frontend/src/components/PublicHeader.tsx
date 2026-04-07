import { Link, useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { useContactConfig, usePaymentConfig } from "../hooks/useQueries";

// QQ SVG icon
function QQIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.527 3.66 1.438 5.168L2 22l5.007-1.312A9.97 9.97 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 2c4.418 0 8 3.582 8 8s-3.582 8-8 8a7.97 7.97 0 0 1-3.95-1.047l-.283-.17-2.925.766.795-2.844-.185-.295A7.97 7.97 0 0 1 4 12c0-4.418 3.582-8 8-8zm-2.5 4.5c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5S11 10.828 11 10s-.672-1.5-1.5-1.5zm5 0c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5S16 10.828 16 10s-.672-1.5-1.5-1.5zm-2.5 4c-1.667 0-3 .895-3 2h6c0-1.105-1.333-2-3-2z" />
    </svg>
  );
}

// Xiaohongshu SVG icon
function XiaohongshuIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 7.5h-2v5h-1v-5h-2v-1h5v1zm-7 0v1.5h2v1h-2V14h-1V8.5h3v1h-2z" />
    </svg>
  );
}

/**
 * Convert a click position (in viewport coordinates) into a transformOrigin
 * percentage string relative to a centered modal card.
 *
 * The card is displayed centered in the viewport via `fixed inset-0 flex
 * items-center justify-center`, so the card's top-left corner is at:
 *   left = (vw - cardW) / 2
 *   top  = (vh - cardH) / 2
 *
 * The transform origin must be expressed as an offset from the card's own
 * top-left corner, which we then convert to percentages of card dimensions.
 */
function computeTransformOrigin(
  clickX: number,
  clickY: number,
  cardW: number,
  cardH: number,
): string {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Position of the card's top-left corner in viewport space
  const cardLeft = (vw - cardW) / 2;
  const cardTop = (vh - cardH) / 2;

  // Click offset relative to card's top-left corner
  const dx = clickX - cardLeft;
  const dy = clickY - cardTop;

  // Convert to percentages of card dimensions, clamped to [0, 100]
  const ox = Math.max(0, Math.min(100, (dx / cardW) * 100));
  const oy = Math.max(0, Math.min(100, (dy / cardH) * 100));

  return `${ox.toFixed(1)}% ${oy.toFixed(1)}%`;
}

interface ClickOrigin {
  x: number;
  y: number;
  transformOrigin: string;
}

export function PublicHeader() {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [paymentOrigin, setPaymentOrigin] = useState<ClickOrigin | null>(null);
  const [contactOrigin, setContactOrigin] = useState<ClickOrigin | null>(null);
  const navigate = useNavigate();
  const { data: paymentConfig } = usePaymentConfig();
  const { data: contactConfig } = useContactConfig();

  const priceText = paymentConfig?.priceText || "5元/张";
  const wechatPayUrl = paymentConfig?.wechatBlob?.getDirectURL();
  const alipayUrl = paymentConfig?.alipayBlob?.getDirectURL();
  const qqUrl = contactConfig?.qqBlob?.getDirectURL();
  const wechatContactUrl = contactConfig?.wechatBlob?.getDirectURL();
  const xiaohongshuUrl = contactConfig?.xiaohongshuBlob?.getDirectURL();

  // Hidden admin login: 2 clicks within 2 seconds on the logo icon
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoIconClick = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    if (clickCountRef.current >= 2) {
      clickCountRef.current = 0;
      navigate({ to: "/admin/login" });
      return;
    }
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 2000);
  };

  const handlePaymentClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Compute card dimensions at click time to avoid SSR issues
    const cardW = Math.min(280, window.innerWidth * 0.85);
    const cardH = 460;
    const origin = computeTransformOrigin(e.clientX, e.clientY, cardW, cardH);
    setPaymentOrigin({ x: e.clientX, y: e.clientY, transformOrigin: origin });
    setPaymentOpen(true);
  };

  const handleContactClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Compute card dimensions at click time to avoid SSR issues
    const cardW = Math.min(280, window.innerWidth * 0.85);
    const cardH = 560;
    const origin = computeTransformOrigin(e.clientX, e.clientY, cardW, cardH);
    setContactOrigin({ x: e.clientX, y: e.clientY, transformOrigin: origin });
    setContactOpen(true);
  };

  return (
    <>
      {/* Single top header bar: icon | title | payment + contact buttons */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-[1600px] mx-auto px-2 sm:px-4 h-12 flex items-center gap-1.5 sm:gap-2 min-w-0">
          {/* Hidden admin login trigger (bread emoji icon) */}
          <button
            type="button"
            onClick={handleLogoIconClick}
            className="p-1 rounded text-primary transition-colors focus:outline-none shrink-0"
            aria-label="图库"
            data-ocid="nav.logo_icon"
          >
            <span className="text-base leading-none select-none">🍞</span>
          </button>

          {/* Title */}
          <Link
            to="/"
            className="no-underline shrink-0 min-w-0"
            data-ocid="nav.link"
          >
            <span className="font-display font-semibold text-sm sm:text-base text-primary tracking-tight whitespace-nowrap">
              小面包AI图库
            </span>
          </Link>

          {/* Spacer */}
          <div className="flex-1 min-w-0" />

          {/* Payment button */}
          <button
            type="button"
            onClick={handlePaymentClick}
            className="flex items-center gap-1 px-2 py-1 rounded border border-pink-300 bg-pink-50 text-pink-700 font-medium text-xs hover:bg-pink-100 hover:border-pink-400 transition-colors shrink-0"
            data-ocid="payment.open_modal_button"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3 w-3 fill-current"
              aria-hidden="true"
            >
              <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
            </svg>
            <span>支付</span>
            <span className="opacity-70">5/p</span>
          </button>

          {/* Contact button */}
          <button
            type="button"
            onClick={handleContactClick}
            className="flex items-center gap-1 px-2 py-1 rounded border border-rose-300 bg-rose-50 text-rose-700 font-medium text-xs hover:bg-rose-100 hover:border-rose-400 transition-colors shrink-0"
            data-ocid="contact.open_modal_button"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3 w-3 fill-current"
              aria-hidden="true"
            >
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
            </svg>
            联系发图
          </button>
        </div>
      </header>

      {/* Payment Modal */}
      <AnimatePresence>
        {paymentOpen && paymentOrigin && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setPaymentOpen(false)}
            />
            {/* Modal content */}
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
              <motion.div
                className="w-[85vw] max-w-[280px] bg-background rounded-xl shadow-2xl p-4 pointer-events-auto"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                style={{ transformOrigin: paymentOrigin.transformOrigin }}
                data-ocid="payment.dialog"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-1 mb-2">
                  <div className="flex-1" />
                  <h2 className="text-pink-700 text-center text-base font-semibold flex-1">
                    扫码支付 · {priceText}
                  </h2>
                  <div className="flex-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setPaymentOpen(false)}
                      className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                      data-ocid="payment.close_button"
                      aria-label="关闭"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 py-2">
                  {/* WeChat Pay */}
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    {wechatPayUrl ? (
                      <img
                        src={wechatPayUrl}
                        alt="微信收款码"
                        className="w-32 h-32 object-contain rounded-lg border border-green-100 bg-white p-1"
                      />
                    ) : (
                      <div className="w-32 h-32 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-green-200 bg-green-50 text-green-500 text-xs text-center px-2 gap-1">
                        <span>微信码未设置</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 fill-current"
                        aria-hidden="true"
                      >
                        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.063-6.122zm-3.56 3.307c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
                      </svg>
                      微信
                    </div>
                  </div>

                  <div className="w-full h-px bg-border" />

                  {/* Alipay */}
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    {alipayUrl ? (
                      <img
                        src={alipayUrl}
                        alt="支付宝收款码"
                        className="w-32 h-32 object-contain rounded-lg border border-blue-100 bg-white p-1"
                      />
                    ) : (
                      <div className="w-32 h-32 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-200 bg-blue-50 text-blue-500 text-xs text-center px-2 gap-1">
                        <span>支付宝码未设置</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-blue-600 text-xs font-medium">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 fill-current"
                        aria-hidden="true"
                      >
                        <path d="M21.422 15.358c-3.41-1.31-5.638-2.213-6.922-2.83.98-1.59 1.73-3.46 2.19-5.528H20V5.5h-5V3h-2.5v2.5H8V7h8.385c-.36 1.49-.92 2.84-1.63 3.98-1.78-.735-3.31-1.072-4.755-1.072-3.24 0-5.41 1.65-5.41 4.11 0 2.215 1.76 4.175 5.305 4.175 2.29 0 4.59-1.035 6.525-2.88 1.665.79 3.73 1.74 6.08 2.81l.92-2.765zM9.965 16.27c-2.085 0-3.018-.94-3.018-2.02 0-1.485 1.228-2.112 2.908-2.112 1.46 0 2.79.38 4.115 1.165C12.6 14.938 11.2 16.27 9.965 16.27z" />
                      </svg>
                      支付宝
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center pb-1 mt-2">
                  付款后请截图，通过联系方式联系我们获取图片
                </p>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Contact Modal */}
      <AnimatePresence>
        {contactOpen && contactOrigin && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setContactOpen(false)}
            />
            {/* Modal content */}
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
              <motion.div
                className="w-[85vw] max-w-[280px] bg-background rounded-xl shadow-2xl p-4 pointer-events-auto"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                style={{ transformOrigin: contactOrigin.transformOrigin }}
                data-ocid="contact.dialog"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-1 mb-2">
                  <div className="flex-1" />
                  <h2 className="text-rose-700 text-center text-base font-semibold flex-1">
                    联系发图
                  </h2>
                  <div className="flex-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setContactOpen(false)}
                      className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                      data-ocid="contact.close_button"
                      aria-label="关闭"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 py-2">
                  {/* QQ */}
                  <div className="flex flex-col items-center gap-1 w-full">
                    {qqUrl ? (
                      <img
                        src={qqUrl}
                        alt="QQ二维码"
                        className="w-28 h-28 object-contain rounded-lg border border-sky-100 bg-white p-1"
                      />
                    ) : (
                      <div className="w-28 h-28 flex items-center justify-center rounded-lg border-2 border-dashed border-sky-200 bg-sky-50 text-sky-500 text-xs">
                        QQ码未设置
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-sky-600 text-xs font-medium">
                      <QQIcon className="h-3.5 w-3.5" />
                      QQ
                    </div>
                  </div>

                  <div className="w-full h-px bg-border" />

                  {/* WeChat contact */}
                  <div className="flex flex-col items-center gap-1 w-full">
                    {wechatContactUrl ? (
                      <img
                        src={wechatContactUrl}
                        alt="微信二维码"
                        className="w-28 h-28 object-contain rounded-lg border border-green-100 bg-white p-1"
                      />
                    ) : (
                      <div className="w-28 h-28 flex items-center justify-center rounded-lg border-2 border-dashed border-green-200 bg-green-50 text-green-500 text-xs">
                        微信码未设置
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 fill-current"
                        aria-hidden="true"
                      >
                        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.063-6.122zm-3.56 3.307c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
                      </svg>
                      微信
                    </div>
                  </div>

                  <div className="w-full h-px bg-border" />

                  {/* Xiaohongshu */}
                  <div className="flex flex-col items-center gap-1 w-full">
                    {xiaohongshuUrl ? (
                      <img
                        src={xiaohongshuUrl}
                        alt="小红书二维码"
                        className="w-28 h-28 object-contain rounded-lg border border-red-100 bg-white p-1"
                      />
                    ) : (
                      <div className="w-28 h-28 flex items-center justify-center rounded-lg border-2 border-dashed border-red-200 bg-red-50 text-red-500 text-xs">
                        小红书码未设置
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-red-600 text-xs font-medium">
                      <XiaohongshuIcon className="h-3.5 w-3.5" />
                      小红书
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
