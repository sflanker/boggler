
export const BogglerAPIResponse = {
  toGameState: function toGameState({ state: { board, moves, expiration }, current_time, state_token }) {
    return {
      board,
      wordList: moves.map(w => ({ value: w, accepted: true })),
      // Don't trust the local system clock
      timeRemaining: Math.max(0, expiration - current_time),
      localExpiration: new Date(Date.now() + (expiration - current_time) * 1000),
      stateToken: state_token
    };
  }
};
