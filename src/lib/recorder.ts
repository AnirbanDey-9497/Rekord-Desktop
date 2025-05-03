import { v4 as uuid } from "uuid";
import { hidePluginWindow } from "./utils";
import io from "socket.io-client";

// Configure Socket.IO client with options
const socket = io(import.meta.env.VITE_SOCKET_URL as string, {
  autoConnect: true,
  transports: ['websocket', 'polling']
});

// // Add connection event handlers
// socket.on('connect', () => {
//   console.log('[Socket.IO] Connected to server');
// });

// socket.on('connect_error', (error) => {
//   console.error('[Socket.IO] Connection error:', error);
// });

// socket.on('disconnect', (reason) => {
//   console.log('[Socket.IO] Disconnected:', reason);
// });

let mediaRecorder: MediaRecorder | null = null;
let videoTransferFileName: string | undefined;
let userId: string;

export const selectSources = async (
  onSources: {
    screen: string;
    audio: string;
    id: string;
    preset: "HD" | "SD";
  },
  videoElement: React.RefObject<HTMLVideoElement> | null
) => {
  if (onSources && onSources.screen && onSources.audio && onSources.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const constraints: any = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: onSources?.screen,
          minWidth: onSources.preset === "HD" ? 1920 : 1280,
          maxWidth: onSources.preset === "HD" ? 1920 : 1280,
          minHeight: onSources.preset === "HD" ? 1080 : 720,
          maxHeight: onSources.preset === "HD" ? 1080 : 720,
          frameRate: 30,
        },
      },
    };

    userId = onSources.id;

    try {
      //create stream
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      //audio & webcam stream
      const audioStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: onSources?.audio
          ? { deviceId: { exact: onSources.audio } }
          : false,
      });

      if (videoElement && videoElement.current) {
        videoElement.current.srcObject = stream;
        await videoElement.current.play();
      }

      const combinedStream = new MediaStream([
        ...stream.getTracks(),
        ...audioStream.getTracks(),
      ]);

      mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: "video/webm; codecs=vp9",
      });

      mediaRecorder.ondataavailable = onDataAvailable;
      mediaRecorder.onstop = stopRecording;
    } catch (error) {
      console.error("Error selecting sources:", error);
      throw error;
    }
  }
};

export const StartRecording = (onSources: {
  screen: string;
  audio: string;
  id: string;
}) => {
  console.log('[Recorder] Starting recording with sources:', onSources);
  if (!mediaRecorder) {
    console.error("[Recorder] MediaRecorder not initialized");
    return;
  }
  hidePluginWindow(true);
  videoTransferFileName = `${uuid()}-${onSources?.id.slice(0, 8)}.webm`;
  console.log('[Recorder] Starting MediaRecorder with filename:', videoTransferFileName);
  mediaRecorder.start(1000);
  console.log('[Recorder] MediaRecorder started');
};

const onDataAvailable = (e: BlobEvent) => {
  console.log('[Recorder] Video chunk available, size:', e.data.size);
  if (!socket.connected) {
    console.error('[Recorder] Socket not connected, cannot send video chunk');
    return;
  }
  socket.emit("video-chunks", {
    chunks: e.data,
    filename: videoTransferFileName,
  });
  console.log('[Recorder] Video chunk sent to server');
};

export const onStopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
};

const stopRecording = () => {
  console.log('[Recorder] Stopping recording');
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    console.log('[Recorder] MediaRecorder stopped');
  }
  hidePluginWindow(false);
  // TODO: Implement socket.io video processing
  socket.emit("process-video", {
    filename: videoTransferFileName,
    userId,
  });
  console.log("Recording stopped:", videoTransferFileName);
};
