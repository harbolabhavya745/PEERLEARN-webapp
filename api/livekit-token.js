import { AccessToken } from "livekit-server-sdk";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method Not Allowed"
        });
    }

    try {

        const {
            username,
            roomName
        } = req.body;

        if (!username || !roomName) {
            return res.status(400).json({
                error: "Missing username or room"
            });
        }

        const token = new AccessToken(

            process.env.LIVEKIT_API_KEY,
            process.env.LIVEKIT_API_SECRET,

            {
                identity: username
            }

        );

        token.addGrant({

            roomJoin: true,
            room: roomName,
            canPublish: true,
            canSubscribe: true

        });

        const jwt = await token.toJwt();

        return res.status(200).send(jwt);

    } catch (err) {

        console.error(err);

        return res.status(500).json({

            error: err.message

        });

    }

}
