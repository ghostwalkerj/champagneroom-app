import cors from "cors";
import express from "express";
import { handler } from "../build/handler.js";

const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

const app = express();

// add a route that lives separately from the SvelteKit app
app.get("/healthcheck", (req, res) => {
  res.end("ok");
});

// let SvelteKit handle everything else, including serving prerendered pages and static assets
app.use(cors(corsOptions), handler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("listening on port", port);
});
