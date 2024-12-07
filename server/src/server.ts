import { httpServer } from './app';
import mongoose from 'mongoose';
import { config } from 'dotenv';

config();

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/webchat';

// Connexion à MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connecté à MongoDB');
  })
  .catch((err) => {
    console.error('❌ Erreur de connexion MongoDB:', err);
    process.exit(1);
  });

// Démarrage du serveur
httpServer.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
