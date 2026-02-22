# TaskFlow Web Page
TaskFlow Web Page, TaskFlow platformu için hazırlanmış React tabanlı tanıtım ve şirket kayıt/abonelik akışını yöneten web uygulamasıdır.

## Özellikler
- Landing sayfasında ürün tanıtımı, özellik kartları, fiyat planları ve SSS bölümleri.
- Plan seçimine göre Stripe ödeme oturumu başlatma akışı.
- Ödeme sonrası şirket ve yönetici oluşturma formu.
- Şirket planlarını API'den dinamik çekme (fallback planlar ile).
- API hata cevaplarını normalize edip kullanıcı dostu Türkçe hata mesajlarına dönüştürme.
- Route yönetimi (`react-router-dom`) ve form doğrulama (`react-hook-form` + `zod`).

## Sayfalar ve Akış
- `/`
  Landing sayfası. Planlar listelenir ve kullanıcı plan seçerek ödeme akışına gider.
- `/checkout`
  Seçilen plan için Stripe ödeme bağlantısına yönlendirir.
- `/company/create`
  Ödeme başarılıysa abonelik aktivasyonu ve şirket/yönetici kayıt sürecini yönetir.

## Teknoloji Yığını
- React 19
- TypeScript
- Vite 7
- React Router DOM 7
- React Hook Form + Zod
- Tailwind CSS 4 (Vite eklentisi ile)
- ESLint 9

## Kurulum
1. Bağımlılıkları yükleyin:

```bash
npm install
```

2. Ortam değişkenlerini ayarlayın (`.env`):

```env
VITE_TASKFLOW_API_URL=http://localhost:8080
VITE_STRIPE_PAYMENT_LINK_STARTUP=https://...
VITE_STRIPE_PAYMENT_LINK_BUSINESS=https://...
VITE_STRIPE_PAYMENT_LINK_ENTERPRISE=https://...
```

3. Geliştirme sunucusunu başlatın:

```bash
npm run dev
```

## Scriptler
- `npm run dev`: Geliştirme sunucusunu başlatır.
- `npm run build`: TypeScript build + Vite production build.
- `npm run preview`: Production build önizleme.
- `npm run lint`: ESLint kontrolü.

## API Uçları (Uygulamada Kullanılan)
- `GET /api/Tenant/CompanyPlans`
- `POST /api/Tenant/CreateStripeCheckoutSessionRequest`
- `POST /api/Identity/CreateCompanyCommandRequest`
- `POST /api/Identity/RegisterCommandRequest`
- `POST /api/Tenant/ActivateCompanySubscriptionRequest`

Not: `vite.config.ts` içinde `/api` istekleri `VITE_TASKFLOW_API_URL` değerine proxy edilir.

## Proje Yapısı
```text
src/
  pages/
    LandingPage.tsx
    CheckoutPage.tsx
    CompanyCreatePage.tsx
  shared/
    errors/
      api.ts
      mappers.ts
      messages.ts
  App.tsx
  main.tsx
```

## Geliştirme Notları
- Ödeme akışında geçici plan bilgileri `localStorage` içinde tutulur.
- API'den dönen farklı payload formatları parse edilerek normalize edilir.
- Şirket oluşturma ve abonelik aktivasyon adımlarında detaylı hata eşleme yapılır.
