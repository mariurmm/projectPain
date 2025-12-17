import { MCPTool } from "mcp-framework";
import { z } from "zod";
export default class AppointmentsCreate extends MCPTool {
    name: string;
    description: string;
    schema: z.ZodObject<{
        patientId: z.ZodNumber;
        doctorId: z.ZodNumber;
        name: z.ZodString;
        complaint: z.ZodString;
        priority: z.ZodEnum<{
            Высокий: "Высокий";
            Средний: "Средний";
            Лёгкий: "Лёгкий";
        }>;
        date: z.ZodOptional<z.ZodString>;
        time: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    execute({ patientId, doctorId, name, complaint, priority, date, time }: {
        patientId: number;
        doctorId: number;
        name: string;
        complaint: string;
        priority: "Высокий" | "Средний" | "Лёгкий";
        date?: string;
        time?: string;
    }): Promise<unknown>;
}
//# sourceMappingURL=appoitment_create.d.ts.map