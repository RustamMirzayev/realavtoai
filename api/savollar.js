// GET /api/savollar?password=... -> saqlangan savol-javoblar ro'yxati (JSON).
// Himoya: ADMIN_PASSWORD environment variable bilan taqqoslanadi.

const { getQuestions } = require("./lib/log");

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return res.status(500).json({ error: "ADMIN_PASSWORD sozlanmagan" });

  const given = (req.query && req.query.password) || "";
  if (given !== adminPassword) return res.status(401).json({ error: "Parol noto'g'ri" });

  try {
    const { enabled, items } = await getQuestions();
    if (!enabled) return res.status(200).json({ enabled: false, items: [] });
    return res.status(200).json({ enabled: true, items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server xatosi" });
  }
};
