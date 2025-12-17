import { MCPServer, MCPTool } from "mcp-framework";
import { z } from "zod";
import db from "../db/db.js";
export default class AppointmentsCreate extends MCPTool {
    name = "appointments-create";
    description = "Create a new appointment";
    // Схема валидации входных данных через zod
    schema = z.object({
        patientId: z.number(),
        doctorId: z.number(),
        name: z.string().min(1),
        complaint: z.string().min(1),
        priority: z.enum(["Высокий", "Средний", "Лёгкий"]),
        date: z.string().optional(),
        time: z.string().optional(),
    });
    // Метод execute с бизнес-логикой
    async execute({ patientId, doctorId, name, complaint, priority, date, time }) {
        const patient = db.prepare("SELECT * FROM User WHERE id = ? AND role == 'patient'").get(patientId);
        const doctor = db.prepare("SELECT * FROM User WHERE id = ? AND role == 'doctor'").get(doctorId);
        if (!patient) {
            throw new Error("Invalid patient");
        }
        if (!doctor) {
            throw new Error("Invalid doctor");
        }
        const now = new Date();
        const finalDate = date ?? now.toISOString().split("T")[0];
        const finalTime = time ?? now.toTimeString().substring(0, 8);
        const result = db.prepare(`
      INSERT INTO Appointment
      (patientId, doctorId, name, complaint, priority, date, time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(patientId, doctorId, name, complaint, priority, finalDate, finalTime);
        return db.prepare(`
      SELECT a.*, u.name AS patientName
      FROM Appointment a
      JOIN User u ON a.patientId = u.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);
    }
}
//# sourceMappingURL=appoitment_create.js.map