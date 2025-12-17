import { MCPServer, MCPTool } from "mcp-framework";
import { z } from "zod";
import db from "../db/db.js";
export default class AppointmentsList extends MCPTool {
    name = "appointments-list";
    description = "Get a list of appointments with optional filters";
    schema = z.object({
        patientId: z.number().optional(),
        doctorId: z.number().optional(),
        priority: z.enum(["Высокий", "Средний", "Лёгкий"]).optional(),
    });
    async execute({ patientId, doctorId, priority }) {
        let query = `
      SELECT a.*, u.name AS patientName
      FROM Appointment a
      JOIN User u ON a.patientId = u.id
      WHERE 1=1
    `;
        const params = [];
        if (patientId) {
            query += " AND a.patientId = ?";
            params.push(patientId);
        }
        if (doctorId) {
            query += " AND a.doctorId = ?";
            params.push(doctorId);
        }
        if (priority) {
            query += " AND a.priority = ?";
            params.push(priority);
        }
        query += `
      ORDER BY
        CASE a.priority
          WHEN 'Высокий' THEN 1
          WHEN 'Средний' THEN 2
          WHEN 'Лёгкий' THEN 3
          ELSE 4
        END,
        a.date DESC,
        a.time DESC
    `;
        return db.prepare(query).all(...params);
    }
}
//# sourceMappingURL=appointment_list.js.map