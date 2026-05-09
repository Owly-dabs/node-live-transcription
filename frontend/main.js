/**
 * Live Transcription Frontend
 * Connects to backend WebSocket proxy for Deepgram Live Transcription
 * Uses microphone for audio input
 */

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

const SESSION_ENDPOINT = 'api/session';
let sessionToken = null;

async function getSessionToken() {
  if (sessionToken) return sessionToken;
  const response = await fetch(SESSION_ENDPOINT);
  if (!response.ok) throw new Error(`Session failed: ${response.status}`);
  const data = await response.json();
  sessionToken = data.token;
  return sessionToken;
}

// ============================================================================
// STATE MANAGEMENT (continued)
// ============================================================================

const state = {
  ws: null,
  isConnected: false,
  audioContext: null,
  mediaStream: null,
  audioProcessor: null,
  stats: {
    messages: 0,
    finals: 0
  },
  config: {
    model: 'nova-3',
    language: 'en',
    channels: 1,
    multichannel: false
  }
};

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const elements = {
  // Metadata
  pageTitle: document.getElementById('pageTitle'),
  pageDescription: document.getElementById('pageDescription'),
  headerTitle: document.getElementById('headerTitle'),
  repoLink: document.getElementById('repoLink'),

  // Config
  modelSelect: document.getElementById('model-select'),
  languageInput: document.getElementById('language-input'),
  channelsSelect: document.getElementById('channels-select'),
  multichannelCheckbox: document.getElementById('multichannel-checkbox'),

  // UI controls
  connectOverlay: document.getElementById('connect-overlay'),
  connectBtn: document.getElementById('connect-btn'),
  disconnectContainer: document.getElementById('disconnect-container'),
  disconnectBtn: document.getElementById('disconnect-btn'),

  // Transcript feeds
  transcriptFeeds: document.getElementById('transcript-feeds'),
  transcriptFeed1: document.getElementById('transcript-feed-1'),
  transcriptFeedItems: [
    document.getElementById('transcript-feed-items-0'),
    document.getElementById('transcript-feed-items-1'),
  ],
  emptyStates: [
    document.getElementById('empty-state-0'),
    document.getElementById('empty-state-1'),
  ],

  // Status
  connectionStatus: document.getElementById('connection-status'),
  micStatus: document.getElementById('mic-status'),
  currentModel: document.getElementById('current-model'),
  currentLanguage: document.getElementById('current-language'),
  messageCount: document.getElementById('message-count'),
  finalCount: document.getElementById('final-count')
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  loadMetadata();
});

function initializeEventListeners() {
  elements.connectBtn.addEventListener('click', connect);
  elements.disconnectBtn.addEventListener('click', disconnect);

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    disconnect();
  });
}

// ============================================================================
// METADATA LOADING
// ============================================================================

async function loadMetadata() {
  try {
    const response = await fetch('api/metadata');
    if (!response.ok) {
      console.warn('Failed to load metadata, using defaults');
      return;
    }

    const metadata = await response.json();

    // Update page title
    if (metadata.title && elements.pageTitle) {
      elements.pageTitle.textContent = metadata.title;
    }

    // Update page description
    if (metadata.description && elements.pageDescription) {
      elements.pageDescription.setAttribute('content', metadata.description);
    }

    // Update header title
    if (metadata.title && elements.headerTitle) {
      elements.headerTitle.textContent = metadata.title;
    }

    // Update repository link
    if (metadata.repository && elements.repoLink) {
      elements.repoLink.href = metadata.repository;
    }

    console.log('Metadata loaded:', metadata);
  } catch (error) {
    console.warn('Error loading metadata, using defaults:', error);
  }
}

// ============================================================================
// WEBSOCKET CONNECTION
// ============================================================================

