'use client';

import React, { useEffect, useRef, useState } from 'react';

// Hazard abbreviation decoder
const HAZARD_ABBREVIATIONS_DICT = {
    TC: 'Tropical Cyclone',
    FL: 'Flash Flood & River Overflow',
    EQ: 'Earthquake Hazard',
    DR: 'Drought Threat',
    VO: 'Volcanic Activity',
    TS: 'Tsunami Warning',
    WF: 'Wildfire Hazard',
    'EXT-HEAT': 'Extreme Heatwave Advisory',
    'EXT-COLD': 'Severe Frost & Freeze Warning',
};

const USERNAME = 'Hasin';

// Small utility to get current time as string
const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// ─── Intent Classifier ─────────────────────────────────────────────────────────
// Returns a { type, city } object instead of hard-coded branches.
function classifyIntent(text) {
    const t = text.toLowerCase().trim();

    // Greetings
    if (/^(hi|hey|hello|good\s*(morning|afternoon|evening|night)|what'?s up|howdy|sup)\b/.test(t)) {
        return { type: 'greeting' };
    }

    // Small talk / how are you
    if (/how are you|how'?s it going|how do you feel|you okay|are you good/.test(t)) {
        return { type: 'smalltalk' };
    }

    // Thank you
    if (/^(thank(s| you)|cheers|awesome|great|perfect|cool|nice one|got it)/.test(t)) {
        return { type: 'thanks' };
    }

    // Help / what can you do
    if (/what can you do|help me|what are your features|commands/.test(t)) {
        return { type: 'help' };
    }

    // Umbrella / rain only
    if (/umbrella|rain|drizzle|raincoat|should i bring/.test(t) && !/weather|how is|check|city/.test(t)) {
        return { type: 'umbrella' };
    }

    // Too hot / too cold / temperature comfort
    if (/too hot|too cold|cold outside|warm outside|should i wear|jacket|coat|comfortable|feel outside/.test(t)) {
        return { type: 'comfort' };
    }

    // Hazard / alert / storm / disaster
    if (/hazard|alert|disaster|storm|danger|cyclone|flood|earthquake|tsunami|warning|abbreviation/.test(t)) {
        return { type: 'hazard' };
    }

    // City query — try known list first
    const knownCities = [
        'brooklyn', 'new york', 'liverpool', 'palermo', 'tokyo', 'sylhet',
        'london', 'paris', 'dhaka', 'san francisco', 'los angeles', 'berlin',
        'sydney', 'chicago', 'toronto', 'miami', 'seattle', 'singapore', 'dubai',
        'barcelona', 'rome', 'amsterdam', 'bangkok', 'jakarta', 'beijing', 'mumbai',
        'cairo', 'nairobi', 'moscow', 'istanbul', 'karachi', 'chittagong',
    ];

    for (const city of knownCities) {
        if (t.includes(city)) {
            return { type: 'city', city: city.charAt(0).toUpperCase() + city.slice(1) };
        }
    }

    // Generic "weather in X" or "check X" pattern
    const cityMatch = t.match(/(?:weather\s+(?:in|for|at)|check|show|search|what(?:'?s| is) it like in)\s+([a-z][\w\s,]{1,30}?)(?:\s*\?|$)/i);
    if (cityMatch && cityMatch[1]) {
        const candidate = cityMatch[1].replace(/please|now|today|this\s+week/gi, '').trim();
        if (candidate.length > 2) {
            return { type: 'city', city: candidate };
        }
    }

    // Full weather question for current location
    if (/weather|forecast|temperature|condition|how is it|what(?:'s| is) it like|outside/.test(t)) {
        return { type: 'weather' };
    }

    // Fallback — unrecognised
    return { type: 'unknown' };
}

// ─── Response Templates ────────────────────────────────────────────────────────
function greetingReply() {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const options = [
        `Good ${timeOfDay}, ${USERNAME}! I'm DawnCast, your live weather companion. Which city would you like a forecast for today?`,
        `Hey ${USERNAME}! Good to hear from you. Want me to pull up the weather for your current location, or somewhere else?`,
        `Hi ${USERNAME}! Ready to check conditions anywhere in the world. Just tell me the city and I'll have the full briefing for you.`,
    ];
    return options[Math.floor(Math.random() * options.length)];
}

function smallTalkReply() {
    const options = [
        `I'm doing great, ${USERNAME} — always monitoring skies around the world! What city are you curious about today?`,
        `All good here! Weather satellites are spinning nicely. Can I pull up a forecast for you?`,
        `Never better! I've got live data from every corner of the globe. What city can I check for you?`,
    ];
    return options[Math.floor(Math.random() * options.length)];
}

function thanksReply() {
    const options = [
        `Happy to help, ${USERNAME}! If you need anything else — another city, umbrella check, or hazard update — just say the word.`,
        `Anytime! Just ask if you want to check another location or anything else.`,
        `Of course! Feel free to ask about any city whenever you need.`,
    ];
    return options[Math.floor(Math.random() * options.length)];
}

function helpReply() {
    return `Sure, ${USERNAME}! Here's what you can ask me:\n• "How's the weather today?" — full local briefing with degrees, rain chance, and safety tips.\n• "Weather in Tokyo" — switch to any city worldwide.\n• "Should I take an umbrella?" — instant rain advice.\n• "Is it too hot or too cold?" — comfort and clothing tips.\n• "Any active hazards?" — disaster abbreviation alerts like TC (Typhoon) or FL (Flood).`;
}

function unknownReply(rawText) {
    const options = [
        `Hmm, I didn't quite catch that one, ${USERNAME}. I'm best at weather briefings — try asking something like "How's the weather in London?" or "Should I take an umbrella?"`,
        `Sorry, I'm not sure I understood that! I'm a weather assistant, so I work best with questions like "What's the temperature in Dubai?" or "Any storm warnings?"`,
        `Got that, but I'm not sure how to help with "${rawText}". Ask me about weather, forecasts, rain, or any city and I'll have an answer instantly!`,
    ];
    return options[Math.floor(Math.random() * options.length)];
}

function umbrellaReply(weatherData) {
    const rain = weatherData?.rain_probability_percent ?? 0;
    const cond = weatherData?.condition ?? '';
    const loc = weatherData?.location || 'your area';
    const hasRain = rain >= 35 || cond.toLowerCase().includes('rain') || cond.toLowerCase().includes('storm');

    if (hasRain) {
        return `Definitely take an umbrella today, ${USERNAME}! In ${loc}, there's a ${rain}% chance of rain with ${cond} skies. Better safe than soggy!`;
    } else if (rain >= 20) {
        return `It might be worth tossing one in your bag, ${USERNAME}. Rain probability is around ${rain}% in ${loc} — not likely but possible.`;
    } else {
        return `You should be fine without one today, ${USERNAME}! Rain probability in ${loc} is only ${rain}%. Enjoy the dry weather.`;
    }
}

function comfortReply(weatherData) {
    const temp = weatherData?.temperature_c ?? 20;
    const high = weatherData?.high_c ?? temp + 3;
    const low = weatherData?.low_c ?? temp - 4;
    const loc = weatherData?.location || 'your area';

    if (temp >= 32) {
        return `It's quite hot out in ${loc}, ${USERNAME} — ${temp}°C right now, peaking at ${high}°C today. I'd strongly recommend light, breathable clothing, sunscreen, and keeping water on you. Try to avoid being out in direct sun between noon and 3 PM.`;
    } else if (temp <= 5) {
        return `Bundle up tight, ${USERNAME}! It's ${temp}°C in ${loc} and dropping to ${low}°C. You'll want a heavy coat, gloves, and ideally a scarf. This is real coat weather!`;
    } else if (temp <= 14) {
        return `It's a bit chilly in ${loc} — ${temp}°C now, with a low of ${low}°C. A jacket or warm sweater should do the trick. Not freezing, but you'll feel it!`;
    } else {
        return `Pretty comfortable in ${loc}! It's ${temp}°C out, ranging from ${low}°C to ${high}°C today. A light layer might be nice in the evening, but overall it's a pleasant day.`;
    }
}

function hazardReply(weatherData) {
    const activeAlert = weatherData?.active_alert;
    const topAlert = weatherData?.alerts?.[0];
    const temp = weatherData?.temperature_c ?? 25;
    const loc = weatherData?.location || 'this area';

    let hazardCode = topAlert?.type;
    if (!hazardCode && activeAlert) hazardCode = 'FL';
    if (!hazardCode && temp >= 38) hazardCode = 'EXT-HEAT';
    if (!hazardCode && temp <= -5) hazardCode = 'EXT-COLD';

    if (hazardCode) {
        const fullName = HAZARD_ABBREVIATIONS_DICT[hazardCode] || 'Weather Hazard';
        const desc = topAlert?.description
            ? ` Here's what GDACS says: "${topAlert.description.slice(0, 160)}..."`
            : '';
        return `Heads up, ${USERNAME} — there is an active hazard logged for ${loc}. The code is ${hazardCode}, which stands for ${fullName}.${desc} Please stay informed and follow local authority guidance.`;
    } else {
        return `Good news, ${USERNAME}! All hazard monitors for ${loc} are currently green. No active Tropical Cyclone (TC), Flood (FL), Earthquake (EQ), or Tsunami (TS) alerts at this time. Stay safe!`;
    }
}

function weatherReply(locName, data) {
    const loc = locName || data?.location || 'your area';
    const temp = data?.temperature_c ?? 25;
    const cond = data?.condition ?? 'Clear';
    const subtitle = data?.condition_subtitle || '';
    const high = data?.high_c ?? temp + 4;
    const low = data?.low_c ?? temp - 5;
    const rain = data?.rain_probability_percent ?? 10;
    const humidity = data?.humidity ?? 65;
    const wind = data?.wind_speed_kmh ?? 10;
    const windDir = data?.wind_direction ?? 'North';

    // Comfort assessment
    let feel = '';
    if (temp >= 32) feel = `That's quite hot — I'd suggest staying cool and hydrated.`;
    else if (temp <= 5) feel = `That's freezing — please layer up warmly.`;
    else if (temp <= 14) feel = `A bit chilly — grab a jacket before heading out.`;
    else feel = `Pretty comfortable overall!`;

    // Umbrella line
    const umbrellaLine = rain >= 35 || cond.toLowerCase().includes('rain')
        ? `Bring an umbrella — rain probability is ${rain}%.`
        : rain >= 20
        ? `You might want to keep an umbrella handy, ${rain}% chance of rain.`
        : `No umbrella needed — only ${rain}% rain probability.`;

    return `Right now in ${loc} it's ${temp}°C with ${cond} skies${subtitle ? ` — ${subtitle}` : ''}. Today's high is ${high}°C and the low is ${low}°C. ${feel} Humidity is at ${humidity}% and winds are coming in from the ${windDir} at ${wind} km/h. ${umbrellaLine}`;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function VoiceAssistantDeck({
    currentLocation,
    weatherData,
    onCityChange,
    isMicActive,
    setIsMicActive,
    isSpeaking,
    setIsSpeaking,
}) {
    const [transcript, setTranscript] = useState('');
    const [conversation, setConversation] = useState([]);
    const [micVolume, setMicVolume] = useState(0);
    const [browserBlocked, setBrowserBlocked] = useState(false);
    const chatEndRef = useRef(null);

    const recognitionRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animFrameRef = useRef(null);
    const streamRef = useRef(null);
    const weatherDataRef = useRef(weatherData);
    const micActiveRef = useRef(isMicActive);
    const watchdogRef = useRef(null);    // restarts SR after silence / errors
    const srRunningRef = useRef(false);  // true while a SR session is live
    const speakEndTimeRef = useRef(0);   // timestamp when TTS last finished
    const speakTimerRef = useRef(null);  // safety timer to un-stick isSpeaking

    useEffect(() => { weatherDataRef.current = weatherData; }, [weatherData]);
    useEffect(() => { micActiveRef.current = isMicActive; }, [isMicActive]);

    // Auto-scroll conversation
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);

    // ── Speak aloud ──────────────────────────────────────────────────────────────
    const speakAloud = (text) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        clearTimeout(speakTimerRef.current);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.96;
        utterance.pitch = 1.02;
        utterance.volume = 1.0;

        // Estimate how long the speech will take (avg ~13 chars/sec)
        const maxSpeakMs = Math.max(4000, Math.ceil((text.length / 13) * 1000) + 2000);

        const markDone = () => {
            clearTimeout(speakTimerRef.current);
            speakEndTimeRef.current = Date.now(); // record when TTS finished
            setIsSpeaking(false);
        };

        const trySpeak = () => {
            const voices = window.speechSynthesis.getVoices();
            const pref = voices.find(
                (v) => v.name.includes('Natural') || v.name.includes('Samantha') ||
                    v.name.includes('Google UK English Female') || v.lang === 'en-US'
            );
            if (pref) utterance.voice = pref;
            setIsSpeaking(true);
            utterance.onend = markDone;
            utterance.onerror = markDone;
            window.speechSynthesis.speak(utterance);
            // SAFETY: if onend never fires (known browser bug), force-clear after maxSpeakMs
            speakTimerRef.current = setTimeout(markDone, maxSpeakMs);
        };

        if (window.speechSynthesis.getVoices().length) {
            trySpeak();
        } else {
            window.speechSynthesis.addEventListener('voiceschanged', trySpeak, { once: true });
        }
    };

    // ── Append message helper ─────────────────────────────────────────────────────
    const addMessage = (role, text) => {
        setConversation((prev) => [...prev, { role, text, time: nowTime() }]);
    };

    // ── Process voice command ─────────────────────────────────────────────────────
    const processVoiceCommand = (rawText) => {
        if (!rawText.trim()) return;

        addMessage('user', rawText);

        const intent = classifyIntent(rawText);

        if (intent.type === 'greeting') {
            const reply = greetingReply();
            addMessage('agent', reply);
            speakAloud(reply);
            return;
        }

        if (intent.type === 'smalltalk') {
            const reply = smallTalkReply();
            addMessage('agent', reply);
            speakAloud(reply);
            return;
        }

        if (intent.type === 'thanks') {
            const reply = thanksReply();
            addMessage('agent', reply);
            speakAloud(reply);
            return;
        }

        if (intent.type === 'help') {
            const reply = helpReply();
            addMessage('agent', reply);
            speakAloud(reply);
            return;
        }

        if (intent.type === 'umbrella') {
            const reply = umbrellaReply(weatherDataRef.current);
            addMessage('agent', reply);
            speakAloud(reply);
            return;
        }

        if (intent.type === 'comfort') {
            const reply = comfortReply(weatherDataRef.current);
            addMessage('agent', reply);
            speakAloud(reply);
            return;
        }

        if (intent.type === 'hazard') {
            const reply = hazardReply(weatherDataRef.current);
            addMessage('agent', reply);
            speakAloud(reply);
            return;
        }

        if (intent.type === 'city') {
            const city = intent.city;
            // First acknowledge naturally
            const ack = `Sure, ${USERNAME}! Let me pull up the latest conditions for ${city}...`;
            addMessage('agent', ack);
            speakAloud(ack);
            onCityChange(city);

            fetch(`/api/weather?location=${encodeURIComponent(city)}`)
                .then((r) => r.json())
                .then((freshData) => {
                    const reply = weatherReply(city, freshData);
                    addMessage('agent', reply);
                    speakAloud(reply);
                })
                .catch(() => {
                    const reply = weatherReply(city, weatherDataRef.current);
                    addMessage('agent', reply);
                    speakAloud(reply);
                });
            return;
        }

        if (intent.type === 'weather') {
            const ack = `Sure, let me check conditions for ${weatherDataRef.current?.location || currentLocation || 'your area'}...`;
            addMessage('agent', ack);
            speakAloud(ack);
            fetch(`/api/weather?location=${encodeURIComponent(weatherDataRef.current?.location || 'Dhaka')}`)
                .then((r) => r.json())
                .then((freshData) => {
                    const reply = weatherReply(freshData.location, freshData);
                    addMessage('agent', reply);
                    speakAloud(reply);
                })
                .catch(() => {
                    const reply = weatherReply(weatherDataRef.current?.location, weatherDataRef.current);
                    addMessage('agent', reply);
                    speakAloud(reply);
                });
            return;
        }

        // Unknown / off-topic
        const reply = unknownReply(rawText);
        addMessage('agent', reply);
        speakAloud(reply);
    };

    // ── Microphone start ──────────────────────────────────────────────────────────
    const startMic = async () => {
        try {
            setBrowserBlocked(false);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const audioCtx = new AudioContext();
                audioContextRef.current = audioCtx;
                const source = audioCtx.createMediaStreamSource(stream);
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 64;
                source.connect(analyser);
                analyserRef.current = analyser;

                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                const tick = () => {
                    if (!analyserRef.current) return;
                    analyserRef.current.getByteFrequencyData(dataArray);
                    const avg = dataArray.reduce((s, v) => s + v, 0) / dataArray.length;
                    setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
                    animFrameRef.current = requestAnimationFrame(tick);
                };
                tick();
            }

            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SR) {
                addMessage('agent', `Your browser doesn't support live speech recognition, ${USERNAME}. Use Chrome or Edge for the full voice experience. You can still use the quick-tap prompts below!`);
            } else {
                // ── Robust SR restart engine ────────────────────────────────────
                const launchSR = () => {
                    if (!micActiveRef.current || srRunningRef.current) return;
                    // Brief post-speech pause (800ms) so we don't capture TTS echo.
                    // We use a timestamp check instead of blocking on isSpeaking state,
                    // which can get permanently stuck if the browser's onend never fires.
                    const msSinceSpeak = Date.now() - speakEndTimeRef.current;
                    if (msSinceSpeak < 800) {
                        watchdogRef.current = setTimeout(launchSR, 800 - msSinceSpeak);
                        return;
                    }

                    const recognition = new SR();
                    recognition.continuous = false; // false = more reliable across browsers
                    recognition.interimResults = true;
                    recognition.maxAlternatives = 1;
                    recognition.lang = 'en-US';

                    recognition.onstart = () => {
                        srRunningRef.current = true;
                        // Watchdog: if no result arrives in 12s, force restart
                        clearTimeout(watchdogRef.current);
                        watchdogRef.current = setTimeout(() => {
                            try { recognition.stop(); } catch {}
                        }, 12000);
                    };

                    recognition.onresult = (event) => {
                        clearTimeout(watchdogRef.current);
                        let finalStr = '';
                        let interimStr = '';
                        for (let i = event.resultIndex; i < event.results.length; ++i) {
                            if (event.results[i].isFinal) {
                                finalStr += event.results[i][0].transcript;
                            } else {
                                interimStr += event.results[i][0].transcript;
                            }
                        }
                        setTranscript(interimStr || finalStr);
                        if (finalStr.trim()) {
                            processVoiceCommand(finalStr.trim());
                            setTranscript('');
                        }
                    };

                    recognition.onerror = (e) => {
                        clearTimeout(watchdogRef.current);
                        srRunningRef.current = false;
                        // 'no-speech' and 'aborted' are normal — just restart.
                        // 'network' means a momentary blip — restart after a brief delay.
                        // 'not-allowed' is a permissions error — bail out.
                        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                            setBrowserBlocked(true);
                            setIsMicActive(false);
                            return;
                        }
                        const delay = e.error === 'network' ? 2000 : 200;
                        if (micActiveRef.current) {
                            watchdogRef.current = setTimeout(launchSR, delay);
                        }
                    };

                    recognition.onend = () => {
                        clearTimeout(watchdogRef.current);
                        srRunningRef.current = false;
                        setTranscript('');
                        // Immediately restart unless mic was deliberately stopped
                        if (micActiveRef.current) {
                            // Small gap avoids browser-level "already started" errors
                            watchdogRef.current = setTimeout(launchSR, 120);
                        }
                    };

                    try {
                        recognition.start();
                        recognitionRef.current = recognition;
                    } catch (startErr) {
                        srRunningRef.current = false;
                        if (micActiveRef.current) watchdogRef.current = setTimeout(launchSR, 400);
                    }
                };

                launchSR();
            }

            setIsMicActive(true);

            // Friendly greeting after mic starts
            setTimeout(() => {
                const hour = new Date().getHours();
                const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
                const greeting = `Good ${timeOfDay}, ${USERNAME}! I'm DawnCast, your personal weather assistant. What's your current location, or would you like me to check somewhere specific?`;
                addMessage('agent', greeting);
                speakAloud(greeting);
            }, 800);

        } catch (err) {
            console.warn('Mic blocked:', err);
            setBrowserBlocked(true);
            setIsMicActive(false);
            addMessage('agent', `Hey ${USERNAME} — it looks like microphone access was blocked. You can still use the quick-tap prompts below, or grant mic permission and click "Activate Mic" to talk over!`);
        }
    };

    const stopMic = () => {
        clearTimeout(watchdogRef.current);
        micActiveRef.current = false; // Set before stopping so launchSR doesn't restart
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch {}
            recognitionRef.current = null;
        }
        srRunningRef.current = false;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current) {
            try { audioContextRef.current.close(); } catch {}
            audioContextRef.current = null;
        }
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        analyserRef.current = null;
        setIsMicActive(false);
        setMicVolume(0);
        setTranscript('');

        const msg = `Microphone is now off. Tap "Activate Mic" any time to start talking again, ${USERNAME}.`;
        addMessage('agent', msg);
    };

    useEffect(() => {
        startMic();
        return () => {
            clearTimeout(watchdogRef.current);
            clearTimeout(speakTimerRef.current);
            micActiveRef.current = false;
            if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} }
            if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
            if (audioContextRef.current) { try { audioContextRef.current.close(); } catch {} }
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, []);

    // Derived status label shown under the header
    const srStatusLabel = () => {
        if (!isMicActive) return 'Microphone is off — tap "Activate Mic" to speak';
        if (isSpeaking) return '🔊 DawnCast is speaking — listening will resume automatically';
        if (transcript) return `🎙️ Hearing: "${transcript}"`;
        return '🎙️ Listening — say anything whenever you\'re ready';
    };

    // ─── Render ─────────────────────────────────────────────────────────────────
    return (
        <section
            id="voice-section"
            className="glass-panel scroll-reveal"
            style={{
                padding: '32px',
                marginTop: '32px',
                borderRadius: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                        style={{
                            width: '42px', height: '42px', borderRadius: '50%',
                            backgroundColor: isMicActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            border: isMicActive ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isMicActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                            boxShadow: isMicActive ? '0 0 20px rgba(56, 189, 248, 0.3)' : 'none',
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                            DawnCast Voice Assistant
                        </h3>
                        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                            {srStatusLabel()}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {browserBlocked && (
                        <span style={{ fontSize: '0.78rem', color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                            ⚠️ Grant mic permission below
                        </span>
                    )}
                    <button
                        onClick={isMicActive ? stopMic : startMic}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                            borderRadius: '30px',
                            backgroundColor: isMicActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.18)',
                            border: isMicActive ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(56, 189, 248, 0.4)',
                            color: isMicActive ? '#ef4444' : '#38bdf8',
                            fontSize: '0.86rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease',
                        }}
                    >
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isMicActive ? '#22c55e' : '#ef4444', boxShadow: isMicActive ? '0 0 8px #22c55e' : 'none' }} />
                        {isMicActive ? 'Mute Microphone' : 'Activate Mic'}
                    </button>
                </div>
            </div>

            {/* Audio Spectrum Visualizer */}
            <div
                style={{
                    backgroundColor: 'rgba(12, 14, 18, 0.6)', borderRadius: '20px', padding: '18px 24px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, height: '40px' }}>
                    {Array.from({ length: 36 }).map((_, i) => {
                        const h = isMicActive ? Math.max(4, Math.min(36, micVolume * (0.3 + (i % 7) * 0.1))) : 4;
                        return (
                            <div key={i} style={{
                                flex: 1, height: `${h}px`,
                                backgroundColor: isSpeaking ? `hsl(${270 + i * 2}, 80%, 65%)` : isMicActive && micVolume > 8 ? `hsl(${200 + i}, 80%, 55%)` : 'rgba(255,255,255,0.1)',
                                borderRadius: '3px', transition: 'height 0.07s ease, background-color 0.3s ease',
                            }} />
                        );
                    })}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', gap: '6px', alignItems: 'center', whiteSpace: 'nowrap' }}>
                    {isSpeaking ? '🔊 DawnCast speaking' : isMicActive ? '🎙️ Mic active' : '🔇 Muted'}
                    <span style={{ color: '#38bdf8', fontWeight: '700', minWidth: '34px' }}>{micVolume}%</span>
                </div>
            </div>

            {/* Conversation Thread */}
            <div
                style={{
                    display: 'flex', flexDirection: 'column', gap: '10px',
                    maxHeight: '340px', overflowY: 'auto', paddingRight: '6px',
                }}
            >
                {conversation.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem', padding: '24px 0' }}>
                        Starting up DawnCast…
                    </div>
                )}

                {conversation.map((msg, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div
                            style={{
                                maxWidth: '82%',
                                padding: '12px 18px',
                                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                backgroundColor: msg.role === 'user' ? 'rgba(56, 189, 248, 0.14)' : 'rgba(255, 255, 255, 0.05)',
                                border: msg.role === 'user' ? '1px solid rgba(56, 189, 248, 0.28)' : '1px solid rgba(255, 255, 255, 0.07)',
                                color: '#ffffff',
                                fontSize: '0.9rem', lineHeight: 1.56,
                            }}
                        >
                            <div style={{ fontSize: '0.7rem', color: msg.role === 'user' ? '#38bdf8' : 'rgba(255,255,255,0.45)', marginBottom: '5px', fontWeight: '600', letterSpacing: '0.02em' }}>
                                {msg.role === 'user' ? `You • ${msg.time}` : `DawnCast • ${msg.time}`}
                            </div>
                            {msg.text.split('\n').map((line, i) => (
                                <div key={i}>{line}</div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Interim transcript bubble */}
                {transcript && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ padding: '9px 15px', borderRadius: '14px', backgroundColor: 'rgba(56, 189, 248, 0.07)', border: '1px dashed rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '0.85rem', fontStyle: 'italic' }}>
                            &quot;{transcript}&quot;
                        </div>
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* Quick Prompt Suggestions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', flexShrink: 0 }}>Quick ask:</span>
                {[
                    'Hi DawnCast!',
                    'How\'s the weather today?',
                    'Should I take an umbrella?',
                    'Is it too hot or too cold?',
                    'Any active hazards?',
                    'Weather in Tokyo, Japan',
                    'Check Palermo, Italy',
                ].map((prompt, idx) => (
                    <button
                        key={idx}
                        onClick={() => processVoiceCommand(prompt)}
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.82)', padding: '6px 14px', borderRadius: '14px',
                            fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
                    >
                        {prompt}
                    </button>
                ))}
            </div>
        </section>
    );
}
