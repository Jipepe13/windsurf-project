import React from 'react';
import './VideoCall.css';

interface CallControlsProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
}

const CallControls: React.FC<CallControlsProps> = ({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onEndCall,
}) => {
  return (
    <div className="call-controls">
      <button
        className={`control-button ${isAudioEnabled ? 'active' : ''}`}
        onClick={onToggleAudio}
        title={isAudioEnabled ? 'Désactiver le micro' : 'Activer le micro'}
      >
        <i className={`fas fa-microphone${isAudioEnabled ? '' : '-slash'}`} />
      </button>

      <button
        className={`control-button ${isVideoEnabled ? 'active' : ''}`}
        onClick={onToggleVideo}
        title={isVideoEnabled ? 'Désactiver la caméra' : 'Activer la caméra'}
      >
        <i className={`fas fa-video${isVideoEnabled ? '' : '-slash'}`} />
      </button>

      <button
        className={`control-button ${isScreenSharing ? 'active' : ''}`}
        onClick={onToggleScreenShare}
        title={isScreenSharing ? 'Arrêter le partage' : 'Partager l\'écran'}
      >
        <i className="fas fa-desktop" />
      </button>

      <button
        className="control-button end-call"
        onClick={onEndCall}
        title="Terminer l'appel"
      >
        <i className="fas fa-phone-slash" />
      </button>
    </div>
  );
};

export default CallControls;
