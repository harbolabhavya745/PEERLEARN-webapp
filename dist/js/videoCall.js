const LIVEKIT_URL =
    "wss://peerlearn-webapp-41tumvi4.livekit.cloud";

let room = null;

async function createToken(roomName, username){

    const response = await fetch("/api/livekit-token",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            roomName,
            username
        })
    });

    return await response.text();

}

async function joinRoom(roomName,username){

    const token = await createToken(roomName,username);

    room = new window.LiveKit.Room();

    await room.connect(
        LIVEKIT_URL,
        token
    );

    console.log("Connected!");

}
