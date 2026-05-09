import { api } from './api';

export const tabletConnectionsAPI = {
  connect: async (roomCode: string, tabletCode: string) => {
    const response = await api.post('/sessions/tablet-connections/connect/', {
      room_code: roomCode,
      tablet_code: tabletCode,
    });
    return response.data;
  },

  getStatus: async (connectionId: string) => {
    const response = await api.get(`/sessions/tablet-connections/status/?connection_id=${connectionId}`);
    return response.data;
  },

  disconnect: async (connectionId: number) => {
    const response = await api.post(`/sessions/tablet-connections/${connectionId}/disconnect/`);
    return response.data;
  },
};

