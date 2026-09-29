# Real Avto Qorako'l AI — Vercel

## Fayllar
- `index.html` — sayt va chat interfeysi
- `api/chat.js` — Anthropic API bilan aloqa (bot ko'rsatmalari shu yerda, `SYSTEM_PROMPT`)
- `api/lib/log.js` — savol-javoblarni Upstash Redis'ga yozish/o'qish
- `api/savollar.js` — saqlangan savollarni parol bilan qaytaruvchi API
- `savollar.html` — savollarni ko'rish uchun parol bilan himoyalangan sahifa

## Kerakli environment variable'lar (Settings → Environment Variables)
| Nomi | Nima uchun |
|---|---|
| `ANTHROPIC_API_KEY` | AI javob berishi uchun (majburiy) |
| `UPSTASH_REDIS_REST_URL` | Savollarni saqlash uchun (ixtiyoriy, lekin `savollar.html` ishlashi uchun kerak) |
| `UPSTASH_REDIS_REST_TOKEN` | Yuqoridagi bilan bir juft |
| `ADMIN_PASSWORD` | `savollar.html` sahifasiga kirish paroli (o'zingiz o'ylab toping) |

Har bir o'zgarishdan keyin **Deployments → Redeploy** qiling.
