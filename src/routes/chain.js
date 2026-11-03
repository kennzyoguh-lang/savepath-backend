import { Router } from "express";
import { snapshot } from "../data/chainStore.js";

const router = Router();

// The wallet's current goal and progress, built from on-chain events.
router.get("/goal", (req, res) => {
  const { goal } = snapshot();
  // 200 with null while the wallet has no goal on-chain yet (not an error)
  res.json(goal);
});

// Every contribution recorded on-chain since the current goal was set.
router.get("/transactions", (req, res) => {
  res.json({ contributions: snapshot().contributions });
});

export default router;
