// Savol-javoblarni Upstash Redis'ga yozish/o'qish uchun kichik yordamchi.
// Kerakli environment variable'lar: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
// Ular bo'lmasa, funksiyalar sekin ishlamaydi va xatoni yutib yuboradi (chatni to'xtatmaydi).

const LIST_KEY = "real_avto_savollar";
const MAX_ITEMS = 300; // eng ko'p shuncha yozuv saqlanadi

function upstashReady() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function upstash(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL.replace(/\/$/, "");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error("Upstash xatosi: " + res.status);
  return res.json();
}

// Bitta savol-javobni ro'yxat boshiga qo'shadi va ro'yxatni MAX_ITEMS bilan cheklaydi.
async function logQuestion({ question, reply }) {
  if (!upstashReady()) return; // sozlanmagan bo'lsa, jim o'tkazib yuboriladi
  try {
    const entry = JSON.stringify({ t: new Date().toISOString(), q: question, a: reply });
    await upstash(["LPUSH", LIST_KEY, entry]);
    await upstash(["LTRIM", LIST_KEY, "0", String(MAX_ITEMS - 1)]);
  } catch (err) {
    console.error("logQuestion xatosi:", err);
  }
}

// Saqlangan savol-javoblarni (eng yangisi birinchi) qaytaradi.
async function getQuestions() {
  if (!upstashReady()) return { enabled: false, items: [] };
  const data = await upstash(["LRANGE", LIST_KEY, "0", "-1"]);
  const items = (data.result || [])
    .map((s) => {
      try { return JSON.parse(s); } catch { return null; }
    })
    .filter(Boolean);
  return { enabled: true, items };
}

module.exports = { logQuestion, getQuestions };
