// In-memory copy of what the wallet has recorded on the SavingsGoal contract.
// Filled by src/handlers/eventHandlers.js, read by src/routes/chain.js.
export const store = { goal: null, contributions: [] };

export function snapshot() {
  const { goal, contributions } = store;
  const totalContributed = contributions.at(-1)?.totalContributed ?? 0;
  return {
    goal: goal && {
      wallet: goal.wallet,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
      totalContributed,
      percentComplete: goal.targetAmount ? Math.min(100, Math.round((totalContributed / goal.targetAmount) * 100)) : 0,
      recordedAt: goal.recordedAt,
      explorerUrl: goal.explorerUrl,
    },
    contributions: contributions.map((c) => ({
      amount: c.amount,
      totalContributed: c.totalContributed,
      date: c.date,
      recordedAt: c.recordedAt,
      txHash: c.txHash,
      explorerUrl: c.explorerUrl,
    })),
  };
}
