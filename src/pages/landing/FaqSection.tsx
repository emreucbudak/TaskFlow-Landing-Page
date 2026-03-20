import { useState } from "react";

const faqItems = [
  {
    q: "TaskFlow'u kullanmaya başlamak için ne yapmam gerekiyor?",
    a: "Bir plan seçip ödemeyi tamamlamanız yeterli. Ödeme başarılı olduğunda kayıt sayfasına yönlendirilirsiniz.",
  },
  {
    q: "Planımı sonradan değiştirebilir miyim?",
    a: "Evet, dilediğiniz zaman daha üst bir plana geçiş yapabilirsiniz. Geçiş anında fark ücretlendirmesi uygulanır.",
  },
  {
    q: "Verilerim güvende mi?",
    a: "Tüm veriler TLS şifrelemesiyle iletilir ve sunucu tarafında AES-256 ile şifreli olarak saklanır. Düzenli yedekleme yapılır.",
  },
  {
    q: "Ücretsiz deneme var mı?",
    a: "Şu an için ücretsiz deneme sunulmamaktadır ancak Start-up planı küçük ekipler için uygun fiyatlı bir başlangıç seçeneği sunar.",
  },
  {
    q: "İptal etmek istediğimde ne olur?",
    a: "Aboneliğinizi istediğiniz zaman iptal edebilirsiniz. Mevcut dönem sonuna kadar erişiminiz devam eder, ek ücret alınmaz.",
  },
];

type FaqListProps = { cardBg: string; border: string; text: string; subText: string };

const FaqList = ({ cardBg, border, text, subText }: FaqListProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {faqItems.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} style={{
            borderRadius: "14px",
            border: `1px solid ${isOpen ? "rgba(19,236,200,0.35)" : border}`,
            background: cardBg, overflow: "hidden", transition: "border-color 0.2s",
          }}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              style={{
                width: "100%", display: "flex", justifyContent: "space-between",
                alignItems: "center", padding: "20px 24px", background: "transparent",
                border: "none", cursor: "pointer", textAlign: "left", gap: "16px",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "15px", color: text, lineHeight: 1.4 }}>{item.q}</span>
              <span style={{
                flexShrink: 0, width: "28px", height: "28px", borderRadius: "50%",
                background: isOpen ? "#13ecc8" : "rgba(19,236,200,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s, transform 0.25s",
                transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                color: isOpen ? "#0d1b19" : "#13ecc8",
                fontSize: "20px", fontFamily: "'Material Symbols Outlined'",
              }}>add</span>
            </button>
            <div style={{ maxHeight: isOpen ? "200px" : "0px", overflow: "hidden", transition: "max-height 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
              <p style={{ margin: 0, padding: "0 24px 20px", fontSize: "14px", color: subText, lineHeight: 1.7 }}>{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FaqList;
