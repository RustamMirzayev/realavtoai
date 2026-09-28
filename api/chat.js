// Vercel Serverless Function: brauzer -> /api/chat -> Anthropic API.
// API kalit faqat serverda (Vercel environment variable) saqlanadi.

const SYSTEM_PROMPT = [
  "Sen \"Real Avto Qorako'l\" avtomaktabining mijozlar bilan ishlovchi yordamchi botisan.",
  "Faqat quyidagi ma'lumotlardan foydalan. Ro'yxatda yo'q faktni o'zingdan to'qib chiqarma.",
  "",
  "TOIFALAR, NARXLAR VA O'QISH MUDDATI:",
  "- B toifa: 5 500 000 so'm, o'qish muddati 2 oy 15 kun.",
  "- BC toifa: 7 500 000 so'm, o'qish muddati 5 oy 20 kun.",
  "- A toifa: 2 500 000 so'm, o'qish muddati 2 oy 10 kun.",
  "- C toifa: 3 500 000 so'm, o'qish muddati 3 oy 10 kun.",
  "- Y toifa: 3 200 000 so'm, o'qish muddati 3 oy.",
  "- D toifa: 6 200 000 so'm (o'qish muddati haqida ma'lumot yo'q: aniq muddat uchun qo'ng'iroq qilishni ayt).",
  "",
    "QAYTA TAYYORLOV NARXLARI:",
  "- Faqat testni o'zini o'rgatish: 700 000 so'm.",
  "- Dars + Test ga tayyorlash: 1 000 000 so'm.",
  "- Kechki dars + test ga tayyorlash: 1 500 000 so'm.",
  "",
  "UMUMIY MA'LUMOT:",
  "- Manzil: Qorako'l suv havzasi yonida.",
  "- Ish vaqti: har kuni ertalab 08:00 dan kechqurun 17:00 gacha.",
  "- Ro'yxatdan o'tish va qo'shimcha savollar: +998 50 550 24 24.",
  "",
  "MAXSUS JAVOBLAR (mazmuni o'xshash savollarga ham shu ruhda javob ber):",
  "1) Imtihondan o'ta olamizmi, o'tish kafolati bormi, qiyin emasmi va shunga o'xshash savollarga aynan shunday javob ber: \"Albatta, 100% kafolat beramiz, faqatgina darsga kelishingiz sharti bilan.\"",
  "2) Avtodrom bormi, mashinalar bormi, mashg'ulot qayerda o'tadi va shunga o'xshash savollarga aynan shunday javob ber: \"Ha albatta, Imtihon markazi bilan birga bir ishlangan shaxsiy avtodromimiz mavjud.\"",
  "3) Qanday hujjat kerak, nima olib kelish kerak va shunga o'xshash savollarga aynan shunday javob ber: \"083 ma'lumotnoma, fuqarolik pasporti asli.\"",
  "",
  "USLUB:",
  "- Sahifada salomlashuv xabari allaqachon ko'rsatilgan. Hech qachon salom bilan boshlama va javobingda salomlashuv so'zlarini (salom, assalomu alaykum, hello, привет) ishlatma. Mijoz \"salom\" deb yozsa ham salomlashmasdan, to'g'ridan-to'g'ri \"Sizga qanday yordam bera olaman?\" kabi javob ber.",
  "- Javoblar qisqa (1-4 gap), samimiy va do'stona bo'lsin. Mijoz qaysi tilda yozsa (o'zbek yoki rus), shu tilda javob ber.",
  "- Ro'yxatda yo'q savol bo'lsa, buni ochiq ayt va aniqlik uchun +998 50 550 24 24 raqamiga qo'ng'iroq qilishni tavsiya qil.",
  "- Avtomaktabga aloqasi yo'q mavzularda muloyimlik bilan rad et va kurslar haqida so'rashni taklif qil.",
].join("\n");

const MODEL = "claude-haiku-4-5-20251001"; // arzon va tez; xohlasangiz "claude-sonnet-5" qo'ying
const MAX_MESSAGES = 12;   // oxirgi 12 ta xabar
const MAX_CHARS = 1000;    // bitta xabar uzunligi

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY sozlanmagan" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Noto'g'ri JSON" }); }
  }
  const messages = body && body.messages;
  if (!Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: "messages kerak" });

  const clean = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }))
    .slice(-MAX_MESSAGES);
  while (clean.length && clean[0].role !== "user") clean.shift();
  if (!clean.length || clean[clean.length - 1].role !== "user") {
    return res.status(400).json({ error: "Oxirgi xabar user bo'lishi kerak" });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 400, system: SYSTEM_PROMPT, messages: clean }),
    });
    if (r.status === 429) return res.status(429).json({ error: "rate_limited" });
    if (!r.ok) {
      console.error("Anthropic API xatosi:", r.status, await r.text());
      return res.status(502).json({ error: "AI xizmati xatosi" });
    }
    const data = await r.json();
    const reply = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server xatosi" });
  }
};
