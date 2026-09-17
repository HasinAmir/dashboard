import asyncio
import base64
import json
import os

import aiohttp
import numpy as np
import sounddevice as sd
import websockets

URL = "wss://agents.assemblyai.com/v1/ws"
RATE = 24_000

# Your deployed weather+alerts endpoint (Next.js on Vercel)
WEATHER_TOOL_URL = os.environ.get(
    "WEATHER_TOOL_URL",
    "https://dashboard-tau-weld-15.vercel.app/api/weather",
)

PROMPT = """
You are DawnCast, a warm, friendly, conversational spoken weather assistant — think of a knowledgeable friend, not a robot.

Your personality:
- Start each session by warmly greeting the user by first name (Hasin) and asking for their location.
- When you don't understand something, politely acknowledge it and gently redirect: "I'm not sure about that, but I can definitely help with weather!"
- Respond naturally to greetings, small talk, and thanks — don't jump straight to weather data if someone just says "Hi".
- When asked about weather, always call get_weather first, then speak naturally using this structure:
  1. Current temperature in degrees Celsius (high and low), and sky condition.
  2. Comfort check — is it too hot (32°C+, advise hydration & shade) or too cold (10°C-, advise warm layers)?
  3. Rain advice — state rain probability and whether to carry an umbrella.
  4. Hazard briefing — if active, name the abbreviation (TC = Tropical Cyclone, FL = Flood, EQ = Earthquake, EXT-HEAT = Heatwave) and advise caution. If none, confirm all clear.

Tone rules:
- Sound warm and human — use contractions, natural phrasing, and occasional light humour.
- Acknowledge what you heard before answering: "Sure, let me check that for you..." or "Great question!"
- Never read raw field names, JSON, or technical data. No markdown.
- Keep responses concise but complete — don't over-explain.
"""

TOOLS = [{
    "type": "function",
    "name": "get_weather",
    "description": (
        "Get current conditions and active alerts. Always use for weather "
        "questions; omit location to default to Sylhet, Bangladesh."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "location": {
                "type": "string",
                "description": "Named city or country, for example Tokyo, Japan."
            }
        },
        "required": []
    }
}]


async def get_weather(location=None):
    """Calls DawnCast's real weather+alerts endpoint (Next.js on Vercel),
    which pulls live data from OpenWeatherMap and GDACS."""
    params = {"location": location} if location else {}

    async with aiohttp.ClientSession() as session:
        async with session.get(WEATHER_TOOL_URL, params=params, timeout=15) as resp:
            resp.raise_for_status()
            data = await resp.json()

    # Reshape the endpoint's response into the fields the prompt expects.
    alerts = data.get("alerts") or []
    top_alert = alerts[0] if alerts else None

    return {
        "location": data.get("location"),
        "condition": data.get("condition"),
        "temperature_c": data.get("temperature_c"),
        "high_c": data.get("high_c"),
        "low_c": data.get("low_c"),
        "rain_chance_percent": data.get("rain_probability_percent"),
        "active_alert": data.get("active_alert", False),
        "alert_type": top_alert.get("type") if top_alert else None,
        "alert_summary": top_alert.get("description") if top_alert else None,
    }


