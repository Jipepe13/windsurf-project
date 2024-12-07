import React, { useRef, useEffect } from 'react';
import './VideoCall.css';

interface ParticipantVideoProps {
  stream: MediaStream;
  username: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing?: boolean;
  isLocal?: boolean;
}

const ParticipantVideo: React.FC<ParticipantVideoProps> = ({
  stream,
  username,
  isMuted,
  isVideoOff,
  isScreenSharing = false,
  isLocal = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`participant-video ${isScreenSharing ? 'screen-share' : ''}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal || isMuted}
        className={isVideoOff ? 'hidden' : ''}
      />

      {isVideoOff && (
        <div className="video-placeholder">
          <div className="avatar-circle">
            {username.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      <div className="participant-info">
        <span className="participant-name">
          {username} {isLocal && '(Vous)'}
        </span>
        <div className="participant-status">
          {isMuted && (
            <span className="status-icon" title="Micro désactivé">
              <i className="fas fa-microphone-slash" />
            </span>
          )}
          {isVideoOff && (
            <span className="status-icon" title="Caméra désactivée">
              <i className="fas fa-video-slash" />
            </span>
          )}
          {isScreenSharing && (
            <span className="status-icon" title="Partage d'écran">
              <i className="fas fa-desktop" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParticipantVideo;
