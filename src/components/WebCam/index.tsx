import { useEffect, useRef } from "react";

export const WebCam = () => {
  console.log("[WebCam] Component rendering");
  const camElement = useRef<HTMLVideoElement | null>(null);

  const streamWebCam = async () => {
    console.log("[WebCam] Attempting to get user media");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      console.log("[WebCam] Successfully got media stream");

      if (camElement.current) {
        console.log("[WebCam] Setting video element source");
        camElement.current.srcObject = stream;
        await camElement.current.play();
        console.log("[WebCam] Video element playing");
      } else {
        console.error("[WebCam] Video element reference is null");
      }
    } catch (error) {
      console.error("[WebCam] Error getting media stream:", error);
    }
  };

  useEffect(() => {
    console.log("[WebCam] Component mounted, starting webcam stream");
    streamWebCam();
    
    return () => {
      console.log("[WebCam] Component unmounting, cleaning up");
      if (camElement.current?.srcObject) {
        const tracks = (camElement.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        console.log("[WebCam] Media tracks stopped");
      }
    };
  }, []);

  return (
    <video
      ref={camElement}
      className="h-screen draggable object-cover rounded-lg aspect-video border-2 relative border-white"
      onError={(e) => console.error("[WebCam] Video element error:", e)}
      onLoadedData={() => console.log("[WebCam] Video data loaded")}
      onPlaying={() => console.log("[WebCam] Video started playing")}
    ></video>
  );
};
