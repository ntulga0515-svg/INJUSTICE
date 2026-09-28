const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================
   NO CACHE
========================= */

app.use((req, res, next) => {
    res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
    );

    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    next();
});

app.use(
    express.static(
        path.join(__dirname, "public"),
        {
            etag: false,
            lastModified: false,
            maxAge: 0
        }
    )
);


/* =========================
   DATA
========================= */

const DATA_DIR =
    path.join(__dirname, "data");

const MEMBERS_FILE =
    path.join(DATA_DIR, "members.json");

const APPLICATIONS_FILE =
    path.join(DATA_DIR, "applications.json");


if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {
        recursive: true
    });
}


/* =========================
   DEFAULT MEMBERS
========================= */

const DEFAULT_MEMBERS = [

    /* =====================
       OWNER
    ===================== */

    {
        role: "OWNER",
        steam: "https://steamcommunity.com/id/arilnam/"
    },


    /* =====================
       MANAGER
    ===================== */

    {
        role: "MANAGER",
        steam: "https://steamcommunity.com/id/nocturnmachine/"
    },

    {
        role: "MANAGER",
        steam: "https://steamcommunity.com/profiles/76561199214217920/"
    },


    /* =====================
       ADMIN
    ===================== */

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


    /* =====================
       MOD
    ===================== */

    {
        role: "MOD",
        steam: "https://steamcommunity.com/profiles/76561199831735722/"
    },

    {
        role: "MOD",
        steam: "https://steamcommunity.com/id/Nogitsunebnsnu/"
    },


    /* =====================
       MEMBER
    ===================== */

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


/* =========================
   JSON
========================= */

function readJSON(file, fallback) {

    try {

        if (!fs.existsSync(file)) {

            fs.writeFileSync(
                file,
                JSON.stringify(
                    fallback,
                    null,
                    2
                )
            );

            return fallback;
        }

        const raw =
            fs.readFileSync(
                file,
                "utf8"
            );

        if (!raw.trim()) {
            return fallback;
        }

        return JSON.parse(raw);

    } catch (error) {

        console.error(
            "JSON READ ERROR:",
            file,
            error
        );

        return fallback;
    }
}


function writeJSON(file, data) {

    fs.writeFileSync(
        file,
        JSON.stringify(
            data,
            null,
            2
        )
    );

}


/* =========================
   LOAD DATA
========================= */

let members =
    readJSON(
        MEMBERS_FILE,
        DEFAULT_MEMBERS
    );


let applications =
    readJSON(
        APPLICATIONS_FILE,
        []
    );


/* =========================
   NORMALIZE MEMBERS
========================= */

members =
    members.map(member => {

        return {

            role:
                member.role || "MEMBER",

            steam:
                member.steam || "",

            name:
                member.name || "",

            avatar:
                member.avatar || "",

            tier:
                member.tier || null

        };

    });


/* =========================
   FORCE CORRECT ROLES
========================= */

/*
   Энд Steam link-ээр нь role-ийг
   автоматаар зөв болгож байна.

   Ингэснээр хуучин members.json дотор
   MOD гэж хадгалагдсан байсан ч
   MANAGER болж шинэчлэгдэнэ.
*/

const MANAGER_STEAMS = [
    "https://steamcommunity.com/id/nocturnmachine/",
    "https://steamcommunity.com/profiles/76561199214217920/"
];

const MOD_STEAMS = [
    "https://steamcommunity.com/profiles/76561199831735722/",
    "https://steamcommunity.com/id/Nogitsunebnsnu/"
];

const OWNER_STEAMS = [
    "https://steamcommunity.com/id/arilnam/"
];

const ADMIN_STEAMS = [
    "https://steamcommunity.com/profiles/76561199877551279/",
    "https://steamcommunity.com/profiles/76561199013172707/",
    "https://steamcommunity.com/profiles/76561199874044654/"
];


function normalizeSteam(url) {

    return String(url || "")
        .trim()
        .toLowerCase()
        .replace(/\/+$/, "");

}


members =
    members.map(member => {

        const steam =
            normalizeSteam(member.steam);


        if (
            OWNER_STEAMS
                .map(normalizeSteam)
                .includes(steam)
        ) {

            member.role = "OWNER";

        } else if (
            MANAGER_STEAMS
                .map(normalizeSteam)
                .includes(steam)
        ) {

            member.role = "MANAGER";

        } else if (
            ADMIN_STEAMS
                .map(normalizeSteam)
                .includes(steam)
        ) {

            member.role = "ADMIN";

        } else if (
            MOD_STEAMS
                .map(normalizeSteam)
                .includes(steam)
        ) {

            member.role = "MOD";

        }

        return member;

    });


/*
   members.json дээр шинэ role-уудыг
   хадгална.
*/

writeJSON(
    MEMBERS_FILE,
    members
);


/* =========================
   ROLE ORDER
========================= */

const ROLE_ORDER = {

    OWNER: 1,
    MANAGER: 2,
    ADMIN: 3,
    MOD: 4,
    MEMBER: 5

};


function sortMembers(list) {

    return [...list].sort(
        (a, b) => {

            const roleA =
                ROLE_ORDER[
                    String(a.role || "")
                        .toUpperCase()
                ] || 99;

            const roleB =
                ROLE_ORDER[
                    String(b.role || "")
                        .toUpperCase()
                ] || 99;

            return roleA - roleB;

        }
    );

}


/* =========================
   STEAM
========================= */

const STEAM_API_KEY =
    process.env.STEAM_API_KEY || "";


function extractSteamID(url) {

    const match =
        String(url || "").match(
            /steamcommunity\.com\/profiles\/(\d+)/i
        );

    return match
        ? match[1]
        : null;
}


function extractVanity(url) {

    const match =
        String(url || "").match(
            /steamcommunity\.com\/id\/([^/?#]+)/i
        );

    return match
        ? match[1]
        : null;
}


async function steamRequest(url) {

    const response =
        await fetch(url);

    if (!response.ok) {

        throw new Error(
            `Steam API HTTP ${response.status}`
        );

    }

    return response.json();
}


async function getSteamProfile(
    steamURL
) {

    if (!STEAM_API_KEY) {
        return null;
    }

    try {

        let steamID =
            extractSteamID(
                steamURL
            );


        if (!steamID) {

            const vanity =
                extractVanity(
                    steamURL
                );

            if (!vanity) {
                return null;
            }


            const resolveURL =
                "https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/" +
                `?key=${encodeURIComponent(STEAM_API_KEY)}` +
                `&vanityurl=${encodeURIComponent(vanity)}`;


            const resolved =
                await steamRequest(
                    resolveURL
                );


            if (
                !resolved.response ||
                resolved.response.success !== 1
            ) {

                return null;
            }


            steamID =
                resolved.response.steamid;

        }


        const summaryURL =
            "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/" +
            `?key=${encodeURIComponent(STEAM_API_KEY)}` +
            `&steamids=${encodeURIComponent(steamID)}`;


        const result =
            await steamRequest(
                summaryURL
            );


        const player =
            result.response &&
            result.response.players &&
            result.response.players[0];


        if (!player) {
            return null;
        }


        return {

            steamid:
                player.steamid,

            name:
                player.personaname,

            avatar:
                player.avatarfull ||
                player.avatarmedium ||
                player.avatar

        };


    } catch (error) {

        console.error(
            "STEAM ERROR:",
            error.message
        );

        return null;
    }

}


/* =========================
   MEMBERS API
========================= */

app.get(
    "/api/members",
    async (req, res) => {

        try {

            const result = [];


            /*
               Энд мөн role order ашиглаж байна.
            */

            const sortedMembers =
                sortMembers(
                    members
                );


            for (
                const member
                of sortedMembers
            ) {

                let profile =
                    null;


                if (STEAM_API_KEY) {

                    profile =
                        await getSteamProfile(
                            member.steam
                        );

                }


                result.push({

                    role:
                        member.role,

                    steam:
                        member.steam,

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
                        member.avatar ||
                        "https://cdn.discordapp.com/attachments/1553721738704199720/1553722012214624286/IMG_5654.jpg",

                    tier:
                        member.tier || null

                });

            }


            return res.json(
                result
            );


        } catch (error) {

            console.error(
                "MEMBERS API ERROR:",
                error
            );

            return res.status(500).json({

                message:
                    "Members API error."

            });

        }

    }
);


/* =========================
   DISCORD WEBHOOK
========================= */

const DISCORD_WEBHOOK_URL =
    process.env.DISCORD_WEBHOOK_URL || "";


async function sendApplicationWebhook(
    application
) {

    if (!DISCORD_WEBHOOK_URL) {
        return;
    }


    try {

        await fetch(
            DISCORD_WEBHOOK_URL,
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    username:
                        "INJUSTICE APPLICATION",

                    embeds: [

                        {

                            title:
                                "🩸 NEW APPLICATION",

                            color:
                                0xff1744,

                            fields: [

                                {
                                    name:
                                        "Discord",

                                    value:
                                        application.discord ||
                                        "-",

                                    inline:
                                        true
                                },

                                {
                                    name:
                                        "Steam",

                                    value:
                                        application.steam ||
                                        "-",

                                    inline:
                                        false
                                },

                                {
                                    name:
                                        "Rank",

                                    value:
                                        application.rank ||
                                        "-",

                                    inline:
                                        true
                                },

                                {
                                    name:
                                        "FACEIT",

                                    value:
                                        application.faceit ||
                                        "-",

                                    inline:
                                        true
                                },

                                {
                                    name:
                                        "Reason",

                                    value:
                                        application.reason ||
                                        "-",

                                    inline:
                                        false
                                }

                            ],

                            timestamp:
                                new Date().toISOString()

                        }

                    ]

                })

            }
        );

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

app.post(
    "/api/apply",
    async (req, res) => {

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

                    message:
                        "Бүх талбарыг бөглөнө үү."

                });

            }


            if (
                !String(steam).includes(
                    "steamcommunity.com/"
                )
            ) {

                return res.status(400).json({

                    message:
                        "Steam link буруу байна."

                });

            }


            const duplicate =
                applications.find(
                    application =>
                        application.status ===
                        "pending" &&
                        application.steam.toLowerCase() ===
                        String(steam).toLowerCase()
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
                        String(steam).toLowerCase()
                );


            if (existingMember) {

                return res.status(409).json({

                    message:
                        "Энэ Steam account аль хэдийн MEMBER байна."

                });

            }


            const profile =
                await getSteamProfile(
                    steam
                );


            const application = {

                id:
                    Date.now().toString() +
                    "-" +
                    crypto
                        .randomBytes(4)
                        .toString("hex"),

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


            applications.push(
                application
            );


            writeJSON(
                APPLICATIONS_FILE,
                applications
            );


            await sendApplicationWebhook(
                application
            );


            return res.json({

                success:
                    true,

                message:
                    "Хүсэлт илгээгдлээ. Админ зөвшөөрсний дараа MEMBER болно."

            });


        } catch (error) {

            console.error(
                "APPLY ERROR:",
                error
            );

            return res.status(500).json({

                message:
                    "Server error."

            });

        }

    }
);


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


    header
        .split(";")
        .forEach(part => {

            const index =
                part.indexOf("=");

            if (index === -1) {
                return;
            }


            const key =
                part
                    .slice(0, index)
                    .trim();


            const value =
                part
                    .slice(index + 1)
                    .trim();


            cookies[key] =
                decodeURIComponent(
                    value
                );

        });


    return cookies;
}


