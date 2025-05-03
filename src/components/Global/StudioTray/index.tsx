/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { onStopRecording, selectSources, StartRecording } from "@/lib/recorder";
import { cn, resizeWindow, videoRecordingTime, getMediaSources } from "@/lib/utils";
import { Cast, Pause, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type DisplaySource = {
  id: string;
  name: string;
};

export const StudioTray = () => {
  let initialTime = new Date();
  const [onSources, setOnSources] = useState<
    | {
        screen: string;
        id: string;
        audio: string;
        preset: "HD" | "SD";
        plan: "PRO" | "FREE";
      }
    | undefined
  >(undefined);
  const [recording, setRecording] = useState<boolean>(false);
  const [onTimer, setOnTimer] = useState<string>("00:00:00");
  const [count, setCount] = useState<number>(0);
  const [preview, setPreview] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const videoElement = useRef<HTMLVideoElement | null>(null);

  const clearTime = () => {
    setOnTimer("00:00:00");
    setCount(0);
  };

  // Load default sources on mount
  useEffect(() => {
    const loadDefaultSources = async () => {
      try {
        console.log("[StudioTray] Loading default sources");
        const { displays, audio: audioInputs } = await getMediaSources();
        
        if (displays?.length && audioInputs?.length) {
          // Prefer entire screen as default source
          const defaultScreen = displays.find((d: DisplaySource) => d.id === 'screen:1:0') || displays[0];
          
          const defaultSources = {
            screen: defaultScreen.id,
            id: crypto.randomUUID(),
            audio: audioInputs[0].deviceId,
            preset: "SD" as const,
            plan: "PRO" as const
          };
          
          console.log("[StudioTray] Setting default sources:", defaultSources);
          setOnSources(defaultSources);
          
          // Immediately try to select the sources
          try {
            await selectSources(defaultSources, videoElement);
            setError(null);
          } catch (err) {
            console.error("[StudioTray] Failed to select default sources:", err);
            setError("Failed to select default sources");
          }
          
          setIsLoading(false);
        } else {
          console.error("[StudioTray] No available sources");
          setError("No available sources");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("[StudioTray] Failed to load default sources:", error);
        setError("Failed to load default sources");
        setIsLoading(false);
      }
    };

    loadDefaultSources();
  }, []);

  // Handle IPC events
  useEffect(() => {
    console.log("[StudioTray] Setting up IPC listener");
    const handleProfileReceived = (event: any, payload: any) => {
      console.log("[StudioTray] Profile received:", payload);
      if (!payload) {
        console.error("[StudioTray] No profile data received");
        return;
      }

      if (!payload.screen || !payload.audio || !payload.id) {
        console.error("[StudioTray] Invalid profile data:", payload);
        return;
      }

      setOnSources(payload);
      setError(null);
    };

    try {
      window.ipcRenderer.on("profile-received", handleProfileReceived);
      console.log("[StudioTray] IPC listener setup complete");
    } catch (error) {
      console.error("[StudioTray] Failed to setup IPC listener:", error);
    }

    return () => {
      try {
        window.ipcRenderer.removeListener("profile-received", handleProfileReceived);
        console.log("[StudioTray] IPC listener cleanup complete");
      } catch (error) {
        console.error("[StudioTray] Failed to cleanup IPC listener:", error);
      }
    };
  }, []);

  // Handle video sources
  useEffect(() => {
    if (onSources && onSources.screen) {
      console.log("[StudioTray] Selecting sources:", onSources);
      selectSources(onSources, videoElement).catch((error) => {
        console.error("[StudioTray] Failed to select sources:", error);
        setError("Failed to select video sources");
      });
    }
  }, [onSources]);

  // Handle preview window resize
  useEffect(() => {
    resizeWindow(preview);
    return () => resizeWindow(preview);
  }, [preview]);

  // Handle recording timer
  useEffect(() => {
    if (!recording) {
      console.log('[StudioTray] Recording is not active, timer not started');
      return;
    }
    
    console.log('[StudioTray] Starting recording timer');
    initialTime = new Date(); // Reset initial time when recording starts
    const recordTimeInteval = setInterval(() => {
      const time = count + (new Date().getTime() - initialTime.getTime());
      setCount(time);
      const recordingTime = videoRecordingTime(time);
      
      // Stop recording after 5 minutes for FREE plan
      if (onSources?.plan === "FREE" && recordingTime.minute === "05") {
        console.log('[StudioTray] Free plan 5-minute limit reached, stopping recording');
        setRecording(false);
        clearTime();
        onStopRecording();
      }
      
      setOnTimer(recordingTime.length);
      console.log('[StudioTray] Timer updated:', recordingTime.length);
      
      if (time <= 0) {
        console.log('[StudioTray] Timer reached zero');
        setOnTimer("00:00:00");
        clearInterval(recordTimeInteval);
      }
    }, 1000);

    return () => {
      console.log('[StudioTray] Cleaning up timer interval');
      clearInterval(recordTimeInteval);
    };
  }, [recording, count]);

  // Handle recording start
  const handleStartRecording = () => {
    console.log('[StudioTray] Start recording clicked');
    if (!onSources) {
      console.error("[StudioTray] Cannot start recording without sources");
      setError("Cannot start recording without sources");
      return;
    }
    console.log('[StudioTray] Starting recording with sources:', onSources);
    setRecording(true);
    setCount(0);
    StartRecording(onSources);
  };

  // Handle recording stop
  const handleStopRecording = () => {
    console.log('[StudioTray] Stop recording clicked');
    setRecording(false);
    clearTime();
    onStopRecording();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return !onSources ? (
    <div className="flex items-center justify-center h-screen">
      <div className="text-white">No sources available</div>
    </div>
  ) : (
    <div className="flex flex-col justify-end gap-y-5 h-screen draggable">
      <video
        autoPlay
        ref={videoElement}
        className={cn(
          "w-6/12 border-2 self-end non-draggable",
          preview ? "hidden" : ""
        )}></video>

      <div className="rounded-full flex justify-around items-center h-20 w-full border-2 bg-[#171717] border-white/40">
        <div
          onClick={handleStartRecording}
          className={cn(
            "non-draggable rounded-full cursor-pointer relative hover:opacity-80",
            recording ? "bg-red-500 w-6 h-6" : "bg-red-400 w-8 h-8"
          )}>
          {recording && (
            <span className="absolute -right-16 top-1/2 transform -translate-y-1/2 text-white">
              {onTimer}
            </span>
          )}
        </div>

        {!recording ? (
          <Pause
            className="non-draggable opacity-50"
            size={32}
            fill="white"
            stroke="none"
          />
        ) : (
          <Square
            size={32}
            className="non-draggable cursor-pointer hover:scale-110 transform transition duration-150"
            fill="white"
            onClick={handleStopRecording}
            stroke="white"
          />
        )}
        <Cast
          onClick={() => setPreview((prev) => !prev)}
          size={32}
          fill="white"
          className="non-draggable cursor-pointer hover:opacity-60"
          stroke="white"
        />
      </div>
    </div>
  );
};

export default StudioTray;