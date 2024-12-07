import axios from 'axios';
import { getAuthToken } from '../utils/auth';

interface BanOptions {
  reason: string;
  duration: number; // en heures, -1 pour permanent
}

class ModerationService {
  private static instance: ModerationService;
  private baseURL: string;

  private constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  }

  public static getInstance(): ModerationService {
    if (!ModerationService.instance) {
      ModerationService.instance = new ModerationService();
    }
    return ModerationService.instance;
  }

  private getHeaders() {
    const token = getAuthToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  public async getUsers() {
    try {
      const response = await axios.get(`${this.baseURL}/api/moderation/users`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  }

  public async promoteModerator(userId: string) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/moderation/promote/${userId}`,
        {},
        {
          headers: this.getHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la promotion du modérateur:', error);
      throw error;
    }
  }

  public async revokeModerator(userId: string) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/moderation/revoke/${userId}`,
        {},
        {
          headers: this.getHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la révocation du modérateur:', error);
      throw error;
    }
  }

  public async banUser(userId: string, options: BanOptions) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/moderation/ban/${userId}`,
        options,
        {
          headers: this.getHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors du bannissement:', error);
      throw error;
    }
  }

  public async unbanUser(userId: string) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/moderation/unban/${userId}`,
        {},
        {
          headers: this.getHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors du débannissement:', error);
      throw error;
    }
  }

  public async getBanHistory(userId: string) {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/moderation/ban-history/${userId}`,
        {
          headers: this.getHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw error;
    }
  }

  public async reportUser(userId: string, reason: string) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/moderation/report/${userId}`,
        { reason },
        {
          headers: this.getHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors du signalement:', error);
      throw error;
    }
  }

  public async getReports() {
    try {
      const response = await axios.get(`${this.baseURL}/api/moderation/reports`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des signalements:', error);
      throw error;
    }
  }

  public async resolveReport(reportId: string, resolution: string) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/moderation/resolve-report/${reportId}`,
        { resolution },
        {
          headers: this.getHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la résolution du signalement:', error);
      throw error;
    }
  }
}

export const moderationService = ModerationService.getInstance();
export default moderationService;
