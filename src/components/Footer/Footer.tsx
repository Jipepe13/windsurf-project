import React, { useState } from 'react';
import { cryptoAddresses } from '../../config/cryptoAddresses';
import './Footer.css';

const Footer: React.FC = () => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleCopyAddress = async (currency: string, address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(currency);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie :', err);
    }
  };

  const handleDonateClick = (currency: string) => {
    setShowConfirmDialog(true);
    setSelectedCrypto(currency);
  };

  const handleConfirmDonation = () => {
    setShowConfirmDialog(false);
  };

  const handleCancelDonation = () => {
    setShowConfirmDialog(false);
    setSelectedCrypto(null);
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="crypto-donation">
          <h3>Faire un don en cryptomonnaie</h3>
          <div className="crypto-list">
            {Object.entries(cryptoAddresses).map(([currency, address]) => (
              <div key={currency} className="crypto-item">
                <div className="crypto-info">
                  <img 
                    src={`/images/crypto/${currency.toLowerCase()}.png`} 
                    alt={`${currency} icon`}
                    className="crypto-icon"
                  />
                  <span className="crypto-name">{currency}</span>
                </div>
                {selectedCrypto === currency ? (
                  <div className="crypto-address">
                    <span className="address-text">
                      {address}
                    </span>
                    <button 
                      onClick={() => handleCopyAddress(currency, address)}
                      className="copy-button"
                    >
                      {copiedAddress === currency ? 'Copié !' : 'Copier'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleDonateClick(currency)}
                    className="donate-button"
                  >
                    Faire un don
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="footer-links">
          <div className="footer-section">
            <h4>À propos</h4>
            <ul>
              <li><a href="/about">À propos de nous</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href="/privacy">Confidentialité</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Communauté</h4>
            <ul>
              <li><a href="/blog">Blog</a></li>
              <li><a href="/forum">Forum</a></li>
              <li><a href="/support">Support</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} WebChat. Tous droits réservés.</p>
      </div>

      {showConfirmDialog && (
        <div className="confirmation-dialog">
          <div className="dialog-content">
            <h4>Confirmation de don</h4>
            <p>Êtes-vous sûr de vouloir faire un don en {selectedCrypto} ?</p>
            <div className="dialog-buttons">
              <button onClick={handleConfirmDonation} className="confirm-button">
                Confirmer
              </button>
              <button onClick={handleCancelDonation} className="cancel-button">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
