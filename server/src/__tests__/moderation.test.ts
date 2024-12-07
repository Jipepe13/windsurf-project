import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User';
import { BanRecord } from '../models/BanRecord';
import { Report } from '../models/Report';
import { generateToken } from '../utils/auth';
import mongoose from 'mongoose';

describe('Moderation System Tests', () => {
  let adminToken: string;
  let moderatorToken: string;
  let userToken: string;
  let testUser: any;
  let testModerator: any;
  let testAdmin: any;
  let normalUser: any;

  beforeAll(async () => {
    // Connexion à la base de données de test
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/webchat_test');

    // Créer les utilisateurs de test
    testAdmin = await User.create({
      name: 'Admin Test',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
    });

    testModerator = await User.create({
      name: 'Moderator Test',
      email: 'moderator@test.com',
      password: 'password123',
      role: 'moderator',
    });

    normalUser = await User.create({
      name: 'Normal User',
      email: 'user@test.com',
      password: 'password123',
      role: 'user',
    });

    // Générer les tokens
    adminToken = generateToken(testAdmin);
    moderatorToken = generateToken(testModerator);
    userToken = generateToken(normalUser);
  });

  afterAll(async () => {
    // Nettoyer la base de données
    await User.deleteMany({});
    await BanRecord.deleteMany({});
    await Report.deleteMany({});
    await mongoose.connection.close();
  });

  describe('User Management', () => {
    test('Admin peut voir la liste des utilisateurs', async () => {
      const response = await request(app)
        .get('/api/moderation/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('Utilisateur normal ne peut pas voir la liste des utilisateurs', async () => {
      const response = await request(app)
        .get('/api/moderation/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Moderator Management', () => {
    test('Admin peut promouvoir un utilisateur en modérateur', async () => {
      const response = await request(app)
        .post(`/api/moderation/promote/${normalUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      const updatedUser = await User.findById(normalUser._id);
      expect(updatedUser?.role).toBe('moderator');
    });

    test('Modérateur ne peut pas promouvoir d\'autres utilisateurs', async () => {
      const newUser = await User.create({
        name: 'New User',
        email: 'newuser@test.com',
        password: 'password123',
        role: 'user',
      });

      const response = await request(app)
        .post(`/api/moderation/promote/${newUser._id}`)
        .set('Authorization', `Bearer ${moderatorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Ban System', () => {
    test('Modérateur peut bannir un utilisateur', async () => {
      const response = await request(app)
        .post(`/api/moderation/ban/${normalUser._id}`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({
          reason: 'Test ban',
          duration: 24,
        });

      expect(response.status).toBe(200);
      
      const bannedUser = await User.findById(normalUser._id);
      expect(bannedUser?.isBanned).toBe(true);
      
      const banRecord = await BanRecord.findOne({ userId: normalUser._id });
      expect(banRecord).toBeTruthy();
      expect(banRecord?.reason).toBe('Test ban');
    });

    test('Modérateur peut débannir un utilisateur', async () => {
      const response = await request(app)
        .post(`/api/moderation/unban/${normalUser._id}`)
        .set('Authorization', `Bearer ${moderatorToken}`);

      expect(response.status).toBe(200);
      
      const unbannedUser = await User.findById(normalUser._id);
      expect(unbannedUser?.isBanned).toBe(false);
    });
  });

  describe('Report System', () => {
    test('Utilisateur peut signaler un autre utilisateur', async () => {
      const response = await request(app)
        .post(`/api/moderation/report/${testModerator._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reason: 'Test report',
        });

      expect(response.status).toBe(200);
      
      const report = await Report.findOne({ 
        reportedUser: testModerator._id,
        reportedBy: normalUser._id,
      });
      expect(report).toBeTruthy();
      expect(report?.reason).toBe('Test report');
    });

    test('Modérateur peut voir les signalements', async () => {
      const response = await request(app)
        .get('/api/moderation/reports')
        .set('Authorization', `Bearer ${moderatorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('Modérateur peut résoudre un signalement', async () => {
      const report = await Report.findOne({ 
        reportedUser: testModerator._id,
        reportedBy: normalUser._id,
      });

      const response = await request(app)
        .post(`/api/moderation/resolve-report/${report?._id}`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({
          resolution: 'Test resolution',
        });

      expect(response.status).toBe(200);
      
      const resolvedReport = await Report.findById(report?._id);
      expect(resolvedReport?.status).toBe('resolved');
      expect(resolvedReport?.resolution).toBe('Test resolution');
    });
  });

  describe('Ban History', () => {
    test('Modérateur peut voir l\'historique des bans', async () => {
      const response = await request(app)
        .get(`/api/moderation/ban-history/${normalUser._id}`)
        .set('Authorization', `Bearer ${moderatorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });
});
