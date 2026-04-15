import { api } from './api';

export const tabletConnectionsAPI = {
  connect: async (roomCode: string, teamName: string, teamColor: string) => {
    const response = await api.post('/sessions/tablet-connections/connect/', {
      room_code: roomCode,
      team_name: teamName,
      team_color: teamColor,
    });
    return response.data;
  },

  reconnect: async (teamSessionToken: string) => {
    const response = await api.post('/sessions/tablet-connections/reconnect/', {
      team_session_token: teamSessionToken,
    });
    return response.data;
  },

  getStatus: async (connectionId: string) => {
    const response = await api.get(
      `/sessions/tablet-connections/status/?connection_id=${connectionId}`
    );
    return response.data;
  },

  disconnect: async (connectionId: number) => {
    const response = await api.post(
      `/sessions/tablet-connections/${connectionId}/disconnect/`
    );
    return response.data;
  },
};
