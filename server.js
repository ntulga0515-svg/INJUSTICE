const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const DATA_DIR = path.join(__dirname, "data");
const MEMBERS_FILE = path.join(DATA_DIR, "members.json");
const APPLICATIONS_FILE = path.join(DATA_DIR, "applications.json");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}


/* =========================
   DEFAULT MEMBERS
========================= */

const DEFAULT_MEMBERS = [

    {
        role: "OWNER",
        steam: "https://steamcommunity.com/id/arilnam/"
    },

    {
        role: "ADMIN",
        steam: "https://steamcommunity.com/profiles/76561199877551279/"
    },

    {
        role: "ADMIN",
        steam: "https://steamcommunity.com/profiles/76561199013172707/"
    },

    {
        role: "ADMIN",
        steam: "https://steamcommunity.com/profiles/76561199874044654/"
    },

    {
        role: "MOD",
        steam: "https://steamcommunity.com/id/nocturnmachine/"
    },

    {
        role: "MOD",
        steam: "https://steamcommunity.com/profiles/76561199831735722/"
    },

    {
        role: "MOD",
        steam: "https://steamcommunity.com/profiles/76561199214217920/"
    },

    {
        role: "MOD",
        steam: "https://steamcommunity.com/id/Nogitsunebnsnu/"
    },

    {
        role: "MEMBER",
        steam: "https://steamcommunity.com/profiles/76561198729566626/"
    },

    {
        role: "MEMBER",
        steam: "https://steamcommunity.com/profiles/76561199850349862/"
    },

    {
        role: "MEMBER",
        steam: "https://steamcommunity.com/profiles/76561198643877059/"
    },

    {
        role: "MEMBER",
        steam: "https://steamcommunity.com/profiles/76561198997835446/"
    },

    {
        role: "MEMBER",
        steam: "https://steamcommunity.com/profiles/76561198788510029/"
    },

    {
        role: "MEMBER",
        steam: "https://steamcommunity.com/profiles/76561198741196519/"
    },

    {
        role: "MEMBER",
        steam: "https://steamcommunity.com/id/tmjn_1/"
    },

    {
        role: "MEMBER",
        steam: "https://steamcommunity.com/profiles/76561198763411871/"
    },

    {
        role: "MEMBER",
        steam: "https://steamcommunity.com/id/9x9x9x9x9x9x9x9x9x/"
    },

    {
        role: "MEMBER",
        steam: "https://steamcommunity.com/profiles/76561198715065206/"
    },

    {
        role: "MEMBER",
        steam: "https://steamcommunity.com/profiles/76561198643838847/"
    },

    {
        role: "MEMBER",
        steam: "https://steamcommunity.com/profiles/76561198730914676/"
    },

    {
        role: "MEMBER",
        steam: "https://steamcommunity.com/profiles/76561198760494020/"
    },

    {
        role: "MEMBER",
        steam: "https://steamcommunity.com/profiles/76561199582768668/"
    },

    {
        role: "MEMBER",
        steam: "https://steamcommunity.com/profiles/76561199653480321/"
    },

    {
        role: "MEMBER",
        steam: "https://steamcommunity.com/id/bat_k/"
    },

    {
        role: "MEMBER",
        steam: "https://steamcommunity.com/profiles/76561199880627444/"
    }

];


function readJSON(file, fallback) {

    try {

        if (!fs.existsSync(file)) {
            fs.writeFileSync(
                file,
                JSON.stringify(fallback, null, 2)
            );

            return fallback;
        }

        const raw = fs.readFileSync(file, "utf8");

        if (!raw.trim()) {
            return fallback;
        }

        return JSON.parse(raw);

    } catch (error) {

        console.error("JSON READ ERROR:", file, error);

        return fallback;
    }
}


function writeJSON(file, data) {

    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 2)
    );
}


let members = readJSON(MEMBERS_FILE, DEFAULT_MEMBERS);
let applications = readJSON(APPLICATIONS_FILE, []);


/* =========================
   STEAM API
========================= */

const STEAM_API_KEY =
    process.env.STEAM_API_KEY || "";


function extractSteamID(url) {

    const match = String(url || "").match(
        /steamcommunity\.com\/profiles\/(\d+)/i
    );

    return match ? match[1] : null;
}


