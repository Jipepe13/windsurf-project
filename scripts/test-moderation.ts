import { moderationService } from '../src/services/moderationService';
import { authService } from '../src/services/authService';

async function testModeration() {
  try {
    console.log('🚀 Démarrage des tests de modération...');

    // 1. Création des utilisateurs de test
    console.log('\n1️⃣ Création des utilisateurs de test...');
    
    const admin = await authService.register({
      name: 'Admin Test',
      email: 'admin@test.com',
      password: 'password123',
    });

    const moderator = await authService.register({
      name: 'Moderator Test',
      email: 'mod@test.com',
      password: 'password123',
    });

    const user1 = await authService.register({
      name: 'User Test 1',
      email: 'user1@test.com',
      password: 'password123',
    });

    const user2 = await authService.register({
      name: 'User Test 2',
      email: 'user2@test.com',
      password: 'password123',
    });

    console.log('✅ Utilisateurs créés avec succès');

    // 2. Connexion en tant qu'admin
    console.log('\n2️⃣ Connexion en tant qu\'admin...');
    const adminLogin = await authService.login({
      email: 'admin@test.com',
      password: 'password123',
    });
    console.log('✅ Connecté en tant qu\'admin');

    // 3. Promotion d'un modérateur
    console.log('\n3️⃣ Promotion d\'un utilisateur en modérateur...');
    await moderationService.promoteModerator(moderator.id);
    console.log('✅ Modérateur promu avec succès');

    // 4. Test des fonctionnalités de modération
    console.log('\n4️⃣ Test du bannissement...');
    await moderationService.banUser(user1.id, {
      reason: 'Test de bannissement',
      duration: 24,
    });
    console.log('✅ Utilisateur banni avec succès');

    // 5. Vérification de l'historique des bans
    console.log('\n5️⃣ Vérification de l\'historique des bans...');
    const banHistory = await moderationService.getBanHistory(user1.id);
    console.log('Historique des bans:', banHistory);

    // 6. Test du système de signalement
    console.log('\n6️⃣ Test du système de signalement...');
    await moderationService.reportUser(user2.id, 'Test de signalement');
    console.log('✅ Utilisateur signalé avec succès');

    // 7. Vérification des signalements
    console.log('\n7️⃣ Vérification des signalements...');
    const reports = await moderationService.getReports();
    console.log('Signalements:', reports);

    // 8. Résolution d'un signalement
    console.log('\n8️⃣ Résolution du signalement...');
    if (reports.length > 0) {
      await moderationService.resolveReport(reports[0].id, 'Test de résolution');
      console.log('✅ Signalement résolu avec succès');
    }

    // 9. Débannissement
    console.log('\n9️⃣ Test du débannissement...');
    await moderationService.unbanUser(user1.id);
    console.log('✅ Utilisateur débanni avec succès');

    // 10. Révocation du modérateur
    console.log('\n🔟 Révocation du modérateur...');
    await moderationService.revokeModerator(moderator.id);
    console.log('✅ Modérateur révoqué avec succès');

    console.log('\n✨ Tous les tests sont terminés avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

// Exécuter les tests
testModeration();
