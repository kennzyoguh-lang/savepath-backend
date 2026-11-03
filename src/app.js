import "dotenv/config";
import express from "express";
import cors from "cors";
import aiRouter from "./routes/ai.js";
import chainRouter from "./routes/chain.js";
import { startEventListener } from "./services/eventListener.js";


const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "50kb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", aiMode: process.env.AI_MODE || "mock" });
});

app.use("/ai", aiRouter);
app.use("/", chainRouter);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

const port = process.env.PORT || 4000;
app.listen(port, () => {
   console.log(`Backend running on port ${port}`);
    startEventListener()
  });