import { MCPServer, MCPTool } from "mcp-framework";
import { z } from "zod";
import AppointmentGet_ID from "./tools/appoitments_id.js";
import AppointmentsCreate from "./tools/appoitment_create.js";
import AppointmentsList from "./tools/appointment_list.js";
/* ================================
   MCP SERVER
================================ */
const server = new MCPServer({
    name: "medlink",
    version: "1.0.0",
    transport: {
        type: "http-stream",
        options: {
            port: 8080,
            endpoint: "/mcp",
            responseMode: "batch",
            cors: {
                allowOrigin: "*",
                allowMethods: "GET, POST, OPTIONS",
                allowHeaders: "Content-Type, Accept, Mcp-Session-Id",
            },
            session: {
                enabled: true,
            },
        },
    },
});
/* ================================
   TOOLS
================================ */
/* ================================
   START
================================ */
await server.start();
console.log("✅ MCP HTTP Stream server running on http://localhost:8080/mcp");
//# sourceMappingURL=mcp-server.js.map