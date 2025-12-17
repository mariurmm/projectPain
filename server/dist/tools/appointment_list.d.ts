import { MCPTool } from "mcp-framework";
import { z } from "zod";
interface AppointmentsListInput {
    patientId?: number;
    doctorId?: number;
    priority?: "Высокий" | "Средний" | "Лёгкий";
}
export default class AppointmentsList extends MCPTool<AppointmentsListInput> {
    name: string;
    description: string;
    schema: z.ZodObject<{
        patientId: z.ZodOptional<z.ZodNumber>;
        doctorId: z.ZodOptional<z.ZodNumber>;
        priority: z.ZodOptional<z.ZodEnum<{
            Высокий: "Высокий";
            Средний: "Средний";
            Лёгкий: "Лёгкий";
        }>>;
    }, z.core.$strip>;
    execute({ patientId, doctorId, priority }: AppointmentsListInput): Promise<unknown[]>;
}
export {};
//# sourceMappingURL=appointment_list.d.ts.map