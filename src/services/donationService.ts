import { cryptoAddresses } from '../config/cryptoAddresses';

interface DonationTransaction {
  id: string;
  userId: string;
  cryptoSymbol: string;
  amount: string;
  txHash: string;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
}

export const recordDonation = async (
  userId: string,
  cryptoSymbol: string,
  amount: string,
  txHash: string
): Promise<DonationTransaction> => {
  try {
    const response = await fetch('/api/donations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        cryptoSymbol,
        amount,
        txHash,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de l\'enregistrement du don');
    }

    return await response.json();
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('Une erreur est survenue lors de l\'enregistrement du don');
  }
};

export const getDonationHistory = async (
  userId: string
): Promise<DonationTransaction[]> => {
  try {
    const response = await fetch(`/api/donations/user/${userId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la récupération de l\'historique des dons');
    }

    return await response.json();
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('Une erreur est survenue lors de la récupération de l\'historique des dons');
  }
};

export const verifyDonation = async (txHash: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/donations/verify/${txHash}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la vérification du don');
    }

    const { verified } = await response.json();
    return verified;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('Une erreur est survenue lors de la vérification du don');
  }
};

export const getCryptoPrice = async (symbol: string): Promise<number> => {
  try {
    const response = await fetch(`/api/crypto/price/${symbol}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la récupération du prix');
    }

    const { price } = await response.json();
    return price;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('Une erreur est survenue lors de la récupération du prix');
  }
};

export const validateCryptoAddress = (address: string, symbol: string): boolean => {
  // Validation basique des adresses
  const patterns: { [key: string]: RegExp } = {
    BTC: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[ac-hj-np-z02-9]{11,71}$/,
    ETH: /^0x[a-fA-F0-9]{40}$/,
    USDT: /^0x[a-fA-F0-9]{40}$/,
    BNB: /^(bnb1)[0-9a-z]{38}$/,
    DOGE: /^D{1}[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32}$/,
  };

  const pattern = patterns[symbol];
  if (!pattern) return true; // Si pas de pattern défini, on considère l'adresse valide

  return pattern.test(address);
};

export const getCryptoAddressForNetwork = (
  symbol: string,
  network?: string
): string | null => {
  const crypto = cryptoAddresses[symbol];
  if (!crypto) return null;

  // Si un réseau spécifique est demandé et que l'adresse existe pour ce réseau
  if (network && crypto.networks && crypto.networks[network]) {
    return crypto.networks[network];
  }

  // Sinon, retourner l'adresse par défaut
  return crypto.address;
};

export const formatCryptoAmount = (
  amount: string | number,
  symbol: string,
  decimals: number = 8
): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toFixed(decimals) + ' ' + symbol;
};