function extractVanity(url) {

    const match = String(url || "").match(
        /steamcommunity\.com\/id\/([^/?#]+)/i
    );

    return match ? match[1] : null;
}


async function steamRequest(url) {

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Steam API HTTP ${response.status}`
        );
    }

    return response.json();
}


async function getSteamProfile(steamURL) {

    if (!STEAM_API_KEY) {
        return null;
    }

    try {

        let steamID = extractSteamID(steamURL);

        if (!steamID) {

            const vanity = extractVanity(steamURL);

            if (!vanity) {
                return null;
            }

            const resolveURL =
                "https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/" +
                `?key=${encodeURIComponent(STEAM_API_KEY)}` +
                `&vanityurl=${encodeURIComponent(vanity)}`;

            const resolved = await steamRequest(resolveURL);

            if (
                !resolved.response ||
                resolved.response.success !== 1
            ) {
                return null;
            }

            steamID = resolved.response.steamid;
        }

        const summaryURL =
            "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/" +
            `?key=${encodeURIComponent(STEAM_API_KEY)}` +
            `&steamids=${encodeURIComponent(steamID)}`;

        const result = await steamRequest(summaryURL);

        const player =
            result.response &&
            result.response.players &&
            result.response.players[0];

        if (!player) {
            return null;
        }

        return {
            steamid: player.steamid,
            name: player.personaname,
            avatar: player.avatarfull || player.avatarmedium || player.avatar
        };

    } catch (error) {

        console.error("STEAM ERROR:", error.message);

        return null;
    }
}


/* =========================
   MEMBERS API
========================= */

app.get("/api/members", async (req, res) => {

    const result = [];

    for (const member of members) {

        let profile = null;

        if (STEAM_API_KEY) {
            profile = await getSteamProfile(member.steam);
        }

        result.push({
            role: member.role,
            steam: member.steam,
            name:
                profile?.name ||
                member.name ||
                member.steam
                    .split("/")
                    .filter(Boolean)
                    .pop() ||
                "INJUSTICE MEMBER",
            avatar:
                profile?.avatar ||
                "https://cdn.discordapp.com/attachments/1553721738704199720/1553722012214624286/IMG_5654.jpg"
        });
    }

    res.json(result);
});


/* =========================
   DISCORD WEBHOOK
========================= */

const DISCORD_WEBHOOK_URL =
    process.env.DISCORD_WEBHOOK_URL || "";


async function sendApplicationWebhook(application) {

    if (!DISCORD_WEBHOOK_URL) {
        return;
    }

    try {

        await fetch(DISCORD_WEBHOOK_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                username: "INJUSTICE APPLICATION",

                embeds: [

                    {
                        title: "🩸 NEW APPLICATION",

                        color: 0xff1744,

                        fields: [

                            {
                                name: "Discord",
                                value: application.discord || "-",
                                inline: true
                            },

                            {
                                name: "Steam",
                                value: application.steam || "-",
                                inline: false
                            },

                            {
                                name: "Rank",
                                value: application.rank || "-",
                                inline: true
                            },

                            {
                                name: "FACEIT",
                                value: application.faceit || "-",
                                inline: true
                            },

                            {
                                name: "Reason",
                                value: application.reason || "-",
                                inline: false
                            }

                        ],

                        timestamp: new Date().toISOString()
                    }

                ]

            })

        });

    } catch (error) {

        console.error(
            "DISCORD WEBHOOK ERROR:",
            error.message
        );
    }
}


/* =========================
   APPLY
========================= */

app.post("/api/apply", async (req, res) => {

    try {

        const {
            discord,
            steam,
            rank,
            faceit,
            reason
        } = req.body || {};

        if (
            !discord ||
            !steam ||
            !rank ||
            !faceit ||
            !reason
        ) {

            return res.status(400).json({
                message: "Бүх талбарыг бөглөнө үү."
            });
        }


        if (
            !steam.includes("steamcommunity.com/")
        ) {

            return res.status(400).json({
                message: "Steam link буруу байна."
            });
        }


        const duplicate =
            applications.find(
                app =>
                    app.status === "pending" &&
                    app.steam.toLowerCase() ===
                    steam.toLowerCase()
            );


        if (duplicate) {

            return res.status(409).json({
                message:
                    "Энэ Steam account аль хэдийн хүсэлт илгээсэн байна."
            });
        }


        const existingMember =
            members.find(
                member =>
                    member.steam.toLowerCase() ===
                    steam.toLowerCase()
            );


        if (existingMember) {

            return res.status(409).json({
                message:
                    "Энэ Steam account аль хэдийн MEMBER байна."
            });
        }


        const profile =
            await getSteamProfile(steam);


        const application = {

            id:
                Date.now().toString() +
                "-" +
                crypto.randomBytes(4).toString("hex"),

            discord:
                String(discord).trim(),

            steam:
                String(steam).trim(),

            rank:
                String(rank).trim(),

            faceit:
                String(faceit).trim(),

            reason:
                String(reason).trim(),

            steamName:
                profile?.name || "",

            steamAvatar:
                profile?.avatar || "",

            status:
                "pending",

            createdAt:
                new Date().toISOString()

        };


        applications.push(application);

        writeJSON(
            APPLICATIONS_FILE,
            applications
        );


        await sendApplicationWebhook(
            application
        );


        res.json({

            success: true,

            message:
                "Хүсэлт илгээгдлээ. Админ зөвшөөрсний дараа MEMBER болно."

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error."
        });
    }
});


/* =========================
   DISCORD OAUTH
========================= */

const DISCORD_CLIENT_ID =
    process.env.DISCORD_CLIENT_ID || "";

const DISCORD_CLIENT_SECRET =
    process.env.DISCORD_CLIENT_SECRET || "";

const DISCORD_REDIRECT_URI =
    process.env.DISCORD_REDIRECT_URI || "";


const allowedDiscordIDs =
    String(
        process.env.MANAGE_DISCORD_IDS || ""
    )
    .split(",")
    .map(id => id.trim())
    .filter(Boolean);


const manageSessions =
    new Map();


const oauthStates =
    new Map();


function parseCookies(req) {

    const cookies = {};

    const header =
        req.headers.cookie || "";

    header.split(";").forEach(part => {

        const index = part.indexOf("=");

        if (index === -1) return;

        const key =
            part.slice(0, index).trim();

        const value =
            part.slice(index + 1).trim();

        cookies[key] =
            decodeURIComponent(value);

    });

    return cookies;
}


app.get("/auth/discord", (req, res) => {

    if (
        !DISCORD_CLIENT_ID ||
        !DISCORD_CLIENT_SECRET ||
        !DISCORD_REDIRECT_URI
    ) {

        return res.status(500).send(`
            <h1>Discord OAuth тохируулаагүй байна.</h1>
            <p>Render Environment Variables-аа шалгана уу.</p>
        `);
    }


    const state =
        crypto.randomBytes(24).toString("hex");


    oauthStates.set(
        state,
        Date.now()
    );


    const params =
        new URLSearchParams({

            client_id:
                DISCORD_CLIENT_ID,

            redirect_uri:
                DISCORD_REDIRECT_URI,

            response_type:
                "code",

            scope:
                "identify",

            state

        });


    res.redirect(
        "https://discord.com/oauth2/authorize?" +
        params.toString()
    );
});


app.get("/auth/discord/callback", async (req, res) => {

    try {

        const {
            code,
            state
        } = req.query;


        if (
            !code ||
            !state ||
            !oauthStates.has(state)
        ) {

            return res.status(400).send(
                "Invalid OAuth state."
            );
        }


        oauthStates.delete(state);


        const tokenResponse =
            await fetch(
                "https://discord.com/api/oauth2/token",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },

                    body:
                        new URLSearchParams({

                            client_id:
                                DISCORD_CLIENT_ID,

                            client_secret:
                                DISCORD_CLIENT_SECRET,

                            grant_type:
                                "authorization_code",

                            code:
                                String(code),

                            redirect_uri:
                                DISCORD_REDIRECT_URI

                        })

                }
            );


        const tokenData =
            await tokenResponse.json();


        if (
            !tokenResponse.ok ||
            !tokenData.access_token
        ) {

            return res.status(401).send(
                "Discord OAuth login failed."
            );
        }


        const userResponse =
            await fetch(
                "https://discord.com/api/users/@me",
                {

                    headers: {
                        Authorization:
                            `Bearer ${tokenData.access_token}`
                    }

                }
            );


        const user =
            await userResponse.json();


        if (!userResponse.ok) {

            return res.status(401).send(
                "Discord user information failed."
            );
        }


        const authorized =
            allowedDiscordIDs.includes(
                String(user.id)
            );


        if (!authorized) {

            return res.status(403).send(`

                <!DOCTYPE html>

                <html>

                <head>

                <title>Access Denied</title>

                <style>

                body{
                    background:#050507;
                    color:white;
                    font-family:Arial;
                    display:flex;
                    justify-content:center;
                    align-items:center;
                    min-height:100vh;
                    text-align:center;
                }

                h1{
                    color:#ff1744;
                }

                a{
                    color:#8b35ff;
                }

                </style>

                </head>

                <body>

                <div>

                    <h1>ACCESS DENIED</h1>

                    <p>
                    Таны Discord account Manage эрхгүй байна.
                    </p>

                    <br>

                    <a href="/">
                    Буцах
                    </a>

                </div>

                </body>

                </html>

            `);
        }


        const sessionToken =
            crypto.randomBytes(32).toString("hex");


        manageSessions.set(
            sessionToken,
            {
                id:
                    String(user.id),

                username:
                    user.global_name ||
                    user.username,

                createdAt:
                    Date.now()
            }
        );


        res.setHeader(
            "Set-Cookie",

            [
                `injustice_manage=${encodeURIComponent(sessionToken)}`,
                "HttpOnly",
                "Path=/",
                "SameSite=Lax",
                "Max-Age=604800"
            ].join("; ")
        );


        res.redirect(
            "/?manage=1#manage"
        );


    } catch (error) {

        console.error(
            "DISCORD OAUTH ERROR:",
            error
        );

        res.status(500).send(
            "Discord OAuth error."
        );
    }

});


/* =========================
   MANAGE AUTH
========================= */

function getManageUser(req) {

    const cookies =
        parseCookies(req);

    const token =
        cookies.injustice_manage;

    if (!token) {
        return null;
    }

    const session =
        manageSessions.get(token);

    if (!session) {
        return null;
    }

    if (
        !allowedDiscordIDs.includes(
            String(session.id)
        )
    ) {

        manageSessions.delete(token);

        return null;
    }

    return {
        token,
        ...session
    };
}


app.get("/api/manage/me", (req, res) => {

    const user =
        getManageUser(req);


    if (!user) {

        return res.json({
            authorized: false
        });
    }


    res.json({

        authorized: true,

        id:
            user.id,

        username:
            user.username

    });

});


/* =========================
   GET APPLICATIONS
========================= */

app.get(
    "/api/manage/applications",
    (req, res) => {

        const user =
            getManageUser(req);


        if (!user) {

            return res.status(403).json({
                message: "Access denied."
            });
        }


        res.json(
            applications.filter(
                app =>
                    app.status === "pending"
            )
        );

    }
);


/* =========================
   APPROVE APPLICATION
========================= */

app.post(
    "/api/manage/approve",
    async (req, res) => {

        const user =
            getManageUser(req);


        if (!user) {

            return res.status(403).json({
                message: "Access denied."
            });
        }


        const {
            id
        } = req.body || {};


        const index =
            applications.findIndex(
                app =>
                    app.id === id &&
                    app.status === "pending"
            );


        if (index === -1) {

            return res.status(404).json({
                message:
                    "Application олдсонгүй."
            });
        }


        const application =
            applications[index];


        const alreadyMember =
            members.some(
                member =>
                    member.steam.toLowerCase() ===
                    application.steam.toLowerCase()
            );


        if (alreadyMember) {

            applications.splice(
                index,
                1
            );

            writeJSON(
                APPLICATIONS_FILE,
                applications
            );

            return res.status(409).json({
                message:
                    "Энэ Steam account аль хэдийн MEMBER байна."
            });
        }


        let profile =
            await getSteamProfile(
                application.steam
            );


        const newMember = {

            role:
                "MEMBER",

            steam:
                application.steam,

            name:
                profile?.name ||
                application.steamName ||
                application.discord,

            avatar:
                profile?.avatar ||
                application.steamAvatar ||
                ""

        };


        members.push(
            newMember
        );


        applications.splice(
            index,
            1
        );


        writeJSON(
            MEMBERS_FILE,
            members
        );

        writeJSON(
            APPLICATIONS_FILE,
            applications
        );


        res.json({

            success: true,

            message:
                "Application approved.",

            member:
                newMember

        });

    }
);


/* =========================
   REJECT APPLICATION
========================= */

app.post(
    "/api/manage/reject",
    (req, res) => {

        const user =
            getManageUser(req);


        if (!user) {

            return res.status(403).json({
                message: "Access denied."
            });
        }


        const {
            id
        } = req.body || {};


        const index =
            applications.findIndex(
                app =>
                    app.id === id &&
                    app.status === "pending"
            );


        if (index === -1) {

            return res.status(404).json({
                message:
                    "Application олдсонгүй."
            });
        }


        applications.splice(
            index,
            1
        );


        writeJSON(
            APPLICATIONS_FILE,
            applications
        );


        res.json({

            success: true,

            message:
                "Application rejected."

        });

    }
);


/* =========================
   LOGOUT
========================= */

app.post(
    "/api/manage/logout",
    (req, res) => {

        const cookies =
            parseCookies(req);

        const token =
            cookies.injustice_manage;


        if (token) {
            manageSessions.delete(token);
        }


        res.setHeader(
            "Set-Cookie",
            "injustice_manage=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0"
        );


        res.json({
            success: true
        });

    }
);


/* =========================
   START SERVER
========================= */

app.get("/api/health", (req, res) => {

    res.json({
        status: "ok",
        clan: "INJUSTICE"
    });

});


app.get("*", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


app.listen(PORT, () => {

    console.log(
        `INJUSTICE server running on port ${PORT}`
    );

    console.log(
        `Manage Discord IDs: ${allowedDiscordIDs.length}`
    );

});
