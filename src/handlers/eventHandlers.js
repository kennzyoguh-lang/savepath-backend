/* ============================================================
   PARTICIPANTS: THIS IS THE ONLY FILE YOU NEED TO EDIT

   The backend calls these two functions when your wallet's goal or
   contribution shows up on the SavingsGoal contract. You trigger
   them from the frontend (Set Goal and Record Contribution).

   Replace the console.log with your own logic: save the data to a
   database, build your own /goal and /transactions endpoints, send
   it to the AI endpoint, and so on.

   Use the raw fields (numbers and ISO dates) in your code.
   Use "display" only to show values to a person.
   Only events from the wallet in WALLET_ADDRESS (.env) arrive here.
   Amounts have no currency on-chain. In this project they are whole
   naira (100000 means NGN 100,000).
   ============================================================ */

import { store } from "../data/chainStore.js";

// A goal was set from your wallet.
// goal = {
//   event: "GoalCreated",
//   wallet: "0xA272...24E0",
//   targetAmount: 2000000,
//   targetDate: "2027-01-01",
//   targetDateUnix: 1798761600,
//   recordedAt: "2026-10-31T18:49:27.000Z",
//   blockNumber: 40188579,
//   txHash: "0x...",
//   explorerUrl: "https://celo-sepolia.blockscout.com/tx/0x...",
//   display: {
//     targetAmount: "2,000,000",
//     targetDate: "1 January 2027",
//     recordedAt: "31 October 2026, 18:49 UTC"
//   }
// }
// Setting a goal again replaces the old one and resets the total to 0.
export async function onGoalCreated(goal) {
  console.log("Goal created:", goal.display.targetAmount, "by", goal.display.targetDate);
  store.goal = goal;
  store.contributions = []; // a new goal resets the recorded total
}

// A contribution was recorded from your wallet.
// contribution = {
//   event: "ContributionRecorded",
//   wallet: "0xA272...24E0",
//   amount: 100000,
//   totalContributed: 100000,
//   date: "2026-10-31",
//   recordedAt: "2026-10-31T18:51:23.000Z",
//   blockNumber: 40188695,
//   txHash: "0x...",
//   explorerUrl: "https://celo-sepolia.blockscout.com/tx/0x...",
//   display: {
//     amount: "100,000",
//     totalContributed: "NGN 100,000",
//     date: "31 October 2026",
//     recordedAt: "31 October 2026, 18:51 UTC"
//   }
// }
export async function onContributionRecorded(contribution) {
  console.log("Contribution recorded:", contribution.display.amount, "total", contribution.display.totalContributed);
  store.contributions.push(contribution);
}