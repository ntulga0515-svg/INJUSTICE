const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static("public"));

/* =========================
   MEMBER DATA
========================= */

const dataDir = path.join(__dirname, "data");
const membersFile = path.join(dataDir, "members.json");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const defaultMembers = [
  {
    name: "OWNER",
    steam: "https://steamcommunity.com/id/arilnam/",
    role: "OWNER"
  },

  {
    name: "ADMIN",
    steam: "https://steamcommunity.com/profiles/76561199877551279/",
    role: "ADMIN"
  },
  {
    name: "ADMIN",
    steam: "https://steamcommunity.com/profiles/76561199013172707/",
    role: "ADMIN"
  },
  {
    name: "ADMIN",
    steam: "https://steamcommunity.com/profiles/76561199874044654/",
    role: "ADMIN"
  },

  {
    name: "MOD",
    steam: "https://steamcommunity.com/id/nocturnmachine/",
    role: "MOD"
  },
  {
    name: "MOD",
    steam: "https://steamcommunity.com/profiles/76561199831735722/",
    role: "MOD"
  },
  {
    name: "MOD",
    steam: "https://steamcommunity.com/profiles/76561199214217920/",
    role: "MOD"
  },
  {
    name: "MOD",
    steam: "https://steamcommunity.com/id/Nogitsunebnsnu/",
    role: "MOD"
  },

  {
    name: "MEMBER",
    steam: "https://steamcommunity.com/profiles/76561198729566626/",
    role: "MEMBER"
  },
  {
    name: "MEMBER",
    steam: "https://steamcommunity.com/profiles/76561199850349862/",
    role: "MEMBER"
  },
  {
    name: "MEMBER",
    steam: "https://steamcommunity.com/profiles/76561198643877059/",
    role: "MEMBER"
  },
  {
    name: "MEMBER",
    steam: "https://steamcommunity.com/profiles/76561198997835446/",
    role: "MEMBER"
  },
  {
    name: "MEMBER",
    steam: "https://steamcommunity.com/profiles/76561198788510029/",
    role: "MEMBER"
  },
  {
    name: "MEMBER",
    steam: "https://steamcommunity.com/profiles/76561198741196519/",
    role: "MEMBER"
  },
  {
    name: "MEMBER",
    steam: "https://steamcommunity.com/id/tmjn_1/",
    role: "MEMBER"
  },
  {
    name: "MEMBER",
    steam: "https://steamcommunity.com/profiles/76561198763411871/",
    role: "MEMBER"
  },
  {
    name: "MEMBER",
    steam: "https://steamcommunity.com/id/9x9x9x9x9x9x9x9x9x/",
    role: "MEMBER"
  },
  {
    name: "MEMBER",
    steam: "https://steamcommunity.com/profiles/76561198715065206/",
    role: "MEMBER"
  },
  {
    name: "MEMBER",
    steam: "https://steamcommunity.com/profiles/76561198645738847/",
    role: "MEMBER"
  },
  {
    name: "MEMBER",
    steam: "https://steamcommunity.com/profiles/76561198730914676/",
    role: "MEMBER"
  },
  {
    name: "MEMBER",
    steam: "https://steamcommunity.com/profiles/76561198760494020/",
    role: "MEMBER"
  },
  {
    name: "MEMBER",
    steam: "https://steamcommunity.com/profiles/76561199582768668/",
    role: "MEMBER"
  },
  {
    name: "MEMBER",
    steam: "https://steamcommunity.com/profiles/76561199653480321/",
    role: "MEMBER"
  },
  {
    name: "MEMBER",
    steam: "https://steamcommunity.com/id/bat_k/",
    role: "MEMBER"
  },
  {
    name: "MEMBER",
    steam: "https://steamcommunity.com/profiles/76561199880627444/",
    role: "MEMBER"
  }
];

/* =========================
   LOAD / SAVE MEMBERS
========================= */

function loadMembers() {
  try {
    if (!fs.existsSync(membersFile)) {
      fs.writeFileSync(
        membersFile,
        JSON.stringify(defaultMembers, null, 2)
      );

      return defaultMembers;
    }

    const data = fs.readFileSync(membersFile, "utf8");

    if (!data.trim()) {
      return defaultMembers;
    }

    return JSON.parse(data);
  } catch (error) {
    console.error("Member load error:", error);
    return defaultMembers;
  }
}

function saveMembers(members) {
  fs.writeFileSync(
    membersFile,
    JSON.stringify(members, null, 2)
  );
}

/* =========================
   STEAM HELPERS
========================= */

function cleanSteamLink(link) {
  if (!link) return null;

  return link.trim().replace(/\/+$/, "") + "/";
}

function getSteamIdFromLink(link) {
  if (!link) return null;

  const profileMatch = link.match(
    /steamcommunity\.com\/profiles\/(\d+)/
  );

  if (profileMatch) {
    return profileMatch[1];
  }

  return null;
}

/* =========================
   GET MEMBERS
========================= */

app.get("/api/members", (req, res) => {
  try {
    const members = loadMembers();

    res.json({
      success: true,
      members
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Гишүүдийг авахад алдаа гарлаа."
    });
  }
});

/* =========================
   ADD MEMBER
========================= */

app.post("/api/members", async (req, res) => {
  try {
    const {
      steam,
      discord
    } = req.body;

    if (!steam) {
      return res.status(400).json({
        success: false,
        message: "Steam link оруулна уу."
      });
    }

    const steamLink = cleanSteamLink(steam);

    if (
      !steamLink.startsWith(
        "https://steamcommunity.com/"
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Steam link буруу байна."
      });
    }

    const members = loadMembers();

    const exists = members.some(
      member =>
        member.steam.toLowerCase() ===
        steamLink.toLowerCase()
    );

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Энэ Steam account аль хэдийн member байна."
      });
    }

    const newMember = {
      name: discord || "NEW MEMBER",
      steam: steamLink,
      role: "MEMBER",
      avatar: null,
      addedAt: new Date().toISOString()
    };

    members.push(newMember);

    saveMembers(members);

    res.json({
      success: true,
      message: "Шинэ MEMBER нэмэгдлээ.",
      member: newMember
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Member нэмэхэд алдаа гарлаа."
    });
  }
});

/* =========================
   APPLICATION
========================= */

app.post("/api/apply", async (req, res) => {
  try {
    const {
      discord,
      steam,
      rank,
      faceit,
      reason
    } = req.body;

    if (
      !discord ||
      !steam ||
      !rank ||
      !faceit ||
      !reason
    ) {
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

    /* =========================
       DISCORD WEBHOOK
    ========================= */

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

    /* =========================
       APPLICATION -> MEMBER
    ========================= */

    const members = loadMembers();

    const steamLink = cleanSteamLink(steam);

    const alreadyMember = members.some(
      member =>
        member.steam.toLowerCase() ===
        steamLink.toLowerCase()
    );

    if (!alreadyMember) {
      members.push({
        name: discord,
        steam: steamLink,
        role: "MEMBER",
        avatar: null,
        rank: rank,
        faceit: faceit,
        addedAt: new Date().toISOString()
      });

      saveMembers(members);
    }

    /* =========================
       RESPONSE
    ========================= */

    res.json({
      success: true,
      message: "Хүсэлт амжилттай илгээгдлээ. MEMBER-д нэмэгдлээ."
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Хүсэлт илгээхэд алдаа гарлаа."
    });
  }
});

/* =========================
   SERVER
========================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `INJUSTICE server running on port ${PORT}`
  );
});
