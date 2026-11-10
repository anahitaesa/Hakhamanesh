// وارد کردن فایل استایل پنل مدیریت
import './AdminPage.css'

// دریافت آدرس بک‌اند
import API_URL from './api'

// ابزارهای موردنیاز React
import { useState, useEffect } from 'react'

// ابزار انتقال بین صفحات
import { useNavigate } from 'react-router-dom'


function AdminPage() {
  const [showPasswords, setShowPasswords] = useState({
    current_password: false,
    new_password: false,
    confirm_password: false
  })

  const navigate = useNavigate()



  // -----------------------------
  // وضعیت‌های محصولات
  // -----------------------------

  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')

  // -----------------------------
  // وضعیت‌های دسته‌بندی‌ها
  // -----------------------------

  const [categories, setCategories] = useState([])

  const [draggedCategoryId, setDraggedCategoryId] = useState(null)
  const [isSavingCategoryOrder, setIsSavingCategoryOrder] = useState(false)
  const [dropTargetCategoryId, setDropTargetCategoryId] = useState(null)

  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState(null)

  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '',
    sort_order: 0,
  })

  // -----------------------------
  // وضعیت‌های عمومی پنل
  // -----------------------------

  const [activeSection, setActiveSection] = useState('dashboard')

    // -----------------------------
    // وضعیت حساب کاربری مدیر
    // -----------------------------

    const [adminProfile, setAdminProfile] = useState(null)

    const [isLoadingProfile, setIsLoadingProfile] = useState(false)

    const [isChangingPassword, setIsChangingPassword] = useState(false)

    const [passwordMessage, setPasswordMessage] = useState({
      type: '',
      text: '',
    })

    const [passwordForm, setPasswordForm] = useState({
      current_password: '',
      new_password: '',
      confirm_password: '',
    })

  // -----------------------------
  // وضعیت تنظیمات رستوران
  // -----------------------------

  const [restaurantSetting, setRestaurantSettings] = useState({
    restaurant_name: '',
    logo: '',
    description: '',
    phone: '',
    address: '',
    opening_hours: '',
    instagram: '',
    telegram: '',
    website: '', 
    google_maps_url: '',
    neshan_url: '',
    balad_url: '',
  })

  const [isLoadingSetting, setIsLoadingSettings] = useState(false)

  const [isSavingSettings, setIsSavingSettings] = useState(false)


  // فایل جدید لوگو که مدیر انتخاب می‌کند
  const [selectedLogoFile, setSelectedLogoFile] = useState(null)

  // پیش‌نمایش لوگوی انتخاب‌شده
  const [logoPreview, setLogoPreview] = useState('')


  // آزادسازی آدرس موقت تصویر لوگو
  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview)
      }
    }
  }, [logoPreview])



  // -----------------------------
  // دریافت تنظیمات رستوران
  // -----------------------------

  async function fetchSettings() {

    setIsLoadingSettings(true)

    try {

      const response = await fetch(`${API_URL}/settings/`)

      if (!response.ok) {
        throw new Error('دریافت تنظیمات رستوران ناموفق بود')
      }

      const data = await response.json()

      setRestaurantSettings({
        restaurant_name: data.restaurant_name || '',
        logo: data.logo || '',
        description: data.description || '',
        phone: data.phone || '',
        address: data.address || '',
        opening_hours: data.opening_hours || '',
        instagram: data.instagram || '',
        telegram: data.telegram || '',
        website: data.website || '',
        google_maps_url: data.google_maps_url || '',
        neshan_url: data.neshan_url || '',
        balad_url: data.balad_url || '',
      })

    } catch (error) {

      console.error('خطا در دریافت تنظیمات:', error)

      alert(error.message)

    } finally {

      setIsLoadingSettings(false)

    }
  }


  // ساخت آدرس قابل نمایش برای لوگوی ذخیره‌شده
  function getLogoUrl(logo) {
    if (!logo) return ''

    if (logo.startsWith('http://') || logo.startsWith('https://')) {
      return logo
    }

    return new URL(logo, API_URL).href
  }


  // ساخت آدرس قابل نمایش برای تصویر محصول
  function getProductImageUrl(image) {
    if (!image) return ''

    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }

    return new URL(image, API_URL).href
  }


  // انتخاب و بررسی تصویر محصول
  function handleProductImageChange(event) {
    const file = event.target.files?.[0]

    // امکان انتخاب دوباره همان فایل
    event.target.value = ''

    if (!file) return

    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
    ]

    const allowedExtensions = [
      '.png',
      '.jpg',
      '.jpeg',
      '.webp',
    ]

    const extension = file.name
      .slice(file.name.lastIndexOf('.'))
      .toLowerCase()

    if (
      !allowedTypes.includes(file.type) ||
      !allowedExtensions.includes(extension)
    ) {
      alert('فقط تصاویر PNG، JPG، JPEG و WEBP قابل قبول هستند.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('حجم تصویر نباید بیشتر از ۵ مگابایت باشد.')
      return
    }

    setSelectedProductImageFile(file)
    setProductImagePreview(URL.createObjectURL(file))
  }


  // انتخاب و بررسی فایل لوگو
  function handleLogoChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    const allowedTypes = ['image/png', 'image/svg+xml']
    const allowedExtensions = ['.png', '.svg']

    const extension = file.name
      .slice(file.name.lastIndexOf('.'))
      .toLowerCase()

    if (
      !allowedTypes.includes(file.type) ||
      !allowedExtensions.includes(extension)
    ) {
      alert('فقط فایل PNG یا SVG قابل قبول است.')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('حجم لوگو نباید بیشتر از ۵ مگابایت باشد.')
      event.target.value = ''
      return
    }

    setSelectedLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }


  async function handleSaveSettings(event) {
    event.preventDefault()

    if (!restaurantSetting.restaurant_name.trim()) {
      alert('لطفاً نام رستوران را وارد کن.')
      return
    }

    setIsSavingSettings(true)

    try {
      const token = getAdminToken()

      // ابتدا مسیر لوگوی فعلی را نگه می‌داریم
      let logoPath = restaurantSetting.logo

      // اگر لوگوی جدید انتخاب شده باشد، ابتدا آپلود می‌شود
      if (selectedLogoFile) {
        const formData = new FormData()

        formData.append('file', selectedLogoFile)

        const uploadResponse = await fetch(
          `${API_URL.replace(/\/+$/, '')}/settings/logo`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          }
        )

        if (!uploadResponse.ok) {
          throw new Error(await getErrorMessage(uploadResponse))
        }

        const uploadResult = await uploadResponse.json()

        if (!uploadResult.logo) {
          throw new Error('مسیر لوگوی آپلودشده دریافت نشد.')
        }

        logoPath = uploadResult.logo
      }

      // ذخیره سایر تنظیمات همراه با مسیر لوگو
      const settingsData = {
        ...restaurantSetting,
        logo: logoPath,
      }

      const response = await fetch(`${API_URL}/settings/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settingsData),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      const result = await response.json()

      if (result.settings) {
        setRestaurantSettings({
          restaurant_name: result.settings.restaurant_name || '',
          logo: result.settings.logo || '',
          description: result.settings.description || '',
          phone: result.settings.phone || '',
          address: result.settings.address || '',
          opening_hours: result.settings.opening_hours || '',
          instagram: result.settings.instagram || '',
          telegram: result.settings.telegram || '',
          website: result.settings.website || '',
          google_maps_url: result.settings.google_maps_url || '',
          neshan_url: result.settings.neshan_url || '',
          balad_url: result.settings.balad_url || '',
        })
      }

      // پاک کردن فایل انتخاب‌شده و پیش‌نمایش
      setSelectedLogoFile(null)
      setLogoPreview('')

      alert(result.message || 'تنظیمات رستوران با موفقیت ذخیره شد.')

    } catch (error) {
      console.error('خطا در ذخیره تنظیمات:', error)
      alert(error.message)

    } finally {
      setIsSavingSettings(false)
    }
  }


  // -----------------------------
  // دریافت تنظیمات هنگام ورود به بخش تنظیمات
  // -----------------------------


  useEffect(() => {

    if (activeSection === 'settings') {
      fetchSettings()
    }

  }, [activeSection])



  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProductId, setEditingProductId] = useState(null)

  // اطلاعات محصول
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    description: '',
    ingredients: '',
    rating: '0',
    price: '',
    mini_price: '',
    medium_price: '',
    large_price: '',
    image: '',
  })

  // فایل تصویر جدید انتخاب‌شده
  const [selectedProductImageFile, setSelectedProductImageFile] = useState(null)

  // آدرس موقت پیش‌نمایش تصویر
  const [productImagePreview, setProductImagePreview] = useState('')

  // وضعیت آپلود تصویر
  const [isUploadingProductImage, setIsUploadingProductImage] = useState(false)

  // آزادسازی آدرس موقت تصویر محصول
  useEffect(() => {
    return () => {
      if (productImagePreview) {
        URL.revokeObjectURL(productImagePreview)
      }
    }
  }, [productImagePreview])

  // -----------------------------
  // ابزارهای مربوط به قیمت
  // -----------------------------

  // تبدیل ارقام فارسی و عربی به انگلیسی و حذف جداکننده‌ها
  function normalizePriceDigits(value) {
    return String(value ?? '')
      .replace(/[۰-۹]/g, digit =>
        String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))
      )
      .replace(/[٠-٩]/g, digit =>
        String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit))
      )
  }

  // نمایش قیمت با جداکننده سه‌رقمی
  function formatPrice(value) {
    const digits = normalizePriceDigits(value).replace(/\D/g, '')
    return digits ? Number(digits).toLocaleString('en-US') : ''
  }

  // تبدیل قیمت قالب‌بندی‌شده به عدد خالص برای API
  function parsePrice(value) {
    const digits = normalizePriceDigits(value).replace(/\D/g, '')
    return digits === '' ? null : Number(digits)
  }

  // -----------------------------
  // دریافت محصولات
  // -----------------------------

  useEffect(() => {

    fetch(`${API_URL}/products/`)
      .then(response => {

        if (!response.ok) {
          throw new Error('دریافت محصولات ناموفق بود')
        }

        return response.json()
      })
      .then(data => {
        setProducts(data)
      })
      .catch(error => {
        console.error('خطا در دریافت محصولات:', error)
      })

  }, [])

  // -----------------------------
  // دریافت دسته‌بندی‌ها
  // -----------------------------

  async function fetchCategories() {

    try {

      const response = await fetch(`${API_URL}/categories/`)

      if (!response.ok) {
        throw new Error('دریافت دسته‌بندی‌ها ناموفق بود')
      }

      const data = await response.json()

      // مرتب‌سازی دسته‌بندی‌ها بر اساس ترتیب ذخیره‌شده
      const sortedCategories = [...data].sort(
        (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
      )

      setCategories(sortedCategories)

    } catch (error) {

      console.error('خطا در دریافت دسته‌بندی‌ها:', error)

    }
  }

  // -----------------------------
  // جابه‌جایی دسته‌بندی‌ها هنگام کشیدن
  // -----------------------------

  function handleCategoryDragOver(targetCategoryId) {

    if (
      draggedCategoryId === null ||
      draggedCategoryId === targetCategoryId ||
      dropTargetCategoryId === targetCategoryId ||
      isSavingCategoryOrder
    ) {
      return
    }

    setDropTargetCategoryId(targetCategoryId)

    setCategories(previousCategories => {

      const draggedIndex = previousCategories.findIndex(
        category => category.id === draggedCategoryId
      )

      const targetIndex = previousCategories.findIndex(
        category => category.id === targetCategoryId
      )

      if (draggedIndex === -1 || targetIndex === -1) {
        return previousCategories
      }

      const reorderedCategories = [...previousCategories]

      const [draggedCategory] = reorderedCategories.splice(
        draggedIndex,
        1
      )

      const newTargetIndex = reorderedCategories.findIndex(
        category => category.id === targetCategoryId
      )

      // هنگام حرکت به پایین، آیتم بعد از مقصد قرار می‌گیرد.
      // هنگام حرکت به بالا، آیتم قبل از مقصد قرار می‌گیرد.
      const insertIndex =
        draggedIndex < targetIndex
          ? newTargetIndex + 1
          : newTargetIndex

      reorderedCategories.splice(
        insertIndex,
        0,
        draggedCategory
      )

      return reorderedCategories
    })
  }

  // -----------------------------
  // ذخیره ترتیب جدید دسته‌بندی‌ها
  // -----------------------------

  async function handleCategoryDrop() {

    if (isSavingCategoryOrder || draggedCategoryId === null) {
      return
    }

    setDraggedCategoryId(null)
    setDropTargetCategoryId(null)

    setIsSavingCategoryOrder(true)

    try {

      const token = getAdminToken()

      for (let index = 0; index < categories.length; index++) {

        const category = categories[index]

        const response = await fetch(
          `${API_URL}/categories/${category.id}`,
          {
            method: 'PUT',

            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },

            body: JSON.stringify({
              name: category.name,
              icon: category.icon || null,
              sort_order: index + 1,
            }),
          }
        )

        if (!response.ok) {
          throw new Error(await getErrorMessage(response))
        }
      }

      await fetchCategories()

      alert('ترتیب دسته‌بندی‌ها با موفقیت ذخیره شد.')

    } catch (error) {

      console.error('خطا در ذخیره ترتیب دسته‌بندی‌ها:', error)

      await fetchCategories()

      alert(`ذخیره ترتیب انجام نشد: ${error.message}`)

    } finally {

      setIsSavingCategoryOrder(false)

    }
  }

  // دریافت دسته‌بندی‌ها در زمان ورود به پنل
  useEffect(() => {
    fetchCategories()
  }, [])

  // -----------------------------
  // مدیریت پنجره‌های پاپ‌آپ
  // -----------------------------

  useEffect(() => {

    if (!showAddForm && !showCategoryForm) return

    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    function handleModalKeyDown(event) {

      if (event.key === 'Escape') {

        if (showAddForm) resetProductForm()

        if (showCategoryForm) resetCategoryForm()

      }
    }

    window.addEventListener('keydown', handleModalKeyDown)

    return () => {

      document.body.style.overflow = previousOverflow

      window.removeEventListener('keydown', handleModalKeyDown)

    }

  }, [showAddForm, showCategoryForm])


  useEffect(() => {
    if (activeSection === 'account') {
      fetchAdminProfile()
    }
  }, [activeSection])


  // -----------------------------
  // ابزارهای مشترک درخواست‌ها
  // -----------------------------

  function getAdminToken() {

    const token = sessionStorage.getItem('admin_token')

    if (!token) {
      throw new Error('نشست مدیر معتبر نیست. لطفاً دوباره وارد حساب مدیریت شو.')
    }

    return token
  }

  async function getErrorMessage(response) {

    const responseText = await response.text()

    if (!responseText) {
      return `خطای سرور: ${response.status}`
    }

    try {

      const errorData = JSON.parse(responseText)

      return errorData.detail || errorData.message || responseText

    } catch {

      return responseText

    }
  }


  // دریافت اطلاعات حساب مدیر
  async function fetchAdminProfile() {
    setIsLoadingProfile(true)

    try {
      const token = getAdminToken()

      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      const data = await response.json()
      setAdminProfile(data)

    } catch (error) {
      setPasswordMessage({
        type: 'error',
        text: error.message,
      })
    } finally {
      setIsLoadingProfile(false)
    }
  }


  // تغییر رمز عبور مدیر
  async function handleChangePassword(event) {
    event.preventDefault()

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMessage({
        type: 'error',
        text: 'رمز عبور جدید و تکرار آن یکسان نیستند.',
      })
      return
    }

    setIsChangingPassword(true)

    setPasswordMessage({
      type: '',
      text: '',
    })

    try {
      const token = getAdminToken()

      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordForm),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      setPasswordMessage({
        type: 'success',
        text: 'رمز عبور با موفقیت تغییر کرد.',
      })

      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })

    } catch (error) {
      setPasswordMessage({
        type: 'error',
        text: error.message,
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  // -----------------------------
  // پاک کردن فرم محصول
  // -----------------------------

  function resetProductForm() {

    setNewProduct({
      name: '',
      category: '',
      description: '',
      ingredients: '',
      rating: '0',
      price: '',
      mini_price: '',
      medium_price: '',
      large_price: '',
      image: '',
    })

    setSelectedProductImageFile(null)
    setProductImagePreview('')
    setIsUploadingProductImage(false)

    setShowAddForm(false)

    setEditingProductId(null)
  }

  // -----------------------------
  // پاک کردن فرم دسته‌بندی
  // -----------------------------

  function resetCategoryForm() {

    setNewCategory({
      name: '',
      icon: '',
      sort_order: 0,
    })

    setShowCategoryForm(false)

    setEditingCategoryId(null)
  }

  // -----------------------------
  // شروع ویرایش محصول
  // -----------------------------

  function handleEditProduct(productId) {

    const product = products.find(p => p.id === productId)

    if (!product) return

    setEditingProductId(productId)

    setNewProduct({
      name: product.name || '',
      category: product.category || '',
      description: product.description || '',

      ingredients: Array.isArray(product.ingredients)
        ? product.ingredients.join('\n')
        : (product.ingredients || ''),

      rating: String(product.rating ?? 0),

      price: formatPrice(product.price),
      mini_price: formatPrice(product.mini_price),
      medium_price: formatPrice(product.medium_price),
      large_price: formatPrice(product.large_price),
      image: product.image || '',
    })

    setShowAddForm(true)
  }

  // -----------------------------
  // حذف محصول
  // -----------------------------

  async function handleDeleteProduct(productId) {

    const confirmed = window.confirm(
      'آیا از حذف این محصول مطمئن هستید؟'
    )

    if (!confirmed) return

    try {

      const token = getAdminToken()

      const response = await fetch(
        `${API_URL}/products/${productId}`,
        {
          method: 'DELETE',

          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      setProducts(previousProducts =>
        previousProducts.filter(product => product.id !== productId)
      )

      alert('محصول با موفقیت حذف شد.')

    } catch (error) {

      console.error('خطا در حذف محصول:', error)

      alert(error.message)

    }
  }

  // -----------------------------
  // ثبت یا ویرایش محصول
  // -----------------------------

  async function handleAddProduct() {

    if (!newProduct.name.trim() || !newProduct.category) {
      alert('لطفاً نام محصول و دسته‌بندی را وارد کن')
      return
    }

    const productData = {

      name: newProduct.name.trim(),

      category: newProduct.category,

      description: newProduct.description.trim() || null,

      // امتیاز اولیه تعیین‌شده توسط مدیر
      rating: Number.isFinite(Number(newProduct.rating))
        ? Math.min(5, Math.max(0, Number(newProduct.rating)))
        : 0,

      ingredients: newProduct.ingredients
        .split(/[\n,،]+/)
        .map(item => item.trim())
        .filter(Boolean),

      price: parsePrice(newProduct.price),

      mini_price: parsePrice(newProduct.mini_price),

      medium_price: parsePrice(newProduct.medium_price),

      large_price: parsePrice(newProduct.large_price),

      // حفظ تصویر فعلی هنگام ویرایش
      image: newProduct.image || null,

    }

    if (
      productData.price === null &&
      productData.mini_price === null &&
      productData.medium_price === null &&
      productData.large_price === null
    ) {
      alert('لطفاً حداقل یک قیمت معتبر وارد کن.')
      return
    }

    try {

      const token = getAdminToken()

      // مرحله اول: ثبت اطلاعات اصلی محصول
      const response = await fetch(
        editingProductId
          ? `${API_URL}/products/${editingProductId}`
          : `${API_URL}/products/`,
        {
          method: editingProductId ? 'PUT' : 'POST',

          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },

          body: JSON.stringify(productData),
        }
      )

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      let savedProduct = await response.json()

      // ثبت محصول در فهرست پنل
      if (editingProductId) {

        setProducts(previousProducts =>
          previousProducts.map(product =>
            product.id === savedProduct.id
              ? savedProduct
              : product
          )
        )

      } else {

        setProducts(previousProducts => [
          ...previousProducts,
          savedProduct
        ])

      }

      // اگر محصول جدید است، شناسه آن را برای ادامه ویرایش نگه می‌داریم
      setEditingProductId(savedProduct.id)

      setNewProduct(previousProduct => ({
        ...previousProduct,
        image: savedProduct.image || '',
      }))

      // مرحله دوم: آپلود تصویر در صورت انتخاب فایل جدید
      if (selectedProductImageFile) {

        setIsUploadingProductImage(true)

        try {

          const formData = new FormData()

          formData.append('file', selectedProductImageFile)

          const uploadResponse = await fetch(
            `${API_URL}/products/${savedProduct.id}/image`,
            {
              method: 'POST',

              headers: {
                'Authorization': `Bearer ${token}`,
              },

              body: formData,
            }
          )

          if (!uploadResponse.ok) {
            throw new Error(await getErrorMessage(uploadResponse))
          }

          const uploadResult = await uploadResponse.json()

          if (!uploadResult.product) {
            throw new Error('اطلاعات محصول پس از آپلود تصویر دریافت نشد.')
          }

          savedProduct = uploadResult.product

        } catch (uploadError) {

          console.error('خطا در آپلود تصویر محصول:', uploadError)

          alert(
            `اطلاعات محصول ذخیره شد، اما تصویر آپلود نشد: ${uploadError.message}\n` +
            'تصویر را دوباره انتخاب کن و ذخیره تغییرات را بزن.'
          )

          return

        } finally {

          setIsUploadingProductImage(false)

        }
      }

      // به‌روزرسانی محصول همراه تصویر نهایی
      setProducts(previousProducts =>
        previousProducts.map(product =>
          product.id === savedProduct.id
            ? savedProduct
            : product
        )
      )

      resetProductForm()

      alert('محصول با موفقیت ذخیره شد.')

    } catch (error) {

      console.error('خطا در ثبت محصول:', error)

      alert(error.message)

    }
  }

  // -----------------------------
  // شروع ویرایش دسته‌بندی
  // -----------------------------

  function handleEditCategory(category) {

    setEditingCategoryId(category.id)

    setNewCategory({
      name: category.name || '',
      icon: category.icon || '',
      sort_order: category.sort_order ?? 0,
    })

    setShowCategoryForm(true)
  }

  // -----------------------------
  // ثبت یا ویرایش دسته‌بندی
  // -----------------------------

  async function handleSaveCategory() {

    if (!newCategory.name.trim()) {

      alert('لطفاً نام دسته‌بندی را وارد کن.')

      return
    }

    const categoryData = {

      name: newCategory.name.trim(),

      icon: newCategory.icon.trim() || null,

      sort_order: Number(newCategory.sort_order) || 0,

    }

    try {

      const token = getAdminToken()

      const oldCategory = editingCategoryId
        ? categories.find(category => category.id === editingCategoryId)
        : null

      const response = await fetch(
        editingCategoryId
          ? `${API_URL}/categories/${editingCategoryId}`
          : `${API_URL}/categories/`,
        {
          method: editingCategoryId ? 'PUT' : 'POST',

          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },

          body: JSON.stringify(categoryData),
        }
      )

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      const savedCategory = await response.json()

      if (editingCategoryId) {

        setCategories(previousCategories =>
          previousCategories
            .map(category =>
              category.id === editingCategoryId
                ? savedCategory
                : category
            )
            .sort((a, b) =>
              (a.sort_order || 0) - (b.sort_order || 0)
            )
        )

        // اگر نام دسته‌بندی تغییر کرده باشد،
        // محصولات نمایش‌داده‌شده نیز به‌روزرسانی می‌شوند.
        if (
          oldCategory &&
          oldCategory.name !== savedCategory.name
        ) {

          setProducts(previousProducts =>
            previousProducts.map(product =>
              product.category === oldCategory.name
                ? {
                    ...product,
                    category: savedCategory.name,
                  }
                : product
            )
          )

          if (categoryFilter === oldCategory.name) {
            setCategoryFilter(savedCategory.name)
          }
        }

        alert('دسته‌بندی با موفقیت ویرایش شد.')

      } else {

        setCategories(previousCategories =>
          [...previousCategories, savedCategory]
            .sort((a, b) =>
              (a.sort_order || 0) - (b.sort_order || 0)
            )
        )

        alert('دسته‌بندی جدید با موفقیت اضافه شد.')

      }

      resetCategoryForm()

    } catch (error) {

      console.error('خطا در ذخیره دسته‌بندی:', error)

      alert(error.message)

    }
  }

  // -----------------------------
  // حذف دسته‌بندی
  // -----------------------------

  async function handleDeleteCategory(categoryId) {

    const category = categories.find(
      item => item.id === categoryId
    )

    if (!category) return

    const confirmed = window.confirm(
      `آیا از حذف دسته‌بندی «${category.name}» مطمئن هستی؟`
    )

    if (!confirmed) return

    try {

      const token = getAdminToken()

      const response = await fetch(
        `${API_URL}/categories/${categoryId}`,
        {
          method: 'DELETE',

          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      setCategories(previousCategories =>
        previousCategories.filter(
          item => item.id !== categoryId
        )
      )

      if (categoryFilter === category.name) {
        setCategoryFilter('all')
      }

      alert('دسته‌بندی با موفقیت حذف شد.')

    } catch (error) {

      console.error('خطا در حذف دسته‌بندی:', error)

      alert(error.message)

    }
  }

  // -----------------------------
  // خروج مدیر
  // -----------------------------

  function handleLogout() {

    sessionStorage.removeItem('admin_token')

    navigate('/login')

  }

  // -----------------------------
  // آمار دسته‌بندی‌ها
  // -----------------------------

  const categoriesCount = categories.length

  // محاسبه تعداد محصولات در هر دسته‌بندی
  const productCountsByCategory = categories.map(category => ({
    name: category.name,
    count: products.filter(
      product => product.category === category.name
    ).length,
  }))

  // -----------------------------
  // فیلتر و مرتب‌سازی محصولات
  // -----------------------------

  const filteredProducts = products

    .filter(product =>
      (product.name || '')
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase())
    )

    .filter(product =>
      categoryFilter === 'all' ||
      product.category === categoryFilter
    )

    .sort((a, b) => {

      switch (sortOrder) {

        case 'newest':
          return Number(b.id) - Number(a.id)

        case 'oldest':
          return Number(a.id) - Number(b.id)

        case 'name-asc':
          return (a.name || '').localeCompare(
            b.name || '',
            'fa'
          )

        case 'name-desc':
          return (b.name || '').localeCompare(
            a.name || '',
            'fa'
          )

        default:
          return 0

      }

    })

  // -----------------------------
  // نمایش صفحه
  // -----------------------------

  return (

    <div className="admin-page">

      {/* منوی کناری */}

      <aside className="admin-sidebar">

        <div className="admin-logo">
          <h2>هخامنش</h2>
          <span>پنل مدیریت</span>
        </div>

        <nav className="admin-nav">

          <button
            className={`admin-nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveSection('dashboard')}
            type="button"
          >
            <span>▦</span>
            داشبورد
          </button>

          <button
            className={`admin-nav-item ${activeSection === 'products' ? 'active' : ''}`}
            onClick={() => setActiveSection('products')}
            type="button"
          >
            <span>🍕</span>
            مدیریت محصولات
          </button>

          <button
            className={`admin-nav-item ${activeSection === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveSection('categories')}
            type="button"
          >
            <span>📁</span>
            دسته‌بندی‌ها
          </button>

          <button
            className={`admin-nav-item ${activeSection === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveSection('settings')}
            type="button"
          >
            <span>⚙️</span>
            تنظیمات
          </button>


          <button
            className={`admin-nav-item ${activeSection === 'account' ? 'active' : ''}`}
            onClick={() => setActiveSection('account')}
            type="button"
          >
            <span>👤</span>
            حساب کاربری
          </button>

        </nav>

        <a href="/" className="admin-back-link">
          بازگشت به سایت
        </a>

      </aside>

      {/* محتوای اصلی */}

      <main className="admin-main">

        {/* سربرگ */}

        <header className="admin-topbar">

          <div>

            <h1>
              {activeSection === 'dashboard'
                ? 'داشبورد'
                : activeSection === 'products'
                  ? 'مدیریت محصولات'
                  : activeSection === 'categories'
                    ? 'مدیریت دسته‌بندی‌ها'
                    : activeSection === 'settings'
                      ? 'تنظیمات'
                      : 'حساب کاربری'}
            </h1>

            <p>
              {activeSection === 'dashboard'
                ? 'به پنل مدیریت رستوران هخامنش خوش آمدی.'
                : activeSection === 'products'
                  ? 'در این بخش می‌توانی محصولات منو را مدیریت کنی.'
                  : activeSection === 'categories'
                    ? 'دسته‌بندی‌های منوی رستوران را مدیریت کن.'
                    : activeSection === 'settings'
                      ? 'تنظیمات پنل مدیریت.'
                      : 'اطلاعات حساب کاربری و تغییر رمز عبور.'}
            </p>

          </div>

          <div className="admin-user">

            <span>مدیر سیستم</span>

            <div className="admin-avatar">م</div>

            <button
              className="admin-logout-button"
              onClick={handleLogout}
              type="button"
            >
              خروج
            </button>

          </div>

        </header>

        {/* -----------------------------
            داشبورد
        ----------------------------- */}

        {activeSection === 'dashboard' && (

          <>

            <section className="admin-stats">

              <div className="admin-stat-card">

                <span>🍔</span>

                <p>تعداد محصولات</p>

                <h2>
                  {products.length.toLocaleString('fa-IR')}
                </h2>

              </div>

              <div className="admin-stat-card">

                <span>📁</span>

                <p>دسته‌بندی‌ها</p>

                <h2>
                  {categoriesCount.toLocaleString('fa-IR')}
                </h2>

              </div>

              <div className="admin-stat-card">

                <span>🟢</span>

                <p>محصولات فعال</p>

                <h2>
                  {products
                    .filter(product => product.is_active)
                    .length.toLocaleString('fa-IR')}
                </h2>

              </div>

            </section>


            {/* نمودار تعداد محصولات در دسته‌بندی‌ها */}
            <section className="admin-chart-card">

              <div className="admin-chart-header">
                <div>
                  <h2>تعداد محصولات در هر دسته‌بندی</h2>
                  <p>توزیع محصولات منوی رستوران</p>
                </div>
              </div>

              <div className="admin-category-chart">

                {productCountsByCategory.length > 0 ? (

                  productCountsByCategory.map(category => {

                    const maxCount = Math.max(
                      ...productCountsByCategory.map(item => item.count),
                      1
                    )

                    const barWidth = (category.count / maxCount) * 100

                    return (
                      <div className="admin-chart-item" key={category.name}>

                        <div className="admin-chart-item-info">
                          <span>{category.name}</span>
                          <strong>
                            {category.count.toLocaleString('fa-IR')}
                          </strong>
                        </div>

                        <div className="admin-chart-track">
                          <div
                            className="admin-chart-fill"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>

                      </div>
                    )
                  })

                ) : (

                  <p>هنوز دسته‌بندی‌ای برای نمایش وجود ندارد.</p>

                )}

              </div>

            </section>

            <section className="admin-section">

              <div className="admin-section-heading">

                <div>

                  <h2>مدیریت منوی رستوران</h2>

                  <p>
                    محصولات و دسته‌بندی‌های منو را از این قسمت مدیریت کن.
                  </p>

                </div>

                <button
                  className="admin-add-button"
                  onClick={() => setActiveSection('products')}
                  type="button"
                >
                  + افزودن محصول
                </button>

              </div>

              <div className="admin-empty-state">

                <span>🍽️</span>

                <h3>مدیریت محصولات</h3>

                <p>
                  برای مشاهده و مدیریت محصولات، وارد بخش مدیریت محصولات شو.
                </p>

              </div>

            </section>

          </>

        )}

        {/* -----------------------------
            مدیریت محصولات
        ----------------------------- */}

        {activeSection === 'products' && (

          <section className="admin-section">

            {/* فرم محصول */}

            {showAddForm && (

              <div
                className="admin-modal-overlay"
                onMouseDown={event => {
                  if (event.target === event.currentTarget) {
                    resetProductForm()
                  }
                }}
              >

                <div
                  className="admin-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="product-modal-title"
                  onMouseDown={event => event.stopPropagation()}
                >

                  <div className="admin-add-form">

                    <h2 id="product-modal-title">
                      {editingProductId
                        ? 'ویرایش محصول'
                        : 'افزودن محصول جدید'}
                    </h2>

                    <button
                      type="button"
                      className="admin-modal-close"
                      onClick={resetProductForm}
                      aria-label="بستن پنجره"
                    >
                      ×
                    </button>

                    <label>نام محصول</label>

                    <input
                      type="text"
                      placeholder="نام محصول را وارد کن"
                      value={newProduct.name}
                      onChange={event =>
                        setNewProduct({
                          ...newProduct,
                          name: event.target.value
                        })
                      }
                    />

                    <label>دسته‌بندی</label>

                    <select
                      value={newProduct.category}
                      onChange={event =>
                        setNewProduct({
                          ...newProduct,
                          category: event.target.value
                        })
                      }
                    >

                      <option value="">
                        انتخاب دسته‌بندی
                      </option>

                      {categories.map(category => (

                        <option
                          key={category.id}
                          value={category.name}
                        >
                          {category.name}
                        </option>

                      ))}

                    </select>

                    <label>ترکیبات و مواد اولیه</label>


                    {/* انتخاب تصویر محصول */}
                    <div className="admin-product-image-upload">

                      <label>تصویر محصول</label>

                      <label
                        htmlFor="product-image-input"
                        className="admin-product-image-upload-box"
                      >

                        {productImagePreview || newProduct.image ? (

                          <img
                            src={
                              productImagePreview ||
                              getProductImageUrl(newProduct.image)
                            }
                            alt="پیش‌نمایش تصویر محصول"
                            className="admin-product-image-preview"
                          />

                        ) : (

                          <span className="admin-product-image-placeholder">
                            📷
                          </span>

                        )}

                        <span>
                          {selectedProductImageFile
                            ? 'تغییر تصویر انتخاب‌شده'
                            : 'انتخاب تصویر محصول'}
                        </span>

                        <small>
                          فرمت PNG، JPG یا WEBP ـ حداکثر ۵ مگابایت
                        </small>

                      </label>

                      <input
                        id="product-image-input"
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                        onChange={handleProductImageChange}
                        hidden
                      />

                      {selectedProductImageFile && (

                        <button
                          type="button"
                          className="admin-logo-remove"
                          onClick={() => {
                            setSelectedProductImageFile(null)
                            setProductImagePreview('')
                          }}
                        >
                          لغو انتخاب تصویر جدید
                        </button>

                      )}

                    </div>

                    <textarea
                      placeholder={'هر ماده را در یک خط وارد کن\nمثلاً:\nقارچ\nپنیر\nگوشت'}
                      value={newProduct.ingredients}
                      onChange={event =>
                        setNewProduct({
                          ...newProduct,
                          ingredients: event.target.value
                        })
                      }
                    />

                    <label>توضیحات محصول (اختیاری)</label>

                    <textarea
                      placeholder="توضیحات محصول را وارد کن"
                      value={newProduct.description}
                      onChange={event =>
                        setNewProduct({
                          ...newProduct,
                          description: event.target.value
                        })
                      }
                    />

                    <label>امتیاز اولیه محصول (از ۰ تا ۵)</label>

                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      placeholder="مثلاً ۴.۵"
                      value={newProduct.rating}
                      onChange={event =>
                        setNewProduct({
                          ...newProduct,
                          rating: event.target.value
                        })
                      }
                    />

                    <small className="admin-rating-help">
                      این امتیاز توسط مدیر تعیین می‌شود و امتیاز کاربران نیست.
                    </small>

                    <label>قیمت (بدون سایز)</label>

                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="قیمت محصول"
                      value={newProduct.price}
                      onChange={event =>
                        setNewProduct({
                          ...newProduct,
                          price: formatPrice(event.target.value)
                        })
                      }
                    />

                    <h3>قیمت اندازه‌ها (در صورت داشتن اندازه)</h3>

                    <label>مینی</label>

                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="قیمت مینی"
                      value={newProduct.mini_price}
                      onChange={event =>
                        setNewProduct({
                          ...newProduct,
                          mini_price: formatPrice(event.target.value)
                        })
                      }
                    />

                    <label>متوسط</label>

                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="قیمت متوسط"
                      value={newProduct.medium_price}
                      onChange={event =>
                        setNewProduct({
                          ...newProduct,
                          medium_price: formatPrice(event.target.value)
                        })
                      }
                    />

                    <label>بزرگ</label>

                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="قیمت بزرگ"
                      value={newProduct.large_price}
                      onChange={event =>
                        setNewProduct({
                          ...newProduct,
                          large_price: formatPrice(event.target.value)
                        })
                      }
                    />

                    <div className="admin-form-actions">

                      <button
                        type="button"
                        className="admin-add-button"
                        onClick={handleAddProduct}
                        disabled={isUploadingProductImage}
                      >
                        {isUploadingProductImage
                          ? 'در حال آپلود تصویر...'
                          : editingProductId
                            ? 'ذخیره تغییرات'
                            : 'ثبت محصول'}
                      </button>

                      <button
                        type="button"
                        onClick={resetProductForm}
                      >
                        انصراف
                      </button>

                    </div>

                  </div>

                </div>

              </div>

            )}

            {/* جستجو و افزودن محصول */}

            <div className="admin-section-heading">

              <input
                type="text"
                placeholder="جستجوی نام محصول..."
                value={searchTerm}
                onChange={event =>
                  setSearchTerm(event.target.value)
                }
              />

              <div className="admin-product-actions">

                <span>
                  {filteredProducts.length.toLocaleString('fa-IR')} محصول
                </span>

                <button
                  className="admin-add-button"
                  onClick={() => {
                    setEditingProductId(null)

                    setNewProduct({
                      name: '',
                      category: '',
                      description: '',
                      ingredients: '',
                      rating: '0',
                      price: '',
                      mini_price: '',
                      medium_price: '',
                      large_price: '',
                      image: '',
                    })

                    setSelectedProductImageFile(null)
                    setProductImagePreview('')
                    
                    setShowAddForm(true)
                  }}
                  type="button"
                >
                  + افزودن محصول
                </button>

              </div>

            </div>

            {/* فیلتر و مرتب‌سازی */}

            <div className="admin-product-filters">

              <div>

                <label htmlFor="category-filter">
                  فیلتر دسته‌بندی:
                </label>

                <select
                  id="category-filter"
                  value={categoryFilter}
                  onChange={event =>
                    setCategoryFilter(event.target.value)
                  }
                >

                  <option value="all">
                    همه محصولات
                  </option>

                  {categories.map(category => (

                    <option
                      key={category.id}
                      value={category.name}
                    >
                      {category.name}
                    </option>

                  ))}

                </select>

              </div>

              <div>

                <label htmlFor="sort-products">
                  مرتب‌سازی:
                </label>

                <select
                  id="sort-products"
                  value={sortOrder}
                  onChange={event =>
                    setSortOrder(event.target.value)
                  }
                >

                  <option value="newest">جدیدترین</option>

                  <option value="oldest">قدیمی‌ترین</option>

                  <option value="name-asc">نام محصول: الف تا ی</option>

                  <option value="name-desc">نام محصول: ی تا الف</option>

                </select>

              </div>

            </div>

            {/* فهرست محصولات */}

            <div className="admin-product-list">

              {filteredProducts.length > 0 ? (

                filteredProducts.map(product => (

                  <div
                    className="admin-product-item"
                    key={product.id}
                  >

                    <div>

                      <h3>{product.name}</h3>

                      <p>{product.category}</p>

                    </div>

                    <div className="admin-product-prices">

                      {product.price != null ? (

                        <span>
                          {Number(product.price).toLocaleString('fa-IR')} تومان
                        </span>

                      ) : (

                        <>

                          {[
                            {
                              name: 'مینی',
                              price: product.mini_price
                            },
                            {
                              name: 'متوسط',
                              price: product.medium_price
                            },
                            {
                              name: 'بزرگ',
                              price: product.large_price
                            }
                          ]

                            .filter(size => size.price != null)

                            .map(size => (

                              <span key={size.name}>
                                {size.name}:
                                {' '}
                                {Number(size.price).toLocaleString('fa-IR')}
                                {' '}
                                تومان
                              </span>

                            ))}

                        </>

                      )}

                    </div>

                    <div className="admin-product-buttons">

                      <button
                        className="admin-edit-button"
                        onClick={() =>
                          handleEditProduct(product.id)
                        }
                        type="button"
                      >
                        ویرایش
                      </button>

                      <button
                        className="admin-delete-button"
                        onClick={() =>
                          handleDeleteProduct(product.id)
                        }
                        type="button"
                      >
                        حذف
                      </button>

                    </div>

                  </div>

                ))

              ) : (

                <div className="admin-empty-state">

                  <span>🔍</span>

                  <h3>محصولی پیدا نشد</h3>

                  <p>
                    محصولی با این نام یا در این دسته‌بندی وجود ندارد.
                  </p>

                </div>

              )}

            </div>

          </section>

        )}

        {/* -----------------------------
            مدیریت دسته‌بندی‌ها
        ----------------------------- */}

        {activeSection === 'categories' && (

          <section className="admin-section">

            {/* عنوان و دکمه افزودن */}

            <div className="admin-section-heading">

              <div>

                <h2>دسته‌بندی‌های منو</h2>

                <p>
                  تعداد دسته‌بندی‌ها:
                  {' '}
                  {categories.length.toLocaleString('fa-IR')}
                </p>

              </div>

              <button
                className="admin-add-button"
                type="button"
                onClick={() => {

                  setEditingCategoryId(null)

                  setNewCategory({
                    name: '',
                    icon: '',
                    sort_order: categories.length,
                  })

                  setShowCategoryForm(true)

                }}
              >
                + افزودن دسته‌بندی
              </button>

            </div>

            {/* فرم دسته‌بندی */}

            {showCategoryForm && (

              <div
                className="admin-modal-overlay"
                onMouseDown={event => {
                  if (event.target === event.currentTarget) {
                    resetCategoryForm()
                  }
                }}
              >

                <div
                  className="admin-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="category-modal-title"
                  onMouseDown={event => event.stopPropagation()}
                >

                  <div className="admin-add-form">

                    <h2 id="category-modal-title">
                      {editingCategoryId
                        ? 'ویرایش دسته‌بندی'
                        : 'افزودن دسته‌بندی جدید'}
                    </h2>

                    <button
                      type="button"
                      className="admin-modal-close"
                      onClick={resetCategoryForm}
                      aria-label="بستن پنجره"
                    >
                      ×
                    </button>

                    <label>نام دسته‌بندی</label>

                    <input
                      type="text"
                      placeholder="مثلاً پیتزا"
                      value={newCategory.name}
                      onChange={event =>
                        setNewCategory({
                          ...newCategory,
                          name: event.target.value
                        })
                      }
                    />

                    <label>آیکون دسته‌بندی (اختیاری)</label>

                    <input
                      type="text"
                      placeholder="مثلاً 🍕"
                      value={newCategory.icon}
                      onChange={event =>
                        setNewCategory({
                          ...newCategory,
                          icon: event.target.value
                        })
                      }
                    />

                    <div className="admin-form-actions">

                      <button
                        type="button"
                        className="admin-add-button"
                        onClick={handleSaveCategory}
                      >
                        {editingCategoryId
                          ? 'ذخیره تغییرات'
                          : 'ثبت دسته‌بندی'}
                      </button>

                      <button
                        type="button"
                        onClick={resetCategoryForm}
                      >
                        انصراف
                      </button>

                    </div>

                  </div>

                </div>

              </div>

            )}

            {/* فهرست دسته‌بندی‌ها */}

            <div className="category-drag-list">

              {categories.length > 0 ? (

                categories.map((category, index) => (

                  <div
                    className={`admin-product-item category-drag-item ${
                      draggedCategoryId === category.id ? 'dragging' : ''
                    } ${
                      dropTargetCategoryId === category.id ? 'drop-target' : ''
                    }`}

                    key={category.id}

                    draggable={!isSavingCategoryOrder}

                    onDragStart={event => {

                      if (isSavingCategoryOrder) {
                        event.preventDefault()
                        return
                      }

                      setDraggedCategoryId(category.id)

                      setDropTargetCategoryId(null)

                      event.dataTransfer.effectAllowed = 'move'

                      event.dataTransfer.setData(
                        'text/plain',
                        String(category.id)
                      )

                    }}

                    onDragOver={event => {

                      event.preventDefault()

                      event.dataTransfer.dropEffect = 'move'

                      handleCategoryDragOver(category.id)

                    }}

                    onDrop={event => {

                      event.preventDefault()

                      handleCategoryDrop()

                    }}

                    onDragEnd={() => {

                      setDraggedCategoryId(null)

                      setDropTargetCategoryId(null)

                    }}
                  >

                    <div className="category-drag-info">

                      <span className="category-order-number">
                        {(index + 1).toLocaleString('fa-IR')}
                      </span>

                      <span
                        className="category-drag-handle"
                        title="برای جابه‌جایی بکش"
                      >
                        ⠿
                      </span>

                      <span className="category-drag-icon">
                        {category.icon || '📁'}
                      </span>

                      <h3>{category.name}</h3>

                    </div>

                    <div className="admin-product-buttons">

                      <button
                        type="button"
                        className="admin-edit-button"
                        onClick={() => handleEditCategory(category)}
                        disabled={isSavingCategoryOrder}
                      >
                        ویرایش
                      </button>

                      <button
                        type="button"
                        className="admin-delete-button"
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={isSavingCategoryOrder}
                      >
                        حذف
                      </button>

                    </div>

                  </div>

                ))

              ) : (

                <p>هنوز دسته‌بندی‌ای ثبت نشده است.</p>

              )}

            </div>

            {isSavingCategoryOrder && (

              <p className="category-order-status">
                در حال ذخیره ترتیب جدید دسته‌بندی‌ها...
              </p>

            )}

          </section>

        )}

        {/* -----------------------------
            تنظیمات
        ----------------------------- */}


        {activeSection === 'settings' && (
          <section className="admin-section">
            <div className="admin-section-header">
              <h2>تنظیمات رستوران</h2>
              <p>اطلاعات عمومی، راه‌های ارتباطی و موقعیت مکانی رستوران رو مدیریت کن.</p>
            </div>

            {isLoadingSetting ? (
              <div className="admin-empty-state">
                <p>در حال دریافت تنظیمات رستوران...</p>
              </div>
            ) : (
              <form
                className="admin-settings-form"
                onSubmit={handleSaveSettings}
              >

                {/* اطلاعات اصلی رستوران */}
                <div className="admin-settings-group">
                  <h3>اطلاعات اصلی رستوران</h3>

                  <div className="admin-settings-grid">
                    <div className="admin-form-group">
                      <label>نام رستوران</label>
                      <input
                        type="text"
                        value={restaurantSetting.restaurant_name}
                        onChange={(e) =>
                          setRestaurantSettings({
                            ...restaurantSetting,
                            restaurant_name: e.target.value
                          })
                        }
                        placeholder="نام رستوران"
                        required
                      />
                    </div>

                    <div className="admin-form-group admin-logo-upload">
                      <label>لوگوی رستوران</label>

                      <label
                        htmlFor="restaurant-logo-input"
                        className="admin-logo-upload-box"
                      >
                        {logoPreview || restaurantSetting.logo ? (
                          <img
                            src={
                              logoPreview ||
                              getLogoUrl(restaurantSetting.logo)
                            }
                            alt="پیش‌نمایش لوگوی رستوران"
                            className="admin-logo-preview"
                          />
                        ) : (
                          <span className="admin-logo-placeholder">
                            📷
                          </span>
                        )}

                        <span>
                          {selectedLogoFile
                            ? 'تغییر تصویر انتخاب‌شده'
                            : 'انتخاب یا تغییر لوگو'}
                        </span>

                        <small>فرمت PNG یا SVG ـ حداکثر ۵ مگابایت</small>
                      </label>

                      <input
                        id="restaurant-logo-input"
                        type="file"
                        accept=".png,.svg,image/png,image/svg+xml"
                        onChange={handleLogoChange}
                        hidden
                      />

                      {selectedLogoFile && (
                        <button
                          type="button"
                          className="admin-logo-remove"
                          onClick={() => {
                            setSelectedLogoFile(null)
                            setLogoPreview('')
                          }}
                        >
                          لغو انتخاب لوگوی جدید
                        </button>
                      )}
                    </div>

                    <div className="admin-form-group admin-settings-full">
                      <label>توضیحات رستوران</label>
                      <textarea
                        value={restaurantSetting.description}
                        onChange={(e) =>
                          setRestaurantSettings({
                            ...restaurantSetting,
                            description: e.target.value
                          })
                        }
                        placeholder="توضیحات کوتاهی درباره رستوران"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                {/* اطلاعات تماس و آدرس */}
                <div className="admin-settings-group">
                  <h3>اطلاعات تماس و آدرس</h3>

                  <div className="admin-settings-grid">
                    <div className="admin-form-group">
                      <label>شماره تماس</label>
                      <input
                        type="text"
                        value={restaurantSetting.phone}
                        onChange={(e) =>
                          setRestaurantSettings({
                            ...restaurantSetting,
                            phone: e.target.value
                          })
                        }
                        placeholder="شماره تماس رستوران"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>ساعات کاری</label>

                      <textarea
                        value={restaurantSetting.opening_hours}
                        onChange={(e) =>
                          setRestaurantSettings({
                            ...restaurantSetting,
                            opening_hours: e.target.value
                          })
                        }
                        placeholder={'شیفت صبح: ۱۲ تا ۱۶:۳۰\nشیفت شب: ۱۹ تا ۰۰:۳۰'}
                        rows={3}
                      />
                    </div>

                    <div className="admin-form-group admin-settings-full">
                      <label>آدرس رستوران</label>
                      <textarea
                        value={restaurantSetting.address}
                        onChange={(e) =>
                          setRestaurantSettings({
                            ...restaurantSetting,
                            address: e.target.value
                          })
                        }
                        placeholder="آدرس کامل رستوران"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* شبکه‌های اجتماعی */}
                <div className="admin-settings-group">
                  <h3>شبکه‌های اجتماعی و وب‌سایت</h3>

                  <div className="admin-settings-grid">
                    <div className="admin-form-group">
                      <label>اینستاگرام</label>
                      <input
                        type="url"
                        value={restaurantSetting.instagram}
                        onChange={(e) =>
                          setRestaurantSettings({
                            ...restaurantSetting,
                            instagram: e.target.value
                          })
                        }
                        placeholder="https://instagram.com/..."
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>تلگرام</label>
                      <input
                        type="text"
                        value={restaurantSetting.telegram}
                        onChange={(e) =>
                          setRestaurantSettings({
                            ...restaurantSetting,
                            telegram: e.target.value
                          })
                        }
                        placeholder="لینک یا آیدی تلگرام"
                      />
                    </div>

                    <div className="admin-form-group admin-settings-full">
                      <label>وب‌سایت</label>
                      <input
                        type="url"
                        value={restaurantSetting.website}
                        onChange={(e) =>
                          setRestaurantSettings({
                            ...restaurantSetting,
                            website: e.target.value
                          })
                        }
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* لینک‌های موقعیت مکانی */}
                <div className="admin-settings-group">
                  <h3>موقعیت مکانی رستوران</h3>
                  <p className="admin-settings-description">
                    لینک موقعیت رستوران رو در هر سرویس به‌صورت جداگانه وارد کن.
                  </p>

                  <div className="admin-settings-grid">
                    <div className="admin-form-group admin-settings-full">
                      <label>لینک Google Maps</label>
                      <input
                        type="url"
                        value={restaurantSetting.google_maps_url}
                        onChange={(e) =>
                          setRestaurantSettings({
                            ...restaurantSetting,
                            google_maps_url: e.target.value
                          })
                        }
                        placeholder="لینک موقعیت در گوگل مپ"
                      />
                    </div>

                    <div className="admin-form-group admin-settings-full">
                      <label>لینک نشان</label>
                      <input
                        type="url"
                        value={restaurantSetting.neshan_url}
                        onChange={(e) =>
                          setRestaurantSettings({
                            ...restaurantSetting,
                            neshan_url: e.target.value
                          })
                        }
                        placeholder="لینک موقعیت در نشان"
                      />
                    </div>

                    <div className="admin-form-group admin-settings-full">
                      <label>لینک بلد</label>
                      <input
                        type="url"
                        value={restaurantSetting.balad_url}
                        onChange={(e) =>
                          setRestaurantSettings({
                            ...restaurantSetting,
                            balad_url: e.target.value
                          })
                        }
                        placeholder="لینک موقعیت در بلد"
                      />
                    </div>
                  </div>
                </div>

                {/* دکمه ذخیره */}
                <div className="admin-form-actions">
                  <button
                    type="submit"
                    className="admin-submit-btn"
                    disabled={isSavingSettings || isLoadingSetting}
                  >
                    {isSavingSettings ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
                  </button>
                </div>

              </form>
            )}
          </section>
        )}


        {/* -----------------------------
            حساب کاربری مدیر
        ----------------------------- */}

        {activeSection === 'account' && (

          <section className="admin-section">

            <div className="admin-section-header">
              <h2>حساب کاربری مدیر</h2>
              <p>اطلاعات حساب و تغییر رمز عبور</p>
            </div>

            <div className="admin-settings-group">

              <h3>اطلاعات حساب</h3>

              {isLoadingProfile ? (

                <p>در حال دریافت اطلاعات مدیر...</p>

              ) : adminProfile ? (

                <div className="admin-settings-grid">

                  <div className="admin-form-group">
                    <label>نام کاربری</label>
                    <input
                      type="text"
                      value={adminProfile.username || ''}
                      readOnly
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>شناسه مدیر</label>
                    <input
                      type="text"
                      value={adminProfile.id || ''}
                      readOnly
                    />
                  </div>

                </div>

              ) : (

                <p>اطلاعات حساب دریافت نشد.</p>

              )}

            </div>


            <form
              className="admin-settings-form"
              onSubmit={handleChangePassword}
            >

              <div className="admin-settings-group">

                <h3>تغییر رمز عبور</h3>

                <div className="admin-settings-grid">

                  <div className="admin-form-group">
                    <label>رمز عبور فعلی</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPasswords.current_password ? 'text' : 'password'}
                        value={passwordForm.current_password}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            current_password: e.target.value
                          })
                        }
                        required
                      />

                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            current_password: !showPasswords.current_password
                          })
                        }
                        aria-label={
                          showPasswords.current_password
                            ? 'مخفی کردن رمز عبور'
                            : 'نمایش رمز عبور'
                        }
                      >
                        {showPasswords.current_password ? (
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
                            <path d="M3 3l18 18" />
                            <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                            <path d="M9.88 5.09A10.7 10.7 0 0 1 12 4.9c5 0 9.27 4.1 10 7.1a10.8 10.8 0 0 1-4.1 5.5" />
                            <path d="M6.61 6.61A11.5 11.5 0 0 0 2 12c.73 3 5 7.1 10 7.1 1.4 0 2.7-.4 3.8-1" />
                          </svg>
                        ) : (
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

                  <div className="admin-form-group">
                    <label>رمز عبور جدید</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPasswords.new_password ? 'text' : 'password'}
                        value={passwordForm.new_password}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            new_password: e.target.value
                          })
                        }
                        required
                      />

                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            new_password: !showPasswords.new_password
                          })
                        }
                        aria-label={
                          showPasswords.new_password
                            ? 'مخفی کردن رمز عبور'
                            : 'نمایش رمز عبور'
                        }
                      >
                        {showPasswords.new_password ? (
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
                            <path d="M3 3l18 18" />
                            <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                            <path d="M9.88 5.09A10.7 10.7 0 0 1 12 4.9c5 0 9.27 4.1 10 7.1a10.8 10.8 0 0 1-4.1 5.5" />
                            <path d="M6.61 6.61A11.5 11.5 0 0 0 2 12c.73 3 5 7.1 10 7.1 1.4 0 2.7-.4 3.8-1" />
                          </svg>
                        ) : (
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

                  <div className="admin-form-group">
                    <label>تکرار رمز عبور جدید</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPasswords.confirm_password ? 'text' : 'password'}
                        value={passwordForm.confirm_password}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            confirm_password: e.target.value
                          })
                        }
                        required
                      />

                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            confirm_password: !showPasswords.confirm_password
                          })
                        }
                        aria-label={
                          showPasswords.confirm_password
                            ? 'مخفی کردن رمز عبور'
                            : 'نمایش رمز عبور'
                        }
                      >
                        {showPasswords.confirm_password ? (
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
                            <path d="M3 3l18 18" />
                            <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                            <path d="M9.88 5.09A10.7 10.7 0 0 1 12 4.9c5 0 9.27 4.1 10 7.1a10.8 10.8 0 0 1-4.1 5.5" />
                            <path d="M6.61 6.61A11.5 11.5 0 0 0 2 12c.73 3 5 7.1 10 7.1 1.4 0 2.7-.4 3.8-1" />
                          </svg>
                        ) : (
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

                </div>

                {passwordMessage.text && (
                  <p
                    style={{
                      color: passwordMessage.type === 'success'
                        ? '#4caf50'
                        : '#ff6464',
                      marginTop: '18px'
                    }}
                  >
                    {passwordMessage.text}
                  </p>
                )}

                <div className="admin-form-actions">

                  <button
                    type="submit"
                    className="admin-submit-btn"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword
                      ? 'در حال تغییر رمز...'
                      : 'تغییر رمز عبور'}
                  </button>

                </div>

              </div>

            </form>

          </section>

        )}


      </main>

    </div>

  )
}


// خروجی کامپوننت
export default AdminPage