/* =========================
   DISCORD LOGIN
========================= */

app.get(
    "/auth/discord",
    (req, res) => {

        if (
            !DISCORD_CLIENT_ID ||
            !DISCORD_CLIENT_SECRET ||
            !DISCORD_REDIRECT_URI
        ) {

            return res.status(500).send(`

                <h1>
                    Discord OAuth тохируулаагүй байна.
                </h1>

                <p>
                    Render Environment Variables-аа шалгана уу.
                </p>

            `);

        }


        const state =
            crypto
                .randomBytes(24)
                .toString("hex");


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


        return res.redirect(
            "https://discord.com/oauth2/authorize?" +
            params.toString()
        );

    }
);


/* =========================
   DISCORD CALLBACK
========================= */

app.get(
    "/auth/discord/callback",
    async (req, res) => {

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


            oauthStates.delete(
                state
            );


            const tokenResponse =
                await fetch(
                    "https://discord.com/api/oauth2/token",
                    {

                        method:
                            "POST",

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

                        <title>
                            Access Denied
                        </title>

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

                            <h1>
                                ACCESS DENIED
                            </h1>

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
                crypto
                    .randomBytes(32)
                    .toString("hex");


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


            return res.redirect(
                "/manage.html"
            );


        } catch (error) {

            console.error(
                "DISCORD OAUTH ERROR:",
                error
            );

            return res.status(500).send(
                "Discord OAuth error."
            );

        }

    }
);


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
        manageSessions.get(
            token
        );


    if (!session) {
        return null;
    }


    if (
        !allowedDiscordIDs.includes(
            String(session.id)
        )
    ) {

        manageSessions.delete(
            token
        );

        return null;

    }


    return {

        token,

        ...session

    };

}


