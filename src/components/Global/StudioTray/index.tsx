/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { onStopRecording, selectSources, StartRecording } from "@/lib/recorder";
import { cn, resizeWindow, videoRecordingTime } from "@/lib/utils";
import { Cast, Pause, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

  // Handle IPC events
  useEffect(() => {
    console.log("[StudioTray] Setting up IPC listener");
    const handleProfileReceived = (event: any, payload: any) => {
      console.log("[StudioTray] Profile received:", payload);
      if (!payload) {
        console.error("[StudioTray] No profile data received");
        setError("No profile data received");
        setIsLoading(false);
        return;
      }

      if (!payload.screen || !payload.audio || !payload.id) {
        console.error("[StudioTray] Invalid profile data:", payload);
        setError("Invalid profile data received");
        setIsLoading(false);
        return;
      }

      setOnSources(payload);
      setError(null);
      setIsLoading(false);
    };

    try {
      window.ipcRenderer.on("profile-received", handleProfileReceived);
      console.log("[StudioTray] IPC listener setup complete");
    } catch (error) {
      console.error("[StudioTray] Failed to setup IPC listener:", error);
      setError("Failed to setup IPC listener");
      setIsLoading(false);
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
    if (!recording) return;
    
    initialTime = new Date(); // Reset initial time when recording starts
    const recordTimeInteval = setInterval(() => {
      const time = count + (new Date().getTime() - initialTime.getTime());
      setCount(time);
      const recordingTime = videoRecordingTime(time);
      
      // Stop recording after 5 minutes for FREE plan
      if (onSources?.plan === "FREE" && recordingTime.minute === "05") {
        setRecording(false);
        clearTime();
        onStopRecording();
      }
      
      setOnTimer(recordingTime.length);
      
      if (time <= 0) {
        setOnTimer("00:00:00");
        clearInterval(recordTimeInteval);
      }
    }, 1000); // Changed to 1000ms for better performance

    return () => clearInterval(recordTimeInteval);
  }, [recording, count]);

  // Handle recording start
  const handleStartRecording = () => {
    if (!onSources) {
      console.error("[StudioTray] Cannot start recording without sources");
      setError("Cannot start recording without sources");
      return;
    }
    setRecording(true);
    setCount(0);
    StartRecording(onSources);
  };

  // Handle recording stop
  const handleStopRecording = () => {
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