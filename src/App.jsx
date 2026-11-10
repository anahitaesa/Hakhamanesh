// وارد کردن کامپوننت صفحه ورود مدیر
import LoginPage from './LoginPage'


// وارد کردن هوک‌های موردنیاز از React
import { useRef, useEffect } from 'react'

// وارد کردن ابزارهای مدیریت مسیرها از React Router
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'

// وارد کردن صفحات مختلف برنامه
import HomePage from './HomePage'
import MenuPage from './MenuPage'
import AdminPage from './AdminPage'

// کامپوننت محافظ برای جلوگیری از ورود بدون احراز هویت
function ProtectedRoute({ children }) {
  // بررسی وجود توکن مدیر در حافظه موقت مرورگر
  const token = sessionStorage.getItem('admin_token')

  // اگر توکن وجود نداشت، کاربر را به صفحه ورود منتقل کن
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // درصورت وجود توکن، صفحه موردنظر را نمایش بده
  return children
}

// کامپوننت اصلی برنامه
function App() {
  // ساخت یک مرجع برای نگهداری فایل صدای کلیک
  const clickSound = useRef(null)

  // ایجاد امکان جابه‌جایی بین صفحات برنامه
  const navigate = useNavigate()

  // این بخش فقط یک بار هنگام بارگذاری برنامه اجرا می‌شود
  useEffect(() => {
    // ساخت نمونه صدای کلیک از فایل موجود در پوشه public
    clickSound.current = new Audio('/sound/click.mp3')

    // آماده‌سازی صدا برای پخش سریع‌تر
    clickSound.current.preload = 'auto'
  }, [])

  // این تابع هنگام کلیک روی صفحه اجرا می‌شود
  function handleClick(event) {
    // مشخص کردن عنصری که کاربر روی آن کلیک کرده است
    const target = event.target

    // بررسی اینکه عنصر کلیک‌شده تعاملی باشد
    // مانند دکمه، لینک یا ورودی انتخابی
    const clickable = target.closest(
      'button, a, [role="button"], input[type="checkbox"], input[type="radio"]'
    )

    // اگر عنصر تعاملی نبود یا غیرفعال بود، ادامه نده
    if (!clickable || clickable.disabled) return

    // بررسی وجود فایل صدای کلیک
    if (clickSound.current) {
      // بازگرداندن صدای کلیک به ابتدای فایل
      clickSound.current.currentTime = 0

      // پخش صدای کلیک
      // در صورت بروز خطا، از نمایش خطا جلوگیری می‌شود
      clickSound.current.play().catch(() => {})
    }
  }

  // نمایش صفحات برنامه بر اساس آدرس مرورگر
  return (
    <div onClick={handleClick}>
      <Routes>
        {/* مسیر ورود مدیر */}
        <Route 
        path="/login"
        element={<LoginPage />}
        />



        {/* مسیر صفحه اصلی سایت */}
        <Route
          path="/"
          element={
            <HomePage
              // با کلیک روی ورود به منو، کاربر به صفحه منو منتقل می‌شود
              onEnterMenu={() => navigate('/menu')}
            />
          }
        />

        {/* مسیر نمایش منوی رستوران */}
        <Route
          path="/menu"
          element={<MenuPage />}
        />

        {/* مسیر ورود به پنل مدیریت */}
        <Route
          path="/admin"
          element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
          }
        />

        {/* اگر آدرس واردشده معتبر نبود، کاربر به صفحه اصلی منتقل می‌شود */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </div>
  )
}

// در دسترس قرار دادن کامپوننت اصلی برای اجرای برنامه
export default App
