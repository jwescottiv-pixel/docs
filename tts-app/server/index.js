import express from "express";
import cors from "cors";
import multer from "multer";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_turbo_v2_5";

app.get("/", (_req, res) => res.send("OK"));

app.post("/tts", async (req, res) => {
  try {
    const text = (req.body?.text || "").toString().trim();
    const voiceId = (req.body?.voiceId || process.env.ELEVENLABS_VOICE_ID || "").toString();
    console.log("VOICE ID RECEIVED:", req.body?.voiceId);
console.log("VOICE ID USED:", voiceId);
    if (!text) return res.status(400).json({ error: "Missing text" });
    if (!ELEVENLABS_API_KEY) return res.status(500).json({ error: "Missing ELEVENLABS_API_KEY" });
    if (!voiceId) return res.status(500).json({ error: "Missing voiceId" });

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
          "Accept": "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: MODEL_ID,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).send(err);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(audioBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.get("/voices", async (req, res) => {
  try {
    if (!ELEVENLABS_API_KEY)
      return res.status(500).json({ error: "Missing ELEVENLABS_API_KEY" });

    const r = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return res.status(r.status).json(data);
    }

    // Return a clean, UI-friendly shape
    const voices = (data?.voices || []).map((v) => ({
      voice_id: v.voice_id,
      name: v.name,
      category: v.category,
      description: v.description,
      labels: v.labels,
    }));

    res.json({ voices });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
console.log("FORMDATA TYPES:", typeof FormData, typeof Blob);
app.post("/clone", upload.single("file"), async (req, res) => {
  try {
    if (!ELEVENLABS_API_KEY) {
      return res.status(500).json({ error: "Missing ELEVENLABS_API_KEY" });
    }

    const file = req.file;
    const name = req.body?.name || "VoiceCandy Clone";

    if (!file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    const formData = new FormData();
    formData.append("name", name);
formData.append("files", file.buffer, {
  filename: file.originalname || "sample.wav",
  contentType: file.mimetype || "audio/mpeg",
});

    const response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    console.error("Clone error:", err);
    res.status(500).json({ error: "Clone failed" });
  }
});
app.listen(PORT, () => {
  console.log(`TTS server listening on port ${PORT}`);
});