async function connect() {
  if (state.isConnected) return;

  // Get configuration
  state.config.model = elements.modelSelect.value;
  state.config.language = elements.languageInput.value;
  state.config.channels = parseInt(elements.channelsSelect.value, 10);
  state.config.multichannel = elements.multichannelCheckbox.checked;

  // Update UI
  elements.connectBtn.disabled = true;
  // Clear and set button content safely
  while (elements.connectBtn.firstChild) {
    elements.connectBtn.removeChild(elements.connectBtn.firstChild);
  }
  const spinner = document.createElement('i');
  spinner.className = 'fa-solid fa-spinner fa-spin';
  elements.connectBtn.appendChild(spinner);
  elements.connectBtn.appendChild(document.createTextNode(' Connecting...'));

  try {
    // Get session token for WebSocket auth
    const token = await getSessionToken();

    // Init AudioContext and request mic HERE, while still in the user-gesture
    // call stack. iOS WebKit (used by all iPad browsers) silently blocks both
    // AudioContext.resume() and getUserMedia() if they're called after an async
    // break that leaves the user-gesture context (e.g. inside a WebSocket open
    // handler). The permission dialog will never appear in that case.
    await initializeAudioContext();
    await startMicrophone();

    // Build WebSocket URL using the AudioContext's actual sample rate.
    // Forcing sampleRate:16000 in the constructor is unreliable on iOS WebKit;
    // the context falls back to the device's native rate (44100/48000).
    const params = new URLSearchParams({
      model: state.config.model,
      language: state.config.language,
      encoding: 'linear16',
      sample_rate: state.audioContext.sampleRate.toString(),
      channels: state.config.channels.toString(),
      multichannel: state.config.multichannel.toString()
    });
    const wsUrl = new URL(`api/live-transcription?${params}`, document.baseURI);
    wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:';

    console.log('Connecting with params:', {
      model: state.config.model,
      language: state.config.language,
      encoding: 'linear16',
      sample_rate: state.audioContext.sampleRate,
      channels: state.config.channels,
      multichannel: state.config.multichannel
    });

    // Create WebSocket with JWT auth via subprotocol
    state.ws = new WebSocket(wsUrl.href, [`access_token.${token}`]);
    state.ws.binaryType = 'arraybuffer';

    state.ws.onopen = handleWebSocketOpen;
    state.ws.onmessage = handleWebSocketMessage;
    state.ws.onclose = handleWebSocketClose;
    state.ws.onerror = handleWebSocketError;

  } catch (error) {
    console.error('Connection error:', error);
    const msg = (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')
      ? 'Microphone access denied. Please allow microphone access and try again.'
      : (error.name === 'NotSupportedError' || !navigator.mediaDevices)
      ? 'Microphone requires HTTPS. Access this page via https:// — see console for setup steps.'
      : 'Failed to connect to server';
    if (error.name === 'NotSupportedError' || !navigator.mediaDevices) {
      console.error(
        'HTTPS is required for microphone access on non-localhost origins.\n' +
        'Quick setup with mkcert:\n' +
        '  brew install mkcert          # or: apt install mkcert\n' +
        '  mkcert -install\n' +
        '  cd /home/owly/Documents/node-live-transcription/frontend\n' +
        '  mkdir -p certs && cd certs\n' +
        '  mkcert 192.168.1.29 localhost 127.0.0.1\n' +
        '  mv 192.168.1.29+2.pem cert.pem && mv 192.168.1.29+2-key.pem key.pem\n' +
        'Then install the root CA on your iPad:\n' +
        '  AirDrop $(mkcert -CAROOT)/rootCA.pem to iPad → Settings → trust it\n' +
        'Vite will pick up the certs automatically on next restart.'
      );
    }
    showError(msg);
    disconnect();
    resetConnectButton();
  }
}

function handleWebSocketOpen() {
  console.log('WebSocket connected');
  onConnected();
}

function handleWebSocketMessage(event) {
   try {
     const data = JSON.parse(event.data);

     // Log raw data from Deepgram for debugging
     console.log('Deepgram message:', data);

     // Update message count
     state.stats.messages++;
     elements.messageCount.textContent = state.stats.messages;

     // Handle different message types from Deepgram
     if (data.type === 'Results' || data.channel) {
       const isFinal = data.is_final || data.speech_final || false;

       // Streaming multichannel: Deepgram sends one message per channel, each with
       // channel_index: [currentChannel, totalChannels]. This differs from the
       // pre-recorded API which uses a channels[] array in a single response.
       if (data.channel_index && Array.isArray(data.channel_index)) {
         const transcript = data.channel?.alternatives?.[0]?.transcript || '';
         if (transcript) {
           addTranscriptItem(transcript, isFinal, data.channel_index);
         }
       } else {
         // Single channel response
         const transcript = data.channel?.alternatives?.[0]?.transcript || data.transcript || '';
         if (transcript) {
           addTranscriptItem(transcript, isFinal, null);
         }
       }
     } else if (data.type === 'Metadata') {
       console.log('Metadata:', data);
     } else if (data.error) {
       console.error('Deepgram error:', data);
     }
   } catch (error) {
     console.error('Error parsing message:', error);
   }
}

function handleWebSocketError(error) {
  console.error('WebSocket error:', error);
  updateConnectionStatus(false, 'Error');
}

function handleWebSocketClose(event) {
  console.log('WebSocket closed:', event.code, event.reason);
  state.isConnected = false;

  // Handle session expiry
  if (event.code === 4401) {
    sessionToken = null;
    showError('Session expired, please refresh the page.');
    updateConnectionStatus(false, 'Session Expired');
    updateMicrophoneStatus(false);
    return;
  }

  updateConnectionStatus(false, 'Disconnected');
  updateMicrophoneStatus(false);

  // Show reconnect UI after delay
  setTimeout(() => {
    if (!state.isConnected) {
      elements.transcriptFeeds.classList.add('hidden');
      elements.disconnectContainer.classList.add('hidden');
      elements.connectOverlay.classList.remove('hidden');
      resetConnectButton();
    }
  }, 2000);
}

// ============================================================================
// CONNECTION LIFECYCLE
// ============================================================================

function onConnected() {
  console.log('WebSocket connected — audio already active');

  // Activating isConnected lets the onaudioprocess handler start sending.
  state.isConnected = true;

  elements.currentModel.textContent = state.config.model;
  elements.currentLanguage.textContent = state.config.language;

  elements.connectOverlay.classList.add('hidden');
  elements.disconnectContainer.classList.remove('hidden');
  elements.transcriptFeeds.classList.remove('hidden');
  if (state.config.multichannel) {
    elements.transcriptFeeds.classList.add('transcript-feeds--multichannel');
    elements.transcriptFeed1.classList.remove('hidden');
  } else {
    elements.transcriptFeeds.classList.remove('transcript-feeds--multichannel');
    elements.transcriptFeed1.classList.add('hidden');
  }

  updateConnectionStatus(true, 'Connected');
  updateMicrophoneStatus(true);
  console.log('Fully connected — microphone active, ready to transcribe');
}

function disconnect() {
  // Close WebSocket
  if (state.ws) {
    state.ws.close(1000, 'User disconnected');
    state.ws = null;
  }

  // Stop microphone and audio processor
  if (state.audioProcessor) {
    state.audioProcessor.disconnect();
    state.audioProcessor = null;
  }

  if (state.mediaStream) {
    state.mediaStream.getTracks().forEach(track => track.stop());
    state.mediaStream = null;
  }

  state.isConnected = false;

  // Update UI
  updateConnectionStatus(false, 'Disconnected');
  updateMicrophoneStatus(false);
  elements.currentModel.textContent = '-';
  elements.currentLanguage.textContent = '-';

  // Re-enable config
  elements.modelSelect.disabled = false;
  elements.languageInput.disabled = false;

  // Show connect overlay
  elements.transcriptFeeds.classList.add('hidden');
  elements.disconnectContainer.classList.add('hidden');
  elements.connectOverlay.classList.remove('hidden');
  resetConnectButton();
}

function resetConnectButton() {
  elements.connectBtn.disabled = false;
  // Clear and set button content safely
  while (elements.connectBtn.firstChild) {
    elements.connectBtn.removeChild(elements.connectBtn.firstChild);
  }
  const icon = document.createElement('i');
  icon.className = 'fa-solid fa-plug';
  elements.connectBtn.appendChild(icon);
  elements.connectBtn.appendChild(document.createTextNode(' Connect'));
}

// ============================================================================
// AUDIO CONTEXT
// ============================================================================

async function initializeAudioContext() {
  if (state.audioContext) return;

  // Don't force sampleRate — iOS WebKit ignores or rejects unsupported values.
  // We read audioContext.sampleRate after creation and forward it to Deepgram.
  state.audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // iOS WebKit starts AudioContext suspended; resume must happen within the
  // user-gesture call stack, so this must be called from connect(), not later.
  if (state.audioContext.state === 'suspended') {
    await state.audioContext.resume();
  }

  console.log(`Audio context initialized: ${state.audioContext.sampleRate}Hz`);
}

// ============================================================================
// MICROPHONE CAPTURE
// ============================================================================

async function startMicrophone() {
  if (state.mediaStream) {
    console.log('Microphone already active');
    return;
  }

  updateMicrophoneStatus('Requesting...');
  console.log('Requesting microphone access...');

   if (!navigator.mediaDevices) {
     const err = new Error('Microphone API unavailable — page must be served over HTTPS or on localhost');
     err.name = 'NotSupportedError';
     throw err;
   }

   // echoCancellation, noiseSuppression, and autoGainControl force the browser
   // to collapse audio to mono. Disable them for multichannel so each physical
   // mic capsule stays on its own channel.
   const mono = state.config.channels === 1;
   state.mediaStream = await navigator.mediaDevices.getUserMedia({
     audio: {
       channelCount: state.config.channels,
       echoCancellation: mono,
       noiseSuppression: mono,
       autoGainControl: mono,
     },
   });

  const track = state.mediaStream.getAudioTracks()[0];
  const settings = track.getSettings();
  console.log('Microphone granted:', {
    label: track.label,
    channelCount: settings.channelCount,
    sampleRate: settings.sampleRate,
    echoCancellation: settings.echoCancellation,
    noiseSuppression: settings.noiseSuppression,
    autoGainControl: settings.autoGainControl,
  });

  // Create audio processing pipeline
  if (!state.audioContext) {
    await initializeAudioContext();
  }

   const source = state.audioContext.createMediaStreamSource(state.mediaStream);
   state.audioProcessor = state.audioContext.createScriptProcessor(
     4096,
     state.config.channels,  // input channels
     state.config.channels   // output channels — MATCH input to avoid downmix
   );

   let audioChunkCount = 0;
   state.audioProcessor.onaudioprocess = (e) => {
     if (!state.isConnected) return;

      // Convert float32 audio to int16 PCM, interleaved for multichannel
      const numChannels = state.config.channels;
      const channelData = [];
      for (let ch = 0; ch < numChannels; ch++) {
        channelData.push(e.inputBuffer.getChannelData(ch));
      }
      const numSamples = channelData[0].length;
     const pcm16 = new Int16Array(numSamples * numChannels);

     for (let i = 0; i < numSamples; i++) {
       for (let ch = 0; ch < numChannels; ch++) {
         const s = Math.max(-1, Math.min(1, channelData[ch][i]));
         const idx = i * numChannels + ch;
         pcm16[idx] = s < 0 ? s * 0x8000 : s * 0x7FFF;
       }
     }

    // Send binary audio to WebSocket
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      try {
        state.ws.send(pcm16.buffer);
        audioChunkCount++;
        if (audioChunkCount === 1) {
          console.log(`✓ First audio chunk sent (${pcm16.buffer.byteLength} bytes)`);
        } else if (audioChunkCount % 50 === 0) {
          console.log(`Sent ${audioChunkCount} audio chunks to server`);
        }
      } catch (error) {
        console.error('Error sending audio chunk:', error);
      }
    }
  };

  source.connect(state.audioProcessor);
  state.audioProcessor.connect(state.audioContext.destination);

  console.log('Audio processing pipeline connected');

  // Update status
  updateMicrophoneStatus(true);
  console.log('Microphone active - ready to transcribe');
}

