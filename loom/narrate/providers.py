"""TTS providers. Each returns (samples float32 mono, sample_rate, char_alignment_or_None).

kokoro      local, free, offline (default). Models in <engine>/models/kokoro/.
openai      gpt-4o-mini-tts via OPENAI_API_KEY (no alignment; phoneme weighting used).
elevenlabs  ELEVENLABS_API_KEY; the with-timestamps endpoint gives character alignment.
"""
from __future__ import annotations

import base64
import io
import json
import os
import urllib.request
import wave
from pathlib import Path

import numpy as np

from ..util import ENGINE_ROOT, LoomError

KOKORO_DIR = ENGINE_ROOT / "models" / "kokoro"


class Provider:
    name = "base"
    version = "1"

    def synth(self, text: str, voice: dict):
        raise NotImplementedError

    def phonemizer(self):
        try:
            from kokoro_onnx.tokenizer import Tokenizer  # type: ignore
            tok = Tokenizer()
            return lambda w: tok.phonemize(w, "en-us")
        except Exception:
            return None


class Kokoro(Provider):
    name = "kokoro"
    version = "1.0"
    _k = None

    def _load(self):
        if Kokoro._k is None:
            try:
                from kokoro_onnx import Kokoro as K  # type: ignore
            except ImportError as e:
                raise LoomError("kokoro-onnx is not installed: py -m pip install kokoro-onnx soundfile") from e
            model = next((p for p in [KOKORO_DIR / "kokoro-v1.0.onnx", KOKORO_DIR / "kokoro-v1.0.int8.onnx", KOKORO_DIR / "kokoro-q8.onnx", KOKORO_DIR / "kokoro.onnx"] if p.exists()), None)
            voices = next((p for p in [KOKORO_DIR / "voices-v1.0.bin", KOKORO_DIR / "voices.npz"] if p.exists()), None)
            if not model or not voices:
                raise LoomError(f"Kokoro model files missing in {KOKORO_DIR}. Run: py -m loom setup voice")
            Kokoro._k = K(str(model), str(voices))
        return Kokoro._k

    def synth(self, text, voice):
        k = self._load()
        audio, sr = k.create(text, voice=voice.get("voice") or "af_heart", speed=float(voice.get("speed") or 1.0), lang=voice.get("lang") or "en-us")
        return np.asarray(audio, dtype=np.float32), sr, None


class OpenAITTS(Provider):
    name = "openai"
    version = "gpt-4o-mini-tts"

    def synth(self, text, voice):
        key = os.environ.get("OPENAI_API_KEY")
        if not key:
            raise LoomError("OPENAI_API_KEY is not set (voice.provider = openai)")
        body = {"model": voice.get("model") or "gpt-4o-mini-tts", "voice": voice.get("voice") or "alloy", "input": text,
                "response_format": "wav"}
        if voice.get("instructions"):
            body["instructions"] = voice["instructions"]
        req = urllib.request.Request("https://api.openai.com/v1/audio/speech", data=json.dumps(body).encode(),
                                     headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=120) as r:
            data = r.read()
        return _decode_wav(data) + (None,)


class ElevenLabs(Provider):
    name = "elevenlabs"
    version = "v1-ts"

    def synth(self, text, voice):
        key = os.environ.get("ELEVENLABS_API_KEY")
        if not key:
            raise LoomError("ELEVENLABS_API_KEY is not set (voice.provider = elevenlabs)")
        vid = voice.get("voice")
        if not vid:
            raise LoomError("voice.voice must be an ElevenLabs voice_id")
        body = {"text": text, "model_id": voice.get("model") or "eleven_multilingual_v2", "output_format": "pcm_24000"}
        req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{vid}/with-timestamps?output_format=pcm_24000",
                                     data=json.dumps(body).encode(), headers={"xi-api-key": key, "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=180) as r:
            res = json.loads(r.read())
        pcm = np.frombuffer(base64.b64decode(res["audio_base64"]), dtype=np.int16).astype(np.float32) / 32767
        al = res.get("alignment") or {}
        chars = [{"i": i, "c": c, "s": s, "e": e} for i, (c, s, e) in enumerate(zip(al.get("characters", []), al.get("character_start_times_seconds", []), al.get("character_end_times_seconds", [])))]
        # alignment is relative to untrimmed audio; trimming only removes leading silence below ~10 ms,
        # which is within tolerance, so the offsets are kept as-is.
        return pcm, 24000, chars or None


def _decode_wav(data: bytes):
    with wave.open(io.BytesIO(data), "rb") as w:
        sr = w.getframerate(); n = w.getnframes(); ch = w.getnchannels()
        x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32767
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1)
    return x, sr


_REG = {"kokoro": Kokoro, "openai": OpenAITTS, "elevenlabs": ElevenLabs}


def get(name: str) -> Provider:
    if name not in _REG:
        raise LoomError(f"unknown voice provider '{name}' (choose: {', '.join(_REG)})")
    return _REG[name]()
