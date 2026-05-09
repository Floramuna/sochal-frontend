import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TopicTag } from "@/types/sochal.types";
import { Video, Mic, MicOff, VideoOff, FlipHorizontal, Camera, Check, X, Plus, Timer, StopCircle } from "lucide-react";

interface CreateReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReelCreated: (reelData: any) => void;
}

const TOPICS = [
  { value: TopicTag.Singing, label: "🎤 Singing" },
  { value: TopicTag.Dancing, label: "💃 Dancing" },
  { value: TopicTag.Comedy, label: "😂 Comedy" },
  { value: TopicTag.Rap, label: "🎙️ Rap" },
  { value: TopicTag.Gaming, label: "🎮 Gaming" },
];

export function CreateReelModal({ isOpen, onClose, onReelCreated }: CreateReelModalProps) {
  const [step, setStep] = useState<"permissions" | "recording" | "preview" | "details">("permissions");
  const [hasPermission, setHasPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<TopicTag>(TopicTag.Singing);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Request camera permissions
  const requestPermissions = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" }, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
        setStep("recording");
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      if (err.name === "NotAllowedError") {
        setError("Please allow camera and microphone access to create reels");
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device");
      } else {
        setError("Failed to access camera. Please check permissions.");
      }
    }
  };

  // Start recording
  const startRecording = () => {
    if (!streamRef.current) return;
    
    recordedChunksRef.current = [];
    mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm'
    });
    
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };
    
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setStep("preview");
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordTime(0);
    };
    
    mediaRecorderRef.current.start();
    setIsRecording(true);
    
    timerRef.current = setInterval(() => {
      setRecordTime(prev => {
        if (prev >= 60) {
          stopRecording();
          return 60;
        }
        return prev + 1;
      });
    }, 1000);
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Switch camera front/back
  const switchCamera = async () => {
    if (!streamRef.current) return;
    
    const videoTrack = streamRef.current.getVideoTracks()[0];
    const currentFacingMode = videoTrack?.getSettings().facingMode;
    const newFacingMode = currentFacingMode === "user" ? "environment" : "user";
    
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: newFacingMode } },
      audio: true,
    });
    
    const newVideoTrack = newStream.getVideoTracks()[0];
    videoTrack?.stop();
    streamRef.current.removeTrack(videoTrack);
    streamRef.current.addTrack(newVideoTrack);
    
    if (videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !isVideoOff;
      setIsVideoOff(!isVideoOff);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (!streamRef.current) return;
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Capture thumbnail from video
  const captureThumbnail = (): Promise<string> => {
    return new Promise((resolve) => {
      if (!videoRef.current) {
        resolve("");
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg'));
    });
  };

  // Submit reel
  const submitReel = async () => {
    if (!previewUrl) return;
    
    const blob = await fetch(previewUrl).then(r => r.blob());
    const thumbnail = await captureThumbnail();
    const file = new File([blob], `reel_${Date.now()}.webm`, { type: 'video/webm' });
    
    onReelCreated({
      videoFile: file,
      description,
      topic: selectedTopic,
      thumbnail,
    });
    
    cleanup();
    onClose();
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setStep("permissions");
    setDescription("");
    setRecordTime(0);
    setError(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!isOpen) {
      cleanup();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-gray-800 max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Plus className="size-5 text-blue-400" />
            Create Reel
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {step === "permissions" && (
            <div className="text-center py-8">
              <div className="size-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Video className="size-10 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Camera & Microphone Access</h3>
              <p className="text-gray-400 text-sm mb-6">
                Sochal needs access to your camera and microphone to record reels
              </p>
              <Button onClick={requestPermissions} className="bg-blue-600">
                Allow Access
              </Button>
            </div>
          )}

          {step === "recording" && (
            <div>
              <div className="relative aspect-[9/16] bg-black rounded-xl overflow-hidden mb-4">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                
                {/* Recording Indicator */}
                <div className="absolute top-4 left-4 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <span className="size-1.5 bg-white rounded-full animate-pulse" />
                  REC {formatTime(recordTime)}
                </div>
                
                {/* Recording Controls */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <button 
                    onClick={toggleAudio} 
                    className="size-12 rounded-full bg-black/60 backdrop-blur flex items-center justify-center"
                  >
                    {isMuted ? <MicOff className="size-6 text-white" /> : <Mic className="size-6 text-white" />}
                  </button>
                  
                  <button 
                    onClick={toggleVideo} 
                    className="size-12 rounded-full bg-black/60 backdrop-blur flex items-center justify-center"
                  >
                    {isVideoOff ? <VideoOff className="size-6 text-white" /> : <Video className="size-6 text-white" />}
                  </button>
                  
                  <button 
                    onClick={switchCamera} 
                    className="size-12 rounded-full bg-black/60 backdrop-blur flex items-center justify-center"
                  >
                    <FlipHorizontal className="size-6 text-white" />
                  </button>
                  
                  {!isRecording ? (
                    <button 
                      onClick={startRecording} 
                      className="size-16 rounded-full bg-red-500 flex items-center justify-center animate-pulse"
                    >
                      <div className="size-5 bg-white rounded-full" />
                    </button>
                  ) : (
                    <button 
                      onClick={stopRecording} 
                      className="size-16 rounded-full bg-gray-700 flex items-center justify-center"
                    >
                      <StopCircle className="size-8 text-white" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-center text-gray-400 text-sm">Tap to record (max 60 seconds)</p>
            </div>
          )}

          {step === "preview" && previewUrl && (
            <div>
              <video src={previewUrl} controls className="w-full rounded-xl mb-4 max-h-[400px]" />
              <div className="space-y-3">
                <Textarea
                  placeholder="Write a caption..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  rows={3}
                  maxLength={150}
                />
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value as TopicTag)}
                  className="w-full bg-gray-800 border-gray-700 text-white rounded-lg px-3 py-2"
                >
                  {TOPICS.map(topic => (
                    <option key={topic.value} value={topic.value}>{topic.label}</option>
                  ))}
                </select>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("recording")} className="flex-1">
                    Re-record
                  </Button>
                  <Button onClick={submitReel} className="flex-1 bg-blue-600">
                    Post Reel →
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}