const express = require("express");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static("public"));

app.post("/api/apply", async (req, res) => {
  try {
    const {
      discord,
      steam,
      rank,
      faceit,
      reason
    } = req.body;

    if (!discord || !steam || !rank || !faceit || !reason) {
      return res.status(400).json({
        success: false,
        message: "Бүх хэсгийг бөглөнө үү."
      });
    }

    const webhook = process.env.DISCORD_WEBHOOK_URL;

    if (!webhook) {
      return res.status(500).json({
        success: false,
        message: "Discord webhook тохируулагдаагүй байна."
      });
    }

    const response = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: "INJUSTICE APPLICATION",
        embeds: [
          {
            title: "🔴 ШИНЭ INJUSTICE ХҮСЭЛТ",
            color: 16711680,
            fields: [
              {
                name: "Discord нэр",
                value: discord,
                inline: true
              },
              {
                name: "Steam link",
                value: steam,
                inline: true
              },
              {
                name: "1st Rank",
                value: rank,
                inline: true
              },
              {
                name: "FACEIT Level",
                value: faceit,
                inline: true
              },
              {
                name: "Яагаад INJUSTICE-г сонгосон бэ?",
                value: reason
              }
            ],
            timestamp: new Date().toISOString()
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error("Discord webhook failed");
    }

    res.json({
      success: true,
      message: "Хүсэлт амжилттай илгээгдлээ."
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Хүсэлт илгээхэд алдаа гарлаа."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`INJUSTICE server running on port ${PORT}`);
});
