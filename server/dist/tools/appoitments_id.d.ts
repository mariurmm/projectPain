import { MCPTool } from "mcp-framework";
import { z } from "zod";
interface AppointmentID {
    id: number;
}
export default class AppointmentGet_ID extends MCPTool<AppointmentID> {
    name: string;
    description: string;
    schema: z.ZodObject<{
        id: z.ZodNumber;
    }, z.core.$strip>;
    execute({ id }: AppointmentID): Promise<{}>;
}
export {};
//# sourceMappingURL=appoitments_id.d.ts.map