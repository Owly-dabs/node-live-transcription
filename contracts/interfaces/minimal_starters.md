> Temp file to be use for feature decisions for Starter Contracts

---
## Minimal Functionality STT > DONE

### Auth
- Can authorize with API key
- Request URL
- Request File

---
## Minimal Functionality TTS > DONE

### Auth
- Authorize with API key

## Minimal Query Params
- model

## can send text
-  Request Text

---
## Minimal Query Params Text Intelligence > DONE

### Auth
- Authorize with API key

## Minimal Query Params
- language: Defaults to EN
- summarize only

## can send text or URL
 - Request Text

---
## Minimal Functionality STT LIVE > DONE

### Auth
- Can authorize with API key

## Minimal Query Params
- language: Defaults to EN
- model:  Defaults to Nova-3

### Can send containerized audio from a live stream
- "stream_url": "http://stream.live.vc.bbcmedia.co.uk/bbc_world_service"

---
## Minimal Functionality TTS LIVE > DONE

## Minimal Functionaity Flux > DONE

### Auth
- Can authorize with API key

### Minimal Query Params
- Model, Defaults to flux-general-en

### Can send audio from a live stream
- "stream_url": "http://stream.live.vc.bbcmedia.co.uk/bbc_world_service"

## Minimal Functionality Agent > WIP

### 1. Message Type
- `type`: Must be set to `"Settings"`

### 2. Audio Configuration
- **Input audio settings:**
  - `audio.input.encoding`: Audio encoding format (e.g., `"linear16"`)
  - `audio.input.sample_rate`: Sample rate in Hz (e.g., `24000`)

- **Output audio settings:**
  - `audio.output.encoding`: Output audio encoding format
  - `audio.output.sample_rate`: Output sample rate in Hz
  - `audio.output.container`: Container format (defaults to `"none"`)

### 3. Agent Configuration
- **Listen (Speech-to-Text):**
  - `agent.listen.provider.type`: Currently only `"deepgram"` is supported
  - `agent.listen.provider.model`: The [Deepgram STT model](https://developers.deepgram.com/docs/voice-agent-media-inputs-outputs) (e.g., `"nova-3"`)

- **Think (LLM):**
  - `agent.think.provider.type`: The [LLM provider](https://developers.deepgram.com/docs/voice-agent-llm-models) (e.g., `"open_ai"`)
  - `agent.think.provider.model`: The LLM model (e.g., `"gpt-4o-mini"`)

- **Speak (Text-to-Speech):**
  - `agent.speak.provider.type`: The [TTS provider](https://developers.deepgram.com/docs/voice-agent-settings) (e.g., `"deepgram"`)
  - `agent.speak.provider.model`: The TTS model (e.g., `"aura-2-thalia-en"`)
