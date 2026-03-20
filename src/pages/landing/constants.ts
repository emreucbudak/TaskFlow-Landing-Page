export const PLAN_SELECT_CTA = "Plan Seç";

export const features = [
  {
    icon: "bar_chart",
    title: "Gelişmiş Raporlama",
    description: "Gerçek zamanlı analizler ve özel raporlarla ekibinizin performansını tam görünürlükle takip edin.",
  },
  {
    icon: "forum",
    title: "Güvenli Sohbet",
    description: "Ekibinizin anlık ve güvenli şekilde iletişim kurması için şifreli dahili mesajlaşma.",
  },
  {
    icon: "check_box",
    title: "Görev Yönetimi",
    description: "Sezgisel sürükle-bırak arayüzüyle görevleri atayın, takip edin ve verimli şekilde tamamlayın.",
  },
];

export const trustedBy = [
  { icon: "change_history", name: "ACME Corp" },
  { icon: "diamond", name: "GlobalTech" },
  { icon: "bolt", name: "FutureFinance" },
  { icon: "waves", name: "WavePoint" },
  { icon: "public", name: "Nexus" },
];

export const planDescriptions = [
  "Yeni başlayan küçük ekipler için ideal.",
  "Büyüyen ekipler için dengeli kapsam ve esneklik.",
  "Yüksek ölçekli şirketler için kapsamlı kurumsal çözüm.",
];

export const assistantWelcomeMessage = "Merhaba, ben TFBot. Size yardımcı olmak için buradayım.";

export const fixMojibakeText = (value: string) => {
  const replacements: Array<[string, string]> = [
    ["Ã§", "ç"],
    ["Ã‡", "Ç"],
    ["Ã¶", "ö"],
    ["Ã–", "Ö"],
    ["Ã¼", "ü"],
    ["Ãœ", "Ü"],
    ["Ä±", "ı"],
    ["Ä°", "İ"],
    ["ÄŸ", "ğ"],
    ["Äž", "Ğ"],
    ["ÅŸ", "ş"],
    ["Åž", "Ş"],
    ["â‚º", "₺"],
    ["kullan�c�", "kullanıcı"],
    ["tak�m", "takım"],
    ["g�rev", "görev"],
    ["�� raporlama", "İç raporlama"],
    ["i� raporlama", "iç raporlama"],
    ["B�y�yen", "Büyüyen"],
    ["ba�layan", "başlayan"],
    ["k���k", "küçük"],
    ["B�y�k", "Büyük"],
    ["kurulu�lar", "kuruluşlar"],
    ["�zelle�tirilmi�", "özelleştirilmiş"],
    ["s�re�lerinizi", "süreçlerinizi"],
    ["i�in", "için"],
    ["Y�ksek", "Yüksek"],
    ["�l�ekli", "ölçekli"],
    ["�irketler", "şirketler"],
    ["kapsaml�", "kapsamlı"],
    ["��z�m", "çözüm"],
  ];

  let normalized = value;
  for (const [wrong, correct] of replacements) {
    normalized = normalized.replaceAll(wrong, correct);
  }
  return normalized;
};
