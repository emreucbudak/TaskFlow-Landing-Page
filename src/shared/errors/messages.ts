export const validationMessages = {
  requiredEmail: "E-posta zorunludur.",
  invalidEmail: "Gecerli bir e-posta girin.",
  requiredPassword: "Sifre zorunludur.",
  requiredCompanyName: "Lutfen sirket adini girin.",
  requiredAdminName: "Lutfen yonetici adini girin.",
  passwordMinLength: "Sifre en az 8 karakter olmali.",
  passwordMustContainUppercase: "Sifre en az 1 buyuk harf icermeli.",
  passwordMustContainLowercase: "Sifre en az 1 kucuk harf icermeli.",
  passwordMustContainNumber: "Sifre en az 1 rakam icermeli.",
  requiredPasswordConfirmation: "Sifre tekrari zorunludur.",
  passwordsDoNotMatch: "Sifreler eslesmiyor.",
} as const;

export const commonErrorMessages = {
  genericActionFailed: "Islem su anda tamamlanamiyor. Lutfen tekrar deneyin.",
  networkUnavailable: "Sunucuya ulasilamiyor. Internet baglantinizi kontrol edip tekrar deneyin.",
  temporaryServerError: "Sunucuda gecici bir hata olustu. Lutfen birazdan tekrar deneyin.",
} as const;

export const loginErrorMessages = {
  ...commonErrorMessages,
  tooManyAttempts: "Cok fazla giris denemesi yapildi. Lutfen 1-2 dakika bekleyip tekrar deneyin.",
  invalidCredentials: "E-posta veya sifre hatali.",
  userNotFound: "Bu e-posta ile kayitli bir hesap bulunamadi.",
  authenticationFailed: "Giris yapilamadi. Bilgilerinizi kontrol edip tekrar deneyin.",
  tokenValidationFailed: "Giris bilgileri dogrulanamadi. Lutfen tekrar deneyin.",
} as const;

export const companyCreateErrorMessages = {
  ...commonErrorMessages,
  emailAlreadyInUse: "Bu e-posta adresi zaten kullanimda.",
  registerFailed: "Yonetici hesabi olusturulamadi. Lutfen girdileri kontrol edip tekrar deneyin.",
  tooManyRequests: "Kisa surede cok fazla istek gonderildi. Lutfen 1-2 dakika bekleyip tekrar deneyin.",
  authenticationFailed: "Oturum dogrulanamadi. Lutfen yeniden giris yapip tekrar deneyin.",
  validationFailed: "Gonderilen bilgilerde eksik veya hatali alanlar var.",
  passwordRulesFailed: "Sifre en az 8 karakter olmali; buyuk harf, kucuk harf ve rakam icermelidir.",
  passwordGenericFailed: "Sifre kurallari saglanmiyor. Lutfen sifrenizi kontrol edin.",
  paymentPlanMissing: "Odeme basarili gorunuyor ancak plan bilgisi bulunamadi. Lutfen odeme adimini tekrar deneyin.",
  companyCreatedButIncomplete: "Sirket olusturuldu ancak islem tamamlanamadi. Lutfen tekrar deneyin.",
  subscriptionActivationFailed: "Abonelik aktif edilemedi.",
  companyCreatedButAdminFailedPrefix: "Sirket olusturuldu ancak yonetici hesabi acilamadi:",
  companyAndAdminCreatedButSubscriptionFailedPrefix: "Sirket ve yonetici olusturuldu ancak abonelik aktif edilemedi:",
} as const;

export const checkoutMessages = {
  paymentSuccess: "Odeme basarili. Sirket olusturma adimina yonlendiriliyorsunuz.",
  paymentCanceled: "Odeme iptal edildi. Dilediginiz zaman tekrar deneyebilirsiniz.",
  paymentLinkMissing: (planName: string) =>
    `"${planName}" plani icin odeme baglantisi bulunamadi. Lutfen daha sonra tekrar deneyin.`,
} as const;
