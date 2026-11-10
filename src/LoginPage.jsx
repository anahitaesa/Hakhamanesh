
// وارد کردن ابزارهای موردنیاز از React
import { useState } from 'react'

// وارد کردن ابزار جابه‌جایی بین صفحات
import { useNavigate } from 'react-router-dom'

// وارد کردن فایل استایل صفحه ورود
import './LoginPage.css'

// وارد کردن آدرس پایه سرور
import API_URL from './api'

// کامپوننت صفحه ورود مدیر
function LoginPage() {

  // کنترل نمایش یا مخفی بودن رمزعبور
  const [showPassword, setShowPassword] = useState(false)  

  // نگهداری نام کاربری واردشده
  const [username, setUsername] = useState('')

  // نگهداری رمز عبور واردشده
  const [password, setPassword] = useState('')

  // نگهداری پیام خطا
  const [error, setError] = useState('')

  // کنترل وضعیت ارسال درخواست
  const [loading, setLoading] = useState(false)

  // ساخت ابزار انتقال به صفحه دیگر
  const navigate = useNavigate()

  // اجرای عملیات ورود مدیر
  async function handleLogin(event) {
    // جلوگیری از بارگذاری مجدد صفحه
    event.preventDefault()

    // پاک کردن خطاهای قبلی
    setError('')

    // فعال کردن وضعیت انتظار
    setLoading(true)

    try {
      // ارسال اطلاعات ورود به بک‌اند
      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          // مشخص کردن نوع درخواست
          method: 'POST',

          // مشخص کردن نوع اطلاعات ارسالی
          headers: {
            'Content-Type': 'application/json'
          },

          // تبدیل اطلاعات ورود به قالب JSON
          body: JSON.stringify({
            username: username,
            password: password
          })
        }
      )

      // دریافت پاسخ بک‌اند
      const data = await response.json()

      // بررسی موفقیت ورود
      if (!response.ok) {
        throw new Error(data.detail || 'ورود ناموفق بود')
      }

      // ذخیره توکن مدیر در حافظه موقت نشست مرورگر
      sessionStorage.setItem('admin_token', data.access_token)

      // انتقال مدیر به صفحه پنل مدیریت
      navigate('/admin')
    } catch (err) {
      // نمایش پیام خطا در صورت ناموفق بودن ورود
      setError(err.message || 'ارتباط با سرور برقرار نشد')
    } finally {
      // غیرفعال کردن وضعیت انتظار
      setLoading(false)
    }
  }

  // نمایش فرم ورود
  return (
    <div className="login-page">
      {/* کارت اصلی ورود */}
      <div className="login-card">

        {/* عنوان و معرفی پنل */}
        <div className="login-header">
          <h1>هخامنش</h1>
          <p>ورود به پنل مدیریت</p>
        </div>

        {/* فرم دریافت اطلاعات ورود */}
        <form onSubmit={handleLogin}>

          {/* ورودی نام کاربری */}
          <div className="login-field">
            <label htmlFor="username">نام کاربری</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="نام کاربری خود را وارد کنید"
              autoComplete="username"
              required
            />
          </div>

          {/* ورودی رمز عبور */}
          <div className="login-field">
            <label htmlFor="password">رمز عبور</label>
            {/* ظرف نگهدارنده ورودی رمزعبور و دکمه نمایش ان */}
            <div className="password-wrapper">
                {/* ورودی رمزعبور */}
                <input 
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="رمز عبور خود را وارد کنید"
                    autoComplete="current-password"
                    required
                />

                {/* دکمه نمابش یا مخفی کردن رمز عبور */}
                <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'}
                >
                    {/* نمایش آیکون متناسب با وضعیت رمز عبور */}
                    {showPassword ? (
                        // آیکون چشم خط‌خورده برای رمز قابل مشاهده
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20px"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M3 3l18 18" />
                            <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                            <path d="M9.88 5.09A10.7 10.7 0 0 1 12 4.9c5 0 9.27 4.1 10 7.1a10.8 10.8 0 0 1-4.1 5.5" />
                            <path d="M6.61 6.61A11.5 11.5 0 0 0 2 12c.73 3 5 7.1 10 7.1 1.4 0 2.7-.4 3.8-1" />
                        </svg>
                    ) : (
                        // آیکون چشم معمولی برای رمز مخفی
                        <svg 
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M2 12s3.64-7 10-7 10 7 10 7-3.64 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    )}
                </button>
            </div>

          </div>

          {/* نمایش پیام خطا در صورت بروز مشکل */}
          {error && (
            <p className="login-error">
              {error}
            </p>
          )}

          {/* دکمه ارسال اطلاعات ورود */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'در حال بررسی...' : 'ورود به پنل'}
          </button>
        </form>

        {/* لینک بازگشت به صفحه اصلی */}
        <a href="/" className="login-back">
          بازگشت به صفحه اصلی
        </a>
      </div>
    </div>
  )
}

// در دسترس قرار دادن کامپوننت صفحه ورود
export default LoginPage
