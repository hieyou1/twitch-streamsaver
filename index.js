// You need a .env ready with client credentials
// Check README for more instructions
require("dotenv").config();
const fetch = require("node-fetch");
/**
 * @constant {Boolean} CACHE_NONGLOBAL Cache non-global (channel) emotes (default: true)
 * @default
 */
const CACHE_NONGLOBAL = true;
var token;
var emotes = new Map();
/**
 * @async
 * @function getToken Get a Twitch token for the Helix API
 * @returns {Promise<Object>}
 */
const getToken = async () => {
    if (token == null || token.expires_at < Date.now()) {
        // URL expanded for readability
        let url = new URL("https://id.twitch.tv/oauth2/token");

        // Use .env variables
        url.searchParams.set("client_id", process.env.client_id);
        url.searchParams.set("client_secret", process.env.client_secret);
        url.searchParams.set("grant_type", "client_credentials");

        // Measure request timing to make sure that we calculate expiry correctly [especially for slow HTTP]
        let d = Date.now();

        let tres = await fetch(url.href, {
            "method": "post"
        });
        tres = await tres.json();

        let d2 = Date.now();

        return token = {
            "access_token": tres["access_token"],
            "client_id": process.env.client_id,
            // Perform expiry measurement inline
            "expires_at": (d2 + tres.expires_in) + (d - d2)
        };
    } else {
        return token;
    }
};

// init express server
const Express = require("express");
const app = Express();
app.use(Express.static("./pub"));

// path to get emotes as JSON data
app.get("/emotes", async (req, res) => {
    let channel = req.query?.channel?.toString();

    if (emotes.has(channel)) {
        // emotes are cached for this channel, so use cache
        res.status(200).json(emotes.get(channel));
    } else if (channel == "global") {
        // getting global emotes is a different endpoint than normal channels, and caching built-in because global emotes are always cached
        emotes.set("global", (await (await fetch(`https://api.twitch.tv/helix/chat/emotes/global`, {
            "headers": {
                "authorization": `Bearer ${(await getToken()).access_token}`,
                "client-id": process.env.client_id
            }
        })).json()).data);
        res.status(200).json(emotes.get("global"));
    } else if (channel != null) {
        try {
            // get twitch channel id from username
            let channelId = (await (await fetch(`https://api.twitch.tv/helix/users?login=${channel}`, {
                "headers": {
                    "authorization": `Bearer ${(await getToken()).access_token}`,
                    "client-id": process.env.client_id
                }
            })).json()).data[0].id;

            // get emotes for id
            let channelEmotes = (await (await fetch(`https://api.twitch.tv/helix/chat/emotes?broadcaster_id=${channelId}`, {
                "headers": {
                    "authorization": `Bearer ${(await getToken()).access_token}`,
                    "client-id": process.env.client_id
                }
            })).json()).data;

            // push to cache, if turned on
            if (CACHE_NONGLOBAL) emotes.set(channel, channelEmotes);
            res.status(200).json(channelEmotes);
        } catch (err) {
            res.status(400).json({
                "error": "invalid channel"
            });
        }
    } else {
        res.status(400).json({
            "error": "channel unspecified"
        });
    }
});

// heroku compatibility
app.listen(process.env.PORT ?? 3005, () => {
    console.log(`listening on localhost:${process.env.PORT ?? 3005}`);
});