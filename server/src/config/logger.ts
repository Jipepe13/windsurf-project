import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Créer le dossier logs s'il n'existe pas
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const errorLogPath = path.join(logDir, 'error.log');
const combinedLogPath = path.join(logDir, 'combined.log');

// Format personnalisé pour les logs
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: customFormat,
  defaultMeta: { service: 'webchat-service' },
  transports: [
    // Écrire tous les logs avec niveau 'error' et inférieur dans error.log
    new winston.transports.File({
      filename: errorLogPath,
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Écrire tous les logs avec niveau 'info' et inférieur dans combined.log
    new winston.transports.File({
      filename: combinedLogPath,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  // Gestion des exceptions non gérées
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  // Gestion des rejets de promesses non gérés
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Ajouter les logs dans la console en développement
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Créer une interface personnalisée pour le logger
export interface CustomLogger {
  error(message: string, ...meta: any[]): void;
  warn(message: string, ...meta: any[]): void;
  info(message: string, ...meta: any[]): void;
  debug(message: string, ...meta: any[]): void;
}

// Fonction pour nettoyer les anciens fichiers de log
const cleanOldLogs = () => {
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 jours
  fs.readdir(logDir, (err, files) => {
    if (err) {
      logger.error('Erreur lors de la lecture du dossier de logs:', err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(logDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          logger.error(`Erreur lors de la lecture des stats du fichier ${file}:`, err);
          return;
        }

        if (Date.now() - stats.mtime.getTime() > maxAge) {
          fs.unlink(filePath, (err) => {
            if (err) {
              logger.error(`Erreur lors de la suppression du fichier ${file}:`, err);
              return;
            }
            logger.info(`Ancien fichier de log supprimé: ${file}`);
          });
        }
      });
    });
  });
};

// Nettoyer les anciens logs tous les jours
setInterval(cleanOldLogs, 24 * 60 * 60 * 1000);

export default logger as CustomLogger;
