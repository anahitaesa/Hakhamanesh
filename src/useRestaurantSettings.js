
import { useEffect, useState } from 'react'
import API_URL from './api'

function useRestaurantSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchSettings() {
      try {
        const response = await fetch(`${API_URL}/settings/`)

        if (!response.ok) {
          throw new Error('دریافت تنظیمات رستوران ناموفق بود')
        }

        const data = await response.json()

        if (isMounted) {
          setSettings(data)
        }
      } catch (error) {
        console.error('خطا در دریافت تنظیمات:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchSettings()

    return () => {
      isMounted = false
    }
  }, [])

  return { settings, loading }
}

export default useRestaurantSettings
