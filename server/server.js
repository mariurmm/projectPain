import express from "express";  
import authRouter from "./routes/auth_back.js";
import cors from "cors";
import appointmentRouter from "./routes/appointment.js";
import mcpRouter from "./mcp-server.js";

const app = express();
const port = 3000;
app.use(cors({
  origin: "*",
  credentials: true,
}));
app.use(express.json());
app.use("/auth" , authRouter),
app.use("/api" , appointmentRouter),
app.use(mcpRouter);
    

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`MCP server available at http://localhost:${port}/mcp`);
});