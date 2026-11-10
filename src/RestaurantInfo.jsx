import './RestaurantInfo.css';
import API_URL from './api';
import useRestaurantSettings from './useRestaurantSettings';


function RestaurantInfo() {
  const { settings, loading } = useRestaurantSettings();

  if (loading) {
    return (
      <section className="restaurant-info" dir="rtl">
        <p>در حال دریافت اطلاعات رستوران...</p>
      </section>
    );
  }

  const restaurantName = settings?.restaurant_name || 'رستوران';
  const phone = settings?.phone || '';
  const address = settings?.address || '';
  const description = settings?.description || '';

  const mapLinks = [
    {
      name: 'نشان',
      url: settings?.neshan_url,
    },
    {
      name: 'بلد',
      url: settings?.balad_url,
    },
    {
      name: 'گوگل مپ',
      url: settings?.google_maps_url,
    },
  ].filter((map) => map.url);

  return (
    <section className="restaurant-info" dir="rtl">

      <header className="restaurant-info-hero">
        <span className="restaurant-info-label">
          درباره ما
        </span>

        <h1>{restaurantName}</h1>

        <p>{description}</p>
      </header>

      <section className="restaurant-info-card">
        <h2>سفارش و پشتیبانی</h2>

        <p>
          برای ثبت سفارش یا دریافت راهنمایی با ما تماس بگیرید.
        </p>

        {phone && (
          <a
            className="restaurant-phone-link"
            href={`tel:${phone.replace(/[^\d+]/g, '')}`}
          >
            <span>تماس با رستوران</span>
            <strong>{phone}</strong>
          </a>
        )}
      </section>

      <section className="restaurant-info-card">
        <h2>ساعات کاری</h2>

        <p
          className="restaurant-address"
          style={{ whiteSpace: 'pre-line' }}
        >
          {settings?.opening_hours || 'ساعات کاری ثبت نشده است.'}
        </p>
      </section>

      <section className="restaurant-info-card">
        <h2>نشانی رستوران</h2>

        <p className="restaurant-address">
          {address || 'نشانی ثبت نشده است.'}
        </p>

        {mapLinks.length > 0 && (
          <div className="restaurant-map-links">
            {mapLinks.map((map) => (
              <a
                key={map.name}
                href={map.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {map.name}
              </a>
            ))}
          </div>
        )}

        <p className="restaurant-map-note">
          برای مسیریابی، نقشه موردنظر خود را انتخاب کنید.
        </p>
      </section>

    </section>
  );
}

export default RestaurantInfo;

