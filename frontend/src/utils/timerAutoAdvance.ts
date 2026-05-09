import { sessionsAPI } from '@/services';

export const advanceActivityOnTimerExpiration = async (gameSessionId: number | string) => {
  try {
    await sessionsAPI.nextActivity(gameSessionId);
  } catch (error) {
    console.error('[timerAutoAdvance] Error advancing activity on timer expiration:', error);
  }
};
