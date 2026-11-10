// وارد کردن هوک‌های React برای مدیریت وضعیت و تغییرات محصول
import { useEffect, useState } from 'react'

// دریافت اطلاعات رستوران، مثل شماره تماس
import API_URL from './api'
import useRestaurantSettings from './useRestaurantSettings'
// وارد کردن فایل استایل صفحه جزئیات محصول
import './ProductDetails.css'

function ProductDetails({
  product,
  onBack,
  isFavorite,
  onToggleFavorite,
}) {


  const { settings } = useRestaurantSettings()


  // نگهداری شماره اندازه انتخاب‌شده
  // مقدار صفر یعنی اولین اندازه انتخاب شده است
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0)

  // هر زمان محصول تغییر کرد، اندازه انتخاب‌شده را به اولین گزینه برگردان
  useEffect(() => {
    setSelectedSizeIndex(0)
  }, [product?.id])

  // اگر محصولی برای نمایش وجود نداشت، کامپوننت چیزی نمایش ندهد
  if (!product) return null

  // بررسی وجود اندازه‌های مختلف برای محصول
  const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0

  // پیدا کردن اندازه‌ای که کاربر انتخاب کرده است
  const selectedSize = hasSizes
    ? product.sizes[selectedSizeIndex]
    : null

  // دریافت قیمت بر اساس اندازه انتخاب‌شده یا قیمت معمولی محصول
  const currentPrice = selectedSize
    ? selectedSize.price
    : product.price

  // تبدیل قیمت به رشته با جداکننده و اعداد فارسی
  const formattedPrice = Number(currentPrice || 0).toLocaleString('fa-IR')

  // دریافت ترکیبات محصول؛ اگر اطلاعاتی وجود نداشت، آرایه خالی در نظر گرفته می‌شود
  const ingredients = Array.isArray(product.ingredients)
    ? product.ingredients
    : []

  return (
    // لایه تیره پشت پنجره جزئیات؛ با کلیک روی آن پنجره بسته می‌شود
    <div className="product-sheet-overlay" onClick={onBack}>

      {/* پنجره اصلی جزئیات محصول */}
      <section
        className="product-sheet"
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-label={`جزئیات ${product.name}`}
        // جلوگیری از بسته شدن پنجره هنگام کلیک داخل آن
        onClick={(event) => event.stopPropagation()}
      >

        {/* بخش اسکرول‌پذیر اطلاعات محصول */}
        <div className="product-sheet-scroll">

          {/* سربرگ صفحه */}
          <header className="product-sheet-header">

            {/* دکمه بازگشت به منوی قبلی */}
            <button
              type="button"
              className="sheet-back-button"
              onClick={onBack}
              aria-label="بازگشت"
            >
              <img src="/images/arrow.svg" alt="" />
            </button>

            {/* دکمه افزودن یا حذف محصول از علاقه‌مندی‌ها */}
            <button
              type="button"
              className="favorite-button"
              aria-label={
                isFavorite
                  ? 'حذف از علاقه‌مندی‌ها'
                  : 'افزودن به علاقه‌مندی‌ها'
              }
              onClick={() => onToggleFavorite(product.id)}
            >
              <img
                src={
                  isFavorite
                    ? '/images/favourite-filled.svg'
                    : '/images/favourite.svg'
                }
                alt=""
                className="favorite-icon"
              />
            </button>
          </header>

          {/* تصویر اصلی محصول */}
          <img
            className="product-sheet-image"
            src={
              product.image
                ? `${API_URL}${product.image.startsWith('/') ? '' : '/'}${product.image}`
                : '/images/default-product.svg'
            }
            alt={product.name}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = '/images/default-product.svg';
            }}
          />

          {/* محتوای اطلاعات محصول */}
          <div className="product-sheet-content">

            {/* نشان ویژه و امتیاز محصول */}
            <div className="product-highlights">

              {/* نمایش نشان محصول */}
              <span className="product-badge">
                {product.badge || 'ویژه هخامنش'}
              </span>

              {/* نمایش امتیاز محصول */}
              <span className="product-sheet-rating">
                ⭐ {product.rating ?? '—'}
              </span>
            </div>

            {/* نمایش نام محصول */}
            <h1 className="product-sheet-title">{product.name}</h1>

            {/* نمایش توضیحات اختصاصی محصول یا متن پیش‌فرض */}
            <p className="product-sheet-description">
              {product.description?.trim() ||
                'برای آشنایی بیشتر با این محصول، ترکیبات و مواد اولیه آن را بررسی کنید.'}
            </p>
            

            {/* نمایش انتخاب اندازه فقط برای محصولاتی که اندازه دارند */}
            {hasSizes && (
              <section className="pizza-size-section">

                {/* عنوان بخش انتخاب اندازه */}
                <h2>انتخاب اندازه</h2>

                {/* قرار دادن گزینه‌های اندازه در کنار یکدیگر */}
                <div className="pizza-size-options">

                  {/* ساخت دکمه برای هر اندازه موجود در اطلاعات محصول */}
                  {product.sizes.map((size, index) => (
                    <button
                      type="button"
                      key={size.name}
                      className={`pizza-size-option ${
                        selectedSizeIndex === index ? 'active' : ''
                      }`}
                      aria-pressed={selectedSizeIndex === index}
                      // تغییر اندازه انتخاب‌شده با کلیک کاربر
                      onClick={() => setSelectedSizeIndex(index)}
                    >

                      {/* نمایش نام اندازه */}
                      <span className="pizza-size-option-name">
                        {size.name}
                      </span>

                      {/* نمایش قیمت همان اندازه */}
                      <span className="pizza-size-option-price">
                        {Number(size.price).toLocaleString('fa-IR')}
                        {' '}تومان
                      </span>

                    </button>
                  ))}

                </div>
              </section>
            )}

            {/* نمایش قیمت محصول یا قیمت اندازه انتخاب‌شده */}
            <div className="product-price">
              <strong>{formattedPrice}</strong>
              <span>{product.currency || 'تومان'}</span>
            </div>

            {/* خط جداکننده بخش‌ها */}
            <hr className="product-section-divider" />

            {/* بخش ترکیبات و مواد اولیه محصول */}
            <section className="product-ingredients">
              <h2>ترکیبات و مواد اولیه</h2>

              <div className="ingredients-list">
                {ingredients.length > 0 ? (
                  // نمایش ترکیبات محصول در صورت وجود
                  ingredients.map((ingredient, index) => (
                    <span
                      className="ingredient-chip"
                      key={`${ingredient}-${index}`}
                    >
                      {ingredient}
                    </span>
                  ))
                ) : (
                  // نمایش پیام جایگزین در صورت نبود اطلاعات ترکیبات
                  <p className="no-ingredients">
                    اطلاعات ترکیبات این محصول در حال تکمیل است.
                  </p>
                )}
              </div>
            </section>

            {/* بخش اطلاعات تکمیلی محصول */}
            <div className="product-facts">

              {/* نمایش میزان کالری */}
              <div className="product-fact">
                <span className="product-fact-icon">⚡</span>
                <span className="product-fact-label">انرژی تقریبی</span>

                <strong>
                  {product.calories != null
                    ? `${Number(product.calories).toLocaleString('fa-IR')} کالری`
                    : 'ثبت نشده'}
                </strong>
              </div>

              {/* نمایش زمان آماده‌سازی */}
              <div className="product-fact">
                <span className="product-fact-icon">◷</span>
                <span className="product-fact-label">زمان آماده‌سازی</span>

                <strong>
                  {product.preparationTime || 'ثبت نشده'}
                </strong>
              </div>

            </div>
          </div>
        </div>

        {/* فوتر ثابت در پایین پنجره جزئیات */}
        <footer className="product-sheet-footer">

          {/* نمایش شماره تماس رستوران */}
          <div className="restaurant-contact">
            <span className="contact-label">تماس با رستوران</span>

            {/* امکان تماس تلفنی با کلیک روی شماره */}
            <a href={settings?.phone ? `tel:${settings.phone}` : undefined}>
              {settings?.phone || 'شماره تماس ثبت نشده'}
            </a>
          </div>

          {/* دکمه اشتراک‌گذاری محصول */}
          <button
            type="button"
            className="product-share-button"
            aria-label="اشتراک‌گذاری محصول"

            // اجرای عملیات اشتراک‌گذاری هنگام کلیک
            onClick={() => {

              // دریافت آدرس صفحه فعلی
              const shareUrl = window.location.href

              // استفاده از قابلیت اشتراک‌گذاری مرورگر در صورت پشتیبانی
              if (navigator.share) {
                navigator.share({
                  title: product.name,
                  text: product.description || product.name,
                  url: shareUrl,
                }).catch(() => {})

              } else if (navigator.clipboard) {
                // در غیر این صورت، کپی کردن لینک در کلیپ‌بورد
                navigator.clipboard.writeText(shareUrl).catch(() => {})
              }
            }}
          >

            {/* آیکون اشتراک‌گذاری با SVG */}
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="share-icon"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.7 10.6 15.3 6.4 M8.7 13.4 15.3 17.6" />
            </svg>

          </button>
        </footer>
      </section>
    </div>
  )
}

// صادر کردن کامپوننت برای استفاده در سایر فایل‌های پروژه
export default ProductDetails