// Real camera/mic handling for live streaming and reel creation
export class MediaService {
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  async getCameraPermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error("Camera permission denied:", error);
      return false;
    }
  }

  async startStream(videoEnabled: boolean = true, audioEnabled: boolean = true): Promise<MediaStream | null> {
    try {
      const constraints: MediaStreamConstraints = {
        video: videoEnabled ? { facingMode: "user" } : false,
        audio: audioEnabled,
      };
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.stream;
    } catch (error) {
      console.error("Failed to start stream:", error);
      return null;
    }
  }

  async startRecording(): Promise<void> {
    if (!this.stream) return;
    
    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream);
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };
    
    this.mediaRecorder.start(1000); // Record in 1-second chunks
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(new Blob());
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/mp4' });
        this.recordedChunks = [];
        resolve(blob);
      };
      
      this.mediaRecorder.stop();
    });
  }

  async switchCamera(): Promise<void> {
    if (!this.stream) return;
    
    const videoTrack = this.stream.getVideoTracks()[0];
    const currentFacingMode = videoTrack?.getSettings().facingMode;
    const newFacingMode = currentFacingMode === "user" ? "environment" : "user";
    
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: newFacingMode } },
      audio: true,
    });
    
    const newVideoTrack = newStream.getVideoTracks()[0];
    videoTrack?.stop();
    this.stream.removeTrack(videoTrack);
    this.stream.addTrack(newVideoTrack);
  }

  async toggleVideo(enabled: boolean): Promise<void> {
    if (!this.stream) return;
    const videoTrack = this.stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = enabled;
    }
  }

  async toggleAudio(enabled: boolean): Promise<void> {
    if (!this.stream) return;
    const audioTrack = this.stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = enabled;
    }
  }

  takeSnapshot(): string | null {
    if (!this.stream) return null;
    
    const videoTrack = this.stream.getVideoTracks()[0];
    if (!videoTrack) return null;
    
    // Create a temporary video element to capture frame
    const video = document.createElement('video');
    video.srcObject = this.stream;
    video.play();
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg');
  }

  stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.mediaRecorder) {
      this.mediaRecorder = null;
    }
  }
}

export const mediaService = new MediaService();