// ============================================================================
// UI UPDATES
// ============================================================================

function updateConnectionStatus(connected, text) {
  elements.connectionStatus.className = connected
    ? 'status-badge status-badge--connected'
    : 'status-badge status-badge--disconnected';

  // Clear existing content
  while (elements.connectionStatus.firstChild) {
    elements.connectionStatus.removeChild(elements.connectionStatus.firstChild);
  }

  // Add indicator
  const indicator = document.createElement('span');
  indicator.className = connected
    ? 'status-indicator status-indicator--connected'
    : 'status-indicator status-indicator--disconnected';
  elements.connectionStatus.appendChild(indicator);

  // Add text
  elements.connectionStatus.appendChild(document.createTextNode(text));
}

function updateMicrophoneStatus(active) {
  if (active === true) {
    elements.micStatus.textContent = 'Active';
    elements.micStatus.style.color = 'var(--dg-primary, #13ef95)';
  } else if (active === false) {
    elements.micStatus.textContent = 'Inactive';
    elements.micStatus.style.color = '';
  } else {
    // String value (e.g., "Requesting...")
    elements.micStatus.textContent = active;
    elements.micStatus.style.color = '';
  }
}

function addTranscriptItem(text, isFinal, channelIndex) {
  const feedIdx = (channelIndex && Array.isArray(channelIndex)) ? channelIndex[0] : 0;
  const feedItems = elements.transcriptFeedItems[feedIdx] ?? elements.transcriptFeedItems[0];
  const emptyState = elements.emptyStates[feedIdx] ?? elements.emptyStates[0];

  if (emptyState && !emptyState.classList.contains('hidden')) {
    emptyState.classList.add('hidden');
  }

  const item = document.createElement('div');
  item.className = isFinal ? 'transcript-item' : 'transcript-item transcript-item--interim';

  const timestamp = document.createElement('div');
  timestamp.className = 'transcript-item__timestamp';
  timestamp.textContent = new Date().toLocaleTimeString();
  item.appendChild(timestamp);

  const textDiv = document.createElement('div');
  textDiv.className = 'transcript-item__text';
  textDiv.textContent = text;
  item.appendChild(textDiv);

  const lastItem = feedItems.lastElementChild;
  if (!isFinal && lastItem && lastItem !== emptyState && lastItem.classList.contains('transcript-item--interim')) {
    feedItems.replaceChild(item, lastItem);
  } else {
    feedItems.appendChild(item);
  }

  feedItems.scrollTop = feedItems.scrollHeight;
}

function showError(message) {
  alert(message);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

console.log('Live Transcription frontend initialized');
