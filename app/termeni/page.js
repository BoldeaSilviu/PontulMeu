import Header from "../components/Header";
import Link from "next/link";

export const metadata = {
  title: "Termeni și Condiții - Pontul Meu",
};

export default function TermeniPage() {
  const style = {
    p: { color: "rgba(255,255,255,0.75)", lineHeight: 1.8, fontSize: 14, marginBottom: 14 },
    h2: { color: "#6ee7b7", fontSize: 17, fontWeight: 800, marginTop: 24, marginBottom: 10 },
    li: { color: "rgba(255,255,255,0.75)", lineHeight: 1.7, fontSize: 14, marginBottom: 6 },
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060c18", color: "white", fontFamily: "Georgia,serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px 16px 60px" }}>
        <Header back="/" />

        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Termeni și Condiții</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 24 }}>
          Actualizat: Aprilie 2026
        </p>

        <h2 style={style.h2}>1. Despre Pontul Meu</h2>
        <p style={style.p}>
          Pontul Meu (denumit în continuare „Aplicația") este o platformă informativă operată de
          <strong> PDF 33 LLC</strong>, care oferă analize sportive generate de inteligență artificială
          (Claude AI de la Anthropic) pentru meciurile de fotbal.
        </p>

        <h2 style={style.h2}>2. Scopul informativ</h2>
        <p style={style.p}>
          <strong>Pontul Meu NU este o platformă de jocuri de noroc.</strong> Toate analizele, pronosticurile,
          procentajele și recomandările prezentate sunt strict <strong>informative și educaționale</strong>.
          Utilizatorul își asumă întreaga responsabilitate pentru deciziile de pariere, aplicația nu garantează
          niciun rezultat.
        </p>

        <h2 style={style.h2}>3. Vârsta minimă</h2>
        <p style={style.p}>
          Pentru a utiliza aplicația trebuie să ai <strong>minim 18 ani</strong> și să te afli într-o jurisdicție
          în care pariurile sportive sunt legale.
        </p>

        <h2 style={style.h2}>4. Abonamente și plăți</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li style={style.li}>Planul Gratuit oferă 1 analiză pe zi.</li>
          <li style={style.li}>Planul Premium ($9.99/lună sau $79/an) oferă analize nelimitate și toate funcționalitățile extra.</li>
          <li style={style.li}>Plățile sunt procesate de Stripe Inc., conform termenilor lor.</li>
          <li style={style.li}>Abonamentele se reînnoiesc automat; pot fi anulate oricând din dashboard.</li>
          <li style={style.li}>Prima perioadă de probă (7 zile) este gratuită. Dacă nu se anulează, se trece automat la plată.</li>
        </ul>

        <h2 style={style.h2}>5. Rambursare</h2>
        <p style={style.p}>
          Conform OUG 34/2014, consumatorii au drept de retragere 14 zile de la începerea serviciului digital.
          Totuși, dacă utilizatorul folosește serviciul în acest interval (de ex. face analize), își exercită
          dreptul de acces imediat și pierde dreptul la rambursare.
        </p>

        <h2 style={style.h2}>6. Responsabilitate</h2>
        <p style={style.p}>
          PDF 33 LLC NU poate fi trasă la răspundere pentru pierderi financiare, de imagine sau de altă
          natură rezultate din utilizarea analizelor prezentate. Pariurile implică risc real de pierdere.
          Jucați responsabil.
        </p>

        <h2 style={style.h2}>7. Joc responsabil</h2>
        <p style={style.p}>
          Dacă ai probleme cu jocurile de noroc, te rugăm contactează:
          <br/>🇷🇴 Joc Responsabil România: <a href="https://jocresponsabil.ro" style={{ color: "#6ee7b7" }}>jocresponsabil.ro</a>
          <br/>📞 Tel Verde: 0800 800 099
        </p>

        <h2 style={style.h2}>8. Modificări</h2>
        <p style={style.p}>
          PDF 33 LLC își rezervă dreptul de a modifica acești termeni oricând. Modificările vor fi afișate
          pe această pagină, iar continuarea utilizării aplicației constituie acceptare.
        </p>

        <h2 style={style.h2}>9. Contact</h2>
        <p style={style.p}>
          Pentru orice întrebări: <a href="mailto:contact@pontul-meu.vercel.app" style={{ color: "#6ee7b7" }}>contact@pontul-meu.vercel.app</a>
        </p>

        <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
          <Link href="/confidentialitate" style={{ color: "#6ee7b7", fontSize: 13, marginRight: 20 }}>
            Politica de Confidențialitate →
          </Link>
          <Link href="/" style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
            ← Înapoi la aplicație
          </Link>
        </div>

        <div style={{ textAlign: "center", marginTop: 30, color: "rgba(255,255,255,0.2)", fontSize: 11 }}>
          Pontul Meu 2026 · Operat de PDF 33 LLC
        </div>
      </div>
    </div>
  );
}
