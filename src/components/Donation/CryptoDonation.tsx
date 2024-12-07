import React, { useState } from 'react';
import { cryptoAddresses } from '../../config/cryptoAddresses';
import QRCode from 'qrcode.react';
import './Donation.css';

interface CryptoCurrency {
  name: string;
  symbol: string;
  address: string;
  icon: string;
  network?: string;
}

const CryptoDonation: React.FC = () => {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrency | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCryptoSelect = (crypto: CryptoCurrency) => {
    setSelectedCrypto(crypto);
    setShowConfirmation(true);
    setCopied(false);
  };

  const handleCopyAddress = async () => {
    if (selectedCrypto) {
      try {
        await navigator.clipboard.writeText(selectedCrypto.address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Erreur lors de la copie de l\'adresse:', error);
      }
    }
  };

  const handleClose = () => {
    setShowConfirmation(false);
    setSelectedCrypto(null);
    setCopied(false);
  };

  return (
    <div className="crypto-donation">
      <div className="donation-header">
        <h2>Faire un don en cryptomonnaie</h2>
        <p>Soutenez-nous en utilisant votre cryptomonnaie préférée</p>
      </div>

      <div className="crypto-grid">
        {Object.values(cryptoAddresses).map((crypto) => (
          <button
            key={crypto.symbol}
            className="crypto-button"
            onClick={() => handleCryptoSelect(crypto)}
          >
            <img src={crypto.icon} alt={crypto.name} className="crypto-icon" />
            <span className="crypto-name">{crypto.name}</span>
            <span className="crypto-symbol">{crypto.symbol}</span>
          </button>
        ))}
      </div>

      {showConfirmation && selectedCrypto && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <button className="close-button" onClick={handleClose}>
              <i className="fas fa-times" />
            </button>

            <div className="confirmation-content">
              <h3>Faire un don en {selectedCrypto.name}</h3>
              
              <div className="qr-container">
                <QRCode
                  value={selectedCrypto.address}
                  size={200}
                  level="H"
                  includeMargin={true}
                  renderAs="svg"
                />
              </div>

              <div className="address-container">
                <p className="address-label">Adresse de réception :</p>
                <div className="address-box">
                  <code className="crypto-address">{selectedCrypto.address}</code>
                  <button
                    className="copy-button"
                    onClick={handleCopyAddress}
                    title="Copier l'adresse"
                  >
                    <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`} />
                  </button>
                </div>
                {selectedCrypto.network && (
                  <p className="network-info">
                    Réseau : <strong>{selectedCrypto.network}</strong>
                  </p>
                )}
              </div>

              <div className="donation-warning">
                <i className="fas fa-exclamation-triangle" />
                <p>
                  Veuillez vérifier l'adresse avant d'envoyer vos {selectedCrypto.symbol}.
                  Les transactions sont irréversibles.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoDonation;
