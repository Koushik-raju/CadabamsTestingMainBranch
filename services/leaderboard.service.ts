import { backendClient } from '@/lib/api-client';
import { BACKEND_URL } from '@/config/env';

export const leaderboardService = {
  async getLeaderboard(params?: Record<string, unknown>) {
    const res = await backendClient.get(`${BACKEND_URL}/leaderboard`, { params });
    return res.data;
  },
};
