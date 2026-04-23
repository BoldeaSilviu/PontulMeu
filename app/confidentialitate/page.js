import Header from "../components/Header";
import Link from "next/link";

export const metadata = {
  title: "Politica de Confidențialitate - Pontul Meu",
};

export default function ConfidentialitatePage() {
  const style = {
    p: { color: "rgba(255,255,255,0.75)", lineHeight: 1.8, fontSize: 14, marginBottom: 14 },
    h2: { color: "#6ee7b7", fontSize: 17, fontWeight: 800, marginTop: 24, marginBottom: 10 },
    li: { color: "rgba(255,255,255,0.75)", lineHeight: 1.7, fontSize: 14, marginBottom: 6 },
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060c18", color: "white", fontFamily: "Georgia,serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px 16px 60px" }}>
        <Header back="/" />

        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Politica de Confidențialitate</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 24 }}>
          Actualizat: Aprilie 2026 · Conform GDPR
        </p>

        <h2 style={style.h2}>1. Operatorul de date</h2>
        <p style={style.p}>
          <strong>PDF 33 LLC</strong> este operatorul datelor personale colectate prin Pontul Meu.
        </p>

        <h2 style={style.h2}>2. Ce date colectăm</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li style={style.li}><strong>Email și nume</strong> — pentru autentificare și comunicări</li>
          <li style={style.li}><strong>Parolă</strong> — stocată criptat (bcrypt), nu poate fi citită</li>
          <li style={style.li}><strong>Date plăți</strong> — procesate DIRECT de Stripe, noi nu stocăm carduri</li>
          <li style={style.li}><strong>Istoric analize</strong> — meciurile pentru care ai cerut pronostic</li>
          <li style={style.li}><strong>Echipe favorite</strong> — pentru funcții personalizate (opțional)</li>
        </ul>

        <h2 style={style.h2}>3. Cum folosim datele</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li style={style.li}>Autentificare și acces la contul tău</li>
          <li style={style.li}>Procesarea abonamentelor Premium (prin Stripe)</li>
          <li style={style.li}>Personalizare (favorite, istoric, notificări)</li>
          <li style={style.li}>Comunicări despre cont (NU marketing fără consimțământ)</li>
          <li style={style.li}>Îmbunătățire serviciu (analize agregate, anonime)</li>
        </ul>

        <h2 style={style.h2}>4. Cui transmitem datele</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li style={style.li}><strong>Stripe</strong> (procesare plăți) — SUA, conformă GDPR</li>
          <li style={style.li}><strong>Anthropic</strong> (AI analize) — SUA, nu primește datele tale personale, doar numele echipelor</li>
          <li style={style.li}><strong>Vercel</strong> (hosting) — SUA, conformă GDPR</li>
          <li style={style.li}><strong>API-Football</strong> (date meciuri) — nu primește date utilizator</li>
        </ul>
        <p style={style.p}>
          <strong>NU vindem date către terți</strong> în scop de marketing.
        </p>

        <h2 style={style.h2}>5. Cookie-uri</h2>
        <p style={style.p}>
          Folosim un singur cookie esențial (<code>pontul_meu_auth</code>) pentru autentificare.
          Nu folosim cookie-uri de tracking sau publicitate.
        </p>

        <h2 style={style.h2}>6. Drepturile tale (GDPR)</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li style={style.li}>📥 <strong>Acces</strong> — să vezi ce date avem despre tine</li>
          <li style={style.li}>✏️ <strong>Rectificare</strong> — să corectezi date greșite</li>
          <li style={style.li}>🗑️ <strong>Ștergere</strong> — să ceri ștergerea contului și datelor</li>
          <li style={style.li}>📤 <strong>Portabilitate</strong> — să primești datele tale în format JSON</li>
          <li style={style.li}>🚫 <strong>Opoziție</strong> — să refuzi prelucrări specifice</li>
        </ul>
        <p style={style.p}>
          Trimite cerere la: <a href="mailto:contact@pontul-meu.vercel.app" style={{ color: "#6ee7b7" }}>contact@pontul-meu.vercel.app</a>
        </p>

        <h2 style={style.h2}>7. Retenția datelor</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li style={style.li}>Cont activ: pe durata utilizării</li>
          <li style={style.li}>Cont inactiv 24 luni: ștergere automată</li>
          <li style={style.li}>Facturi Stripe: 10 ani (obligație legală contabilă)</li>
        </ul>

        <h2 style={style.h2}>8. Securitate</h2>
        <p style={style.p}>
          Folosim HTTPS pentru toate comunicările, bcrypt pentru parole, JWT cu expirare pentru sesiuni.
          Baza de date e găzduită pe infrastructura securizată Vercel Postgres.
        </p>

        <h2 style={style.h2}>9. Minori</h2>
        <p style={style.p}>
          Serviciul nu este destinat persoanelor sub 18 ani. Dacă descoperim că avem date despre un minor,
          le ștergem imediat.
        </p>

        <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
          <Link href="/termeni" style={{ color: "#6ee7b7", fontSize: 13, marginRight: 20 }}>
            Termeni și Condiții →
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
