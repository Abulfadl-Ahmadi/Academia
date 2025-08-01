import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

const VideoPlayer = ({ src }: { src: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (video && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src); // e.g. "http://localhost:8000/media/hls/course1/video1.m3u8"
      hls.attachMedia(video);
    } else if (video?.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    }
  }, [src]);

  return <video ref={videoRef} controls width="640" height="360" />;
};

export default VideoPlayer;
