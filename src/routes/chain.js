import { Router } from "express";
import { snapshot } from "../data/chainStore.js";

const router = Router();

// The wallet's current goal and progress, built from on-chain events.
router.get("/goal", (req, res) => {
  const { goal } = snapshot();
  if (!goal) return res.status(404).json({ error: "No goal recorded on-chain for this wallet yet" });
  res.json(goal);
});

// Every contribution recorded on-chain since the current goal was set.
router.get("/transactions", (req, res) => {
  res.json({ contributions: snapshot().contributions });
});

export default router;