/* =========================
   MANAGE ME
========================= */

app.get(
    "/api/manage/me",
    (req, res) => {

        const user =
            getManageUser(req);


        if (!user) {

            return res.json({

                authorized:
                    false

            });

        }


        return res.json({

            authorized:
                true,

            id:
                user.id,

            username:
                user.username

        });

    }
);


/* =========================
   APPLICATIONS
========================= */

app.get(
    "/api/manage/applications",
    (req, res) => {

        const user =
            getManageUser(req);


        if (!user) {

            return res.status(403).json({

                message:
                    "Access denied."

            });

        }


        return res.json(

            applications.filter(
                application =>
                    application.status ===
                    "pending"
            )

        );

    }
);


/* =========================
   APPROVE
========================= */

app.post(
    "/api/manage/approve",
    async (req, res) => {

        const user =
            getManageUser(req);


        if (!user) {

            return res.status(403).json({

                message:
                    "Access denied."

            });

        }


        const {
            id
        } = req.body || {};


        const index =
            applications.findIndex(
                application =>
                    application.id === id &&
                    application.status ===
                    "pending"
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


        const profile =
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
                "",

            tier:
                null

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


        return res.json({

            success:
                true,

            message:
                "Application approved.",

            member:
                newMember

        });

    }
);


/* =========================
   REJECT
========================= */

app.post(
    "/api/manage/reject",
    (req, res) => {

        const user =
            getManageUser(req);


        if (!user) {

            return res.status(403).json({

                message:
                    "Access denied."

            });

        }


        const {
            id
        } = req.body || {};


        const index =
            applications.findIndex(
                application =>
                    application.id === id &&
                    application.status ===
                    "pending"
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


        return res.json({

            success:
                true

        });

    }
);


/* =========================
   TIER HELPERS
========================= */

function normalizeTier(tier) {

    if (
        tier === null ||
        tier === undefined
    ) {
        return null;
    }


    const value =
        String(tier)
            .trim()
            .toUpperCase();


    if (
        /^TIER [1-5]$/.test(value)
    ) {

        return value;

    }


    if (
        /^[1-5]$/.test(value)
    ) {

        return `TIER ${value}`;

    }


    return null;
}


/* =========================
   GET TIERS
   MANAGE ONLY
========================= */

app.get(
    "/api/manage/tiers",
    (req, res) => {

        const user =
            getManageUser(req);


        if (!user) {

            return res.status(403).json({

                message:
                    "Access denied."

            });

        }


        const result =
            sortMembers(
                members
            )
            .filter(member =>
                String(member.role || "")
                    .trim()
                    .toUpperCase() ===
                "MEMBER"
            )
            .map(member => ({

                steam:
                    member.steam,

                name:
                    member.name ||
                    "INJUSTICE MEMBER",

                avatar:
                    member.avatar || "",

                tier:
                    normalizeTier(
                        member.tier
                    )

            }));


        return res.json(
            result
        );

    }
);


/* =========================
   SAVE TIER
========================= */

app.post(
    "/api/manage/tiers",
    (req, res) => {

        const user =
            getManageUser(req);


        if (!user) {

            return res.status(403).json({

                message:
                    "Access denied."

            });

        }


        const {
            steam,
            tier
        } = req.body || {};


        if (!steam || !tier) {

            return res.status(400).json({

                message:
                    "Member болон Tier сонгоно уу."

            });

        }


        const normalizedTier =
            normalizeTier(
                tier
            );


        if (!normalizedTier) {

            return res.status(400).json({

                message:
                    "TIER 1-5 хооронд сонгоно уу."

            });

        }


        const member =
            members.find(item => {

                return (
                    normalizeSteam(item.steam) ===
                    normalizeSteam(steam)

                    &&

                    String(item.role || "")
                        .trim()
                        .toUpperCase() ===
                    "MEMBER"
                );

            });


        if (!member) {

            return res.status(404).json({

                message:
                    "MEMBER олдсонгүй."

            });

        }


        member.tier =
            normalizedTier;


        writeJSON(
            MEMBERS_FILE,
            members
        );


        console.log(
            `[TIER] ${member.name || member.steam} -> ${normalizedTier}`
        );


        return res.json({

            success:
                true,

            message:
                `${member.name || "Member"} → ${normalizedTier}`,

            member: {

                steam:
                    member.steam,

                name:
                    member.name,

                avatar:
                    member.avatar,

                tier:
                    member.tier

            }

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

            manageSessions.delete(
                token
            );

        }


        res.setHeader(
            "Set-Cookie",
            "injustice_manage=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0"
        );


        return res.json({

            success:
                true

        });

    }
);


/* =========================
   HEALTH
========================= */

app.get(
    "/api/health",
    (req, res) => {

        return res.json({

            status:
                "ok",

            clan:
                "INJUSTICE",

            members:
                members.length,

            tiers:
                members.filter(
                    member =>
                        normalizeTier(
                            member.tier
                        )
                ).length

        });

    }
);


/* =========================
   FALLBACK
========================= */

app.use(
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "public",
                "index.html"
            )
        );

    }
);


/* =========================
   START
========================= */

app.listen(
    PORT,
    () => {

        console.log(
            `INJUSTICE server running on port ${PORT}`
        );

        console.log(
            `Members: ${members.length}`
        );

        console.log(
            `Manage Discord IDs: ${allowedDiscordIDs.length}`
        );

    }
);
