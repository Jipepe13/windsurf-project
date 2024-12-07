import React, { useEffect, useState } from 'react';
import './VideoCall.css';

interface Device {
  deviceId: string;
  label: string;
}

interface CallSettingsProps {
  onAudioDeviceChange: (deviceId: string) => void;
  onVideoDeviceChange: (deviceId: string) => void;
  currentAudioDevice?: string;
  currentVideoDevice?: string;
  onClose: () => void;
}

const CallSettings: React.FC<CallSettingsProps> = ({
  onAudioDeviceChange,
  onVideoDeviceChange,
  currentAudioDevice,
  currentVideoDevice,
  onClose,
}) => {
  const [audioDevices, setAudioDevices] = useState<Device[]>([]);
  const [videoDevices, setVideoDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadDevices = async () => {
      try {
        setLoading(true);
        setError('');

        // Demander les permissions si nécessaire
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

        const devices = await navigator.mediaDevices.enumerateDevices();

        const audioInputs = devices
          .filter((device) => device.kind === 'audioinput')
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label || `Microphone ${device.deviceId.slice(0, 5)}...`,
          }));

        const videoInputs = devices
          .filter((device) => device.kind === 'videoinput')
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label || `Caméra ${device.deviceId.slice(0, 5)}...`,
          }));

        setAudioDevices(audioInputs);
        setVideoDevices(videoInputs);
      } catch (err) {
        setError('Erreur lors du chargement des périphériques');
        console.error('Erreur lors du chargement des périphériques:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDevices();
  }, []);

  return (
    <div className="call-settings">
      <div className="settings-header">
        <h3>Paramètres d'appel</h3>
        <button className="close-button" onClick={onClose}>
          <i className="fas fa-times" />
        </button>
      </div>

      {loading && (
        <div className="settings-loading">
          <div className="loading-spinner" />
          <span>Chargement des périphériques...</span>
        </div>
      )}

      {error && <div className="settings-error">{error}</div>}

      {!loading && !error && (
        <div className="settings-content">
          <div className="settings-section">
            <label htmlFor="audioDevice">Microphone</label>
            <select
              id="audioDevice"
              value={currentAudioDevice}
              onChange={(e) => onAudioDeviceChange(e.target.value)}
            >
              {audioDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </div>

          <div className="settings-section">
            <label htmlFor="videoDevice">Caméra</label>
            <select
              id="videoDevice"
              value={currentVideoDevice}
              onChange={(e) => onVideoDeviceChange(e.target.value)}
            >
              {videoDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </div>

          <div className="settings-info">
            <i className="fas fa-info-circle" />
            <span>
              Les modifications seront appliquées immédiatement. Vous devrez
              peut-être réactiver votre caméra ou votre microphone après un
              changement.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallSettings;