async def main():
    api_key = os.environ.get("ASSEMBLYAI_API_KEY")
    if not api_key:
        raise RuntimeError("Set ASSEMBLYAI_API_KEY in your environment.")

    headers = {"Authorization": f"Bearer {api_key}"}
    ready = asyncio.Event()
    mic_queue = asyncio.Queue(maxsize=200)  # generous headroom to avoid overflow spam
    pending_results = []
    loop = asyncio.get_running_loop()

    # Half-duplex flag: mic is muted while DawnCast is speaking, so it
    # can't hear (and react to) its own voice through your laptop speakers.
    # This is what makes headphones unnecessary -- the trade-off is you
    # can't interrupt DawnCast mid-sentence, you just wait for it to finish.
    agent_speaking = {"active": False}

    async with websockets.connect(URL, additional_headers=headers) as ws:
        await ws.send(json.dumps({
            "type": "session.update",
            "session": {
                "system_prompt": PROMPT,
                "greeting": "Hello Hasin. What's up?",
                "tools": TOOLS,
                "input": {
                    "format": {"encoding": "audio/pcm", "sample_rate": RATE},
                    "transcription_mode": "balanced",
                    "turn_detection": {
                        "vad_threshold": 0.5,
                        "min_silence": 1200,
                        "max_silence": 3500,
                        # Interruption is disabled on purpose -- with no
                        # headphones and no echo cancellation, any leaked
                        # audio could otherwise falsely "interrupt" DawnCast.
                        # The mic-mute below is the real fix; this is just
                        # a second layer of defense.
                        "interrupt_response": False,
                    },
                },
                "output": {
                    "voice": "alba",
                    "format": {"encoding": "audio/pcm", "sample_rate": RATE},
                },
            },
        }))

        def capture(indata, frames, time_info, status):
            if status:
                print(f"Audio input warning: {status}")
            if ready.is_set() and not agent_speaking["active"]:
                chunk = bytes(indata)
                try:
                    loop.call_soon_threadsafe(mic_queue.put_nowait, chunk)
                except asyncio.QueueFull:
                    pass

        async def send_microphone():
            while True:
                chunk = await mic_queue.get()
                await ws.send(json.dumps({
                    "type": "input.audio",
                    "audio": base64.b64encode(chunk).decode("ascii"),
                }))

        with sd.InputStream(
            samplerate=RATE, channels=1, dtype="int16",
            blocksize=1200, callback=capture,
        ), sd.OutputStream(
            samplerate=RATE, channels=1, dtype="int16",
        ) as speaker:
            mic_task = asyncio.create_task(send_microphone())
            print("DawnCast is starting. Mic auto-mutes while it speaks — no headphones needed. Press Ctrl+C to stop.")

            try:
                async for raw in ws:
                    event = json.loads(raw)
                    event_type = event.get("type")

                    if event_type == "session.ready":
                        ready.set()
                        print("DawnCast is listening.")

                    elif event_type == "reply.audio":
                        agent_speaking["active"] = True  # mute mic while this plays
                        audio = base64.b64decode(event["data"])
                        speaker.write(np.frombuffer(audio, dtype=np.int16))

                    elif event_type == "tool.call":
                        try:
                            if event.get("name") != "get_weather":
                                raise ValueError("Unknown tool")
                            args = event.get("arguments") or {}
                            result = await get_weather(args.get("location"))
                            pending_results.append({
                                "type": "tool.result",
                                "call_id": event["call_id"],
                                "result": json.dumps(result),
                                "is_error": False,
                            })
                        except Exception as exc:
                            pending_results.append({
                                "type": "tool.result",
                                "call_id": event["call_id"],
                                "result": json.dumps({
                                    "error": "Weather data is temporarily unavailable."
                                }),
                                "is_error": True,
                            })
                            print(f"Weather tool error: {exc}")

                    elif event_type == "reply.done":
                        if event.get("status") == "interrupted":
                            pending_results.clear()
                            speaker.abort()
                            speaker.start()
                        else:
                            while pending_results:
                                await ws.send(json.dumps(pending_results.pop(0)))

                        # DawnCast has finished speaking (or a tool call is
                        # about to run) -- unmute the mic and drop any
                        # residual audio that queued up while it was muted.
                        agent_speaking["active"] = False
                        while not mic_queue.empty():
                            mic_queue.get_nowait()

                    elif event_type == "transcript.user":
                        print(f"You: {event.get('text', '')}")

                    elif event_type == "transcript.agent":
                        print(f"DawnCast: {event.get('text', '')}")

                    elif event_type == "session.error":
                        print("Session error:", event.get("message", event))
            finally:
                mic_task.cancel()
                if ws.state.name == "OPEN":
                    await ws.send(json.dumps({"type": "session.end"}))


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nDawnCast stopped.")
    except Exception as exc:
        raise SystemExit(f"Error: {exc}")