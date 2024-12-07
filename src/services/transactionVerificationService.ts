import Web3 from 'web3';
import { cryptoAddresses } from '../config/cryptoAddresses';

interface TransactionVerification {
  isValid: boolean;
  amount?: string;
  from?: string;
  confirmations?: number;
  error?: string;
}

class TransactionVerificationService {
  private static instance: TransactionVerificationService;
  private web3: Web3;
  private bscWeb3: Web3;

  private constructor() {
    // Initialiser Web3 avec les providers
    this.web3 = new Web3(
      new Web3.providers.HttpProvider(
        process.env.REACT_APP_ETH_NODE_URL || 'https://mainnet.infura.io/v3/YOUR-PROJECT-ID'
      )
    );
    this.bscWeb3 = new Web3(
      new Web3.providers.HttpProvider(
        process.env.REACT_APP_BSC_NODE_URL || 'https://bsc-dataseed.binance.org/'
      )
    );
  }

  public static getInstance(): TransactionVerificationService {
    if (!TransactionVerificationService.instance) {
      TransactionVerificationService.instance = new TransactionVerificationService();
    }
    return TransactionVerificationService.instance;
  }

  public async verifyEthTransaction(txHash: string): Promise<TransactionVerification> {
    try {
      const tx = await this.web3.eth.getTransaction(txHash);
      if (!tx) {
        return { isValid: false, error: 'Transaction non trouvée' };
      }

      // Vérifier que la transaction est destinée à notre adresse
      if (tx.to?.toLowerCase() !== cryptoAddresses.ETH.toLowerCase()) {
        return { isValid: false, error: 'Adresse de destination invalide' };
      }

      const receipt = await this.web3.eth.getTransactionReceipt(txHash);
      if (!receipt) {
        return { isValid: false, error: 'Transaction en attente' };
      }

      // Vérifier que la transaction est confirmée
      const currentBlock = await this.web3.eth.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber;

      return {
        isValid: receipt.status,
        amount: this.web3.utils.fromWei(tx.value, 'ether'),
        from: tx.from,
        confirmations,
      };
    } catch (error) {
      console.error('Erreur lors de la vérification ETH:', error);
      return { isValid: false, error: 'Erreur de vérification' };
    }
  }

  public async verifyBnbTransaction(txHash: string): Promise<TransactionVerification> {
    try {
      const tx = await this.bscWeb3.eth.getTransaction(txHash);
      if (!tx) {
        return { isValid: false, error: 'Transaction non trouvée' };
      }

      // Vérifier que la transaction est destinée à notre adresse
      if (tx.to?.toLowerCase() !== cryptoAddresses.BNB.toLowerCase()) {
        return { isValid: false, error: 'Adresse de destination invalide' };
      }

      const receipt = await this.bscWeb3.eth.getTransactionReceipt(txHash);
      if (!receipt) {
        return { isValid: false, error: 'Transaction en attente' };
      }

      // Vérifier que la transaction est confirmée
      const currentBlock = await this.bscWeb3.eth.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber;

      return {
        isValid: receipt.status,
        amount: this.bscWeb3.utils.fromWei(tx.value, 'ether'),
        from: tx.from,
        confirmations,
      };
    } catch (error) {
      console.error('Erreur lors de la vérification BNB:', error);
      return { isValid: false, error: 'Erreur de vérification' };
    }
  }

  public async verifyShibaTransaction(txHash: string): Promise<TransactionVerification> {
    try {
      const tx = await this.web3.eth.getTransaction(txHash);
      if (!tx) {
        return { isValid: false, error: 'Transaction non trouvée' };
      }

      // Vérifier que la transaction est destinée à notre adresse
      if (tx.to?.toLowerCase() !== cryptoAddresses.SHIBA.toLowerCase()) {
        return { isValid: false, error: 'Adresse de destination invalide' };
      }

      const receipt = await this.web3.eth.getTransactionReceipt(txHash);
      if (!receipt) {
        return { isValid: false, error: 'Transaction en attente' };
      }

      // Vérifier que la transaction est confirmée
      const currentBlock = await this.web3.eth.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber;

      // Pour les tokens ERC20, nous devons décoder les logs
      const transferEvent = receipt.logs.find(
        log =>
          log.topics[0] ===
          this.web3.utils.sha3('Transfer(address,address,uint256)')
      );

      if (!transferEvent) {
        return { isValid: false, error: 'Événement de transfert non trouvé' };
      }

      // Décoder le montant (dernier paramètre du log)
      const amount = this.web3.utils.hexToNumberString(transferEvent.data);

      return {
        isValid: receipt.status,
        amount: this.web3.utils.fromWei(amount, 'ether'),
        from: tx.from,
        confirmations,
      };
    } catch (error) {
      console.error('Erreur lors de la vérification SHIBA:', error);
      return { isValid: false, error: 'Erreur de vérification' };
    }
  }

  public async verifyDogeTransaction(txHash: string): Promise<TransactionVerification> {
    // Note: Pour DOGE, vous devrez utiliser une API externe car Web3 ne supporte pas directement DOGE
    try {
      const response = await fetch(
        `${process.env.REACT_APP_DOGE_API_URL}/api/v2/tx/${txHash}`
      );

      if (!response.ok) {
        throw new Error('Transaction non trouvée');
      }

      const data = await response.json();

      // Vérifier que la transaction est destinée à notre adresse
      const isToOurAddress = data.vout.some(
        (output: any) =>
          output.scriptPubKey.addresses?.includes(cryptoAddresses.DOGE)
      );

      if (!isToOurAddress) {
        return { isValid: false, error: 'Adresse de destination invalide' };
      }

      // Trouver le montant envoyé à notre adresse
      const amount = data.vout
        .filter((output: any) =>
          output.scriptPubKey.addresses?.includes(cryptoAddresses.DOGE)
        )
        .reduce((sum: number, output: any) => sum + output.value, 0);

      return {
        isValid: data.confirmations > 0,
        amount: amount.toString(),
        from: data.vin[0].addresses?.[0],
        confirmations: data.confirmations,
      };
    } catch (error) {
      console.error('Erreur lors de la vérification DOGE:', error);
      return { isValid: false, error: 'Erreur de vérification' };
    }
  }

  public async verifyTransaction(
    cryptoSymbol: string,
    txHash: string
  ): Promise<TransactionVerification> {
    switch (cryptoSymbol.toUpperCase()) {
      case 'ETH':
        return this.verifyEthTransaction(txHash);
      case 'BNB':
        return this.verifyBnbTransaction(txHash);
      case 'SHIBA':
        return this.verifyShibaTransaction(txHash);
      case 'DOGE':
        return this.verifyDogeTransaction(txHash);
      default:
        return { isValid: false, error: 'Crypto-monnaie non supportée' };
    }
  }
}

export const transactionVerificationService = TransactionVerificationService.getInstance();
export default transactionVerificationService;
