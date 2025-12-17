import { MCPServer, MCPTool } from "mcp-framework";
import { z } from "zod";
import db from "../db/db.js";
export default class AppointmentGet_ID extends MCPTool {
    name = "appointment-get";
    description = "Get appointment by ID";
    schema = z.object({
        id: z.number(),
    });
    async execute({ id }) {
        const row = db.prepare(`
      SELECT a.*, u.name AS patientName
      FROM Appointment a
      JOIN User u ON a.patientId = u.id
      WHERE a.id = ?
    `).get(id);
        if (!row) {
            throw new Error(`Appointment ${id} not found`);
        }
        return row;
    }
}
//# sourceMappingURL=appoitments_id.js.map