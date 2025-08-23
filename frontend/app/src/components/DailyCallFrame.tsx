import React, { useEffect, useRef, useState } from "react";
import DailyIframe from "@daily-co/daily-js";
import { X, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DailyCallFrameProps {
  roomUrl: string;
  token?: string;
  onLeave: () => void;
  isVisible: boolean;
}

export function DailyCallFrame({
  roomUrl,
  token,
  onLeave,
  isVisible,
}: DailyCallFrameProps) {
  const [call, setCall] = useState<any>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || !roomUrl) return;

    // Create the Daily call frame
    const dailyCall = DailyIframe.createFrame({
      showLeaveButton: true,
      iframeStyle: {
        position: "fixed",
        top: isMinimized ? "auto" : "0",
        bottom: isMinimized ? "20px" : "0",
        right: isMinimized ? "20px" : "0",
        left: isMinimized ? "auto" : "0",
        width: isMinimized ? "320px" : "100%",
        height: isMinimized ? "240px" : "100%",
        zIndex: "9999",
        border: isMinimized ? "2px solid #e5e7eb" : "none",
        borderRadius: isMinimized ? "12px" : "0",
        boxShadow: isMinimized
          ? "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          : "none",
        transition: "all 0.3s ease-in-out",
      },
    });

    setCall(dailyCall);

    // Join the room
    dailyCall
      .join({
        url: roomUrl,
        token: token,
      })
      .catch((error: any) => {
        console.error("Failed to join Daily room:", error);
      });

    // Listen for leave events
    dailyCall.on("left-meeting", () => {
      onLeave();
    });

    dailyCall.on("error", (error: any) => {
      console.error("Daily call error:", error);
    });

    return () => {
      if (dailyCall) {
        dailyCall.destroy();
      }
    };
  }, [isVisible, roomUrl, token, isMinimized, onLeave]);

  useEffect(() => {
    if (call && call.iframe()) {
      const iframe = call.iframe();
      if (iframe) {
        Object.assign(iframe.style, {
          position: "fixed",
          top: isMinimized ? "auto" : "0",
          bottom: isMinimized ? "20px" : "0",
          right: isMinimized ? "20px" : "0",
          left: isMinimized ? "auto" : "0",
          width: isMinimized ? "320px" : "100%",
          height: isMinimized ? "240px" : "100%",
          zIndex: "9999",
          border: isMinimized ? "2px solid #e5e7eb" : "none",
          borderRadius: isMinimized ? "12px" : "0",
          boxShadow: isMinimized
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            : "none",
          transition: "all 0.3s ease-in-out",
        });
      }
    }
  }, [call, isMinimized]);

  const handleEndCall = () => {
    if (call) {
      call.leave();
    }
    onLeave();
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Overlay controls for minimized state */}
      {isMinimized && (
        <div
          ref={containerRef}
          className="fixed bottom-5 right-5 z-[10000] bg-white rounded-t-lg shadow-lg border-2 border-gray-200"
          style={{ width: "320px" }}
        >
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-t-lg border-b">
            <span className="text-sm font-medium text-gray-700">
              Voice Call
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMinimize}
                className="h-6 w-6 p-0 hover:bg-gray-200"
              >
                <Maximize2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEndCall}
                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay controls for fullscreen state */}
      {!isMinimized && (
        <div className="fixed top-4 right-4 z-[10000] flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleMinimize}
            className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
          >
            <Minimize2 className="w-4 h-4 mr-2" />
            Minimize
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleEndCall}
            className="shadow-lg"
          >
            <X className="w-4 h-4 mr-2" />
            End Call
          </Button>
        </div>
      )}
    </>
  );
}
