import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  getDonationHistory,
  formatCryptoAmount,
  getCryptoPrice,
} from '../../services/donationService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import './Donation.css';

interface DonationTransaction {
  id: string;
  cryptoSymbol: string;
  amount: string;
  txHash: string;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
}

const DonationHistory: React.FC = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState<DonationTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [prices, setPrices] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const fetchDonations = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError('');
        const history = await getDonationHistory(user.id);
        setDonations(history);

        // Récupérer les prix actuels pour chaque crypto
        const uniqueSymbols = [...new Set(history.map((d) => d.cryptoSymbol))];
        const pricePromises = uniqueSymbols.map(async (symbol) => {
          try {
            const price = await getCryptoPrice(symbol);
            return { symbol, price };
          } catch {
            return { symbol, price: 0 };
          }
        });

        const priceResults = await Promise.all(pricePromises);
        const priceMap = priceResults.reduce(
          (acc, { symbol, price }) => ({
            ...acc,
            [symbol]: price,
          }),
          {}
        );
        setPrices(priceMap);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Erreur lors de la récupération de l\'historique'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, [user]);

  const calculateFiatValue = (amount: string, symbol: string): string => {
    const price = prices[symbol] || 0;
    const value = parseFloat(amount) * price;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed';
      case 'pending':
        return 'status-pending';
      case 'failed':
        return 'status-failed';
      default:
        return '';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'pending':
        return 'En attente';
      case 'failed':
        return 'Échoué';
      default:
        return status;
    }
  };

  if (!user) {
    return (
      <div className="donation-history empty">
        <p>Veuillez vous connecter pour voir votre historique de dons.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="donation-history loading">
        <div className="loading-spinner" />
        <p>Chargement de l'historique...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="donation-history error">
        <i className="fas fa-exclamation-circle" />
        <p>{error}</p>
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="donation-history empty">
        <i className="fas fa-gift" />
        <p>Vous n'avez pas encore fait de dons.</p>
      </div>
    );
  }

  return (
    <div className="donation-history">
      <h3>Historique des dons</h3>

      <div className="donation-table-container">
        <table className="donation-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Montant</th>
              <th>Valeur (EUR)</th>
              <th>Statut</th>
              <th>Transaction</th>
            </tr>
          </thead>
          <tbody>
            {donations.map((donation) => (
              <tr key={donation.id}>
                <td>
                  {format(new Date(donation.timestamp), 'dd MMM yyyy HH:mm', {
                    locale: fr,
                  })}
                </td>
                <td>
                  {formatCryptoAmount(donation.amount, donation.cryptoSymbol)}
                </td>
                <td>{calculateFiatValue(donation.amount, donation.cryptoSymbol)}</td>
                <td>
                  <span
                    className={`status-badge ${getStatusColor(donation.status)}`}
                  >
                    {getStatusText(donation.status)}
                  </span>
                </td>
                <td>
                  <a
                    href={`https://etherscan.io/tx/${donation.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-link"
                  >
                    {`${donation.txHash.slice(0, 6)}...${donation.txHash.slice(-4)}`}
                    <i className="fas fa-external-link-alt" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="donation-summary">
        <p>
          Total des dons :{' '}
          {Object.entries(
            donations.reduce((acc, donation) => {
              const { cryptoSymbol, amount } = donation;
              acc[cryptoSymbol] = (acc[cryptoSymbol] || 0) + parseFloat(amount);
              return acc;
            }, {} as { [key: string]: number })
          ).map(([symbol, total], index, array) => (
            <span key={symbol}>
              {formatCryptoAmount(total, symbol)}
              {index < array.length - 1 ? ', ' : ''}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
};

export default DonationHistory;
