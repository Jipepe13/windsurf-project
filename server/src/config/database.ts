import mongoose from 'mongoose';
import logger from './logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/webchat';
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 secondes

const connectWithRetry = async (retryCount = 0): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI, {
      autoIndex: true, // Construire les index en production
      serverSelectionTimeoutMS: 5000, // Timeout de la sélection du serveur
      socketTimeoutMS: 45000, // Timeout des opérations de socket
      family: 4, // Utiliser IPv4, ignorer IPv6
    });

    logger.info('Connexion à MongoDB établie avec succès');

    // Gérer la déconnexion
    mongoose.connection.on('disconnected', () => {
      logger.warn('Déconnexion de MongoDB, tentative de reconnexion...');
      setTimeout(() => connectWithRetry(0), RETRY_INTERVAL);
    });

    // Gérer les erreurs
    mongoose.connection.on('error', (err) => {
      logger.error('Erreur de connexion MongoDB:', err);
      if (retryCount < MAX_RETRIES) {
        logger.info(`Tentative de reconnexion ${retryCount + 1}/${MAX_RETRIES}...`);
        setTimeout(() => connectWithRetry(retryCount + 1), RETRY_INTERVAL);
      } else {
        logger.error('Nombre maximum de tentatives de reconnexion atteint');
        process.exit(1);
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la connexion à MongoDB:', error);
    if (retryCount < MAX_RETRIES) {
      logger.info(`Tentative de reconnexion ${retryCount + 1}/${MAX_RETRIES}...`);
      setTimeout(() => connectWithRetry(retryCount + 1), RETRY_INTERVAL);
    } else {
      logger.error('Nombre maximum de tentatives de reconnexion atteint');
      process.exit(1);
    }
  }
};

export default connectWithRetry;

// Gestion propre de la fermeture
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info('Connexion MongoDB fermée suite à l\'arrêt de l\'application');
    process.exit(0);
  } catch (error) {
    logger.error('Erreur lors de la fermeture de la connexion MongoDB:', error);
    process.exit(1);
  }
});
