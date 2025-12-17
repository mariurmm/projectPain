import express from "express";
import db from "../db/db.js";
const router = express.Router();
import axios from "axios";
const BASE_URL = "http://127.0.0.1:1234"; //Свой URL
const MODEL = "google/gemma-2-9b"; // название
//Сообщение кидает в LM Studio и возвращает ответ
router.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const response = await axios.post(
      "http://127.0.0.1:1234/v1/chat/completions",
      {
        model: "google/gemma-2-9b",
        messages: [
          {
            role: "system",
            content:
              'Отвечай СТРОГО в формате JSON. Только один объект. Без markdown. Формат: {"aiResponse":"string"}'
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 512,
        temperature: 0.3
      }
    );

    const aiText = response.data.choices?.[0]?.message?.content;

    if (!aiText) {
      return res.status(500).json({ error: "Empty response from model" });
    }

    // вытаскиваем JSON
    const match = aiText.match(/\{[\s\S]*?\}/);

    if (!match) {
      return res.status(500).json({
        error: "No JSON found in model response",
        raw: aiText
      });
    }

    const parsed = JSON.parse(match[0]);
    return res.json({
  aiResponse: parsed.aiResponse // или aiMessage
});

  } catch (err) {
    console.error("LM Studio error:", err.message);
    return res.status(500).json({ error: "Error communicating with LM Studio" });
  }
});

router.get("/patient/appointment",  async (req, res) => {
  try {
    const userId = req.user.id; 
    const role = req.user.role;

    if (role !== "patient") {
      return res.status(403).json({ message: "Access denied" });
    }

    const result = await db.query(
      `
      SELECT 
        a.id,
        a.complaint,
        a.priority,
        a.status,
        u.name AS "doctorName"
      FROM appointments a
      LEFT JOIN users u ON u.id = a.doctor_id
      WHERE a.patient_id = $1
      ORDER BY a.id DESC
      LIMIT 1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json(null); // ← фронт это уже обрабатывает
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Patient appointment error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update appointment
router.put("/appointments/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, complaint, priority, date, time } = req.body;

        // Check if appointment exists
        const existing = db.prepare("SELECT * FROM Appointment WHERE id = ?").get(id);
        if (!existing) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push("name = ?");
            values.push(name);
        }
        if (complaint !== undefined) {
            updates.push("complaint = ?");
            values.push(complaint);
        }
        if (priority !== undefined) {
            updates.push("priority = ?");
            values.push(priority);
        }
        if (date !== undefined) {
            updates.push("date = ?");
            values.push(date);
        }
        if (time !== undefined) {
            updates.push("time = ?");
            values.push(time);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: "No fields to update" });
        }

        values.push(id);
        const stmt = db.prepare(`
            UPDATE Appointment 
            SET ${updates.join(", ")}
            WHERE id = ?
        `);
        stmt.run(...values);

        const updated = db.prepare(`
            SELECT a.*, u.name AS patientName
            FROM Appointment a
            JOIN User u ON a.patientId = u.id
            WHERE a.id = ?
        `).get(id);

        res.json(updated);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete appointment
router.delete("/appointments/:id", (req, res) => {
    try {
        const { id } = req.params;
        
        const existing = db.prepare("SELECT * FROM Appointment WHERE id = ?").get(id);
        if (!existing) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        const stmt = db.prepare("DELETE FROM Appointment WHERE id = ?");
        stmt.run(id);

        res.json({ message: "Appointment deleted successfully" });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Function calling endpoint for LM Studio
router.post("/chat-with-functions", async (req, res) => {
    const { messages, functions } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array is required" });
    }

    const lastMessage = messages[messages.length - 1];
    const userPrompt = lastMessage.content || lastMessage.prompt;

    if (!userPrompt) {
        return res.status(400).json({ error: "Message content is required" });
    }

    try {
        // Define function schemas for OpenAI-compatible function calling
        const functionDefinitions = [
            {
                name: "getAppointments",
                description: "Get a list of appointments with optional filters",
                parameters: {
                    type: "object",
                    properties: {
                        patientId: {
                            type: "number",
                            description: "Filter by patient ID (optional)"
                        },
                        doctorId: {
                            type: "number",
                            description: "Filter by doctor ID (optional)"
                        },
                        priority: {
                            type: "string",
                            description: "Filter by priority: Высокий, Средний, Лёгкий (optional)"
                        }
                    }
                }
            },
            {
                name: "getAppointment",
                description: "Get a single appointment by ID",
                parameters: {
                    type: "object",
                    properties: {
                        id: {
                            type: "number",
                            description: "Appointment ID"
                        }
                    },
                    required: ["id"]
                }
            },
            {
                name: "createAppointment",
                description: "Create a new appointment",
                parameters: {
                    type: "object",
                    properties: {
                        patientId: {
                            type: "number",
                            description: "Patient ID"
                        },
                        doctorId: {
                            type: "number",
                            description: "Doctor ID"
                        },
                        name: {
                            type: "string",
                            description: "Patient name"
                        },
                        complaint: {
                            type: "string",
                            description: "Medical complaint/description"
                        },
                        priority: {
                            type: "string",
                            description: "Priority level: Высокий, Средний, or Лёгкий"
                        },
                        date: {
                            type: "string",
                            description: "Appointment date (YYYY-MM-DD format, optional)"
                        },
                        time: {
                            type: "string",
                            description: "Appointment time (HH:MM:SS format, optional)"
                        }
                    },
                    required: ["patientId", "doctorId", "name", "complaint", "priority"]
                }
            },
            {
                name: "updateAppointment",
                description: "Update an existing appointment",
                parameters: {
                    type: "object",
                    properties: {
                        id: {
                            type: "number",
                            description: "Appointment ID"
                        },
                        name: {
                            type: "string",
                            description: "Patient name (optional)"
                        },
                        complaint: {
                            type: "string",
                            description: "Medical complaint/description (optional)"
                        },
                        priority: {
                            type: "string",
                            description: "Priority level: Высокий, Средний, or Лёгкий (optional)"
                        },
                        date: {
                            type: "string",
                            description: "Appointment date (YYYY-MM-DD format, optional)"
                        },
                        time: {
                            type: "string",
                            description: "Appointment time (HH:MM:SS format, optional)"
                        }
                    },
                    required: ["id"]
                }
            },
            {
                name: "deleteAppointment",
                description: "Delete an appointment by ID",
                parameters: {
                    type: "object",
                    properties: {
                        id: {
                            type: "number",
                            description: "Appointment ID"
                        }
                    },
                    required: ["id"]
                }
            }
        ];

        // Send request to LM Studio with function calling
        const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
            model: MODEL,
            messages: messages.map(msg => ({
                role: msg.role || "user",
                content: msg.content || msg.prompt
            })),
            functions: functionDefinitions,
            function_call: "auto",
            temperature: 0.7,
            max_tokens: 1000
        });

        const aiResponse = response.data.choices[0].message;

        // Check if AI wants to call a function
        if (aiResponse.function_call) {
            const functionName = aiResponse.function_call.name;
            let functionArgs;
            
            try {
                functionArgs = JSON.parse(aiResponse.function_call.arguments);
            } catch (error) {
                return res.status(500).json({ 
                    error: "Failed to parse function arguments",
                    raw: aiResponse.function_call.arguments
                });
            }

            // Execute the function
            let functionResult;
            
            switch (functionName) {
                case "getAppointments": {
                    let query = `
                        SELECT a.*, u.name AS patientName
                        FROM Appointment a
                        JOIN User u ON a.patientId = u.id
                        WHERE 1=1
                    `;
                    const params = [];

                    if (functionArgs.patientId) {
                        query += " AND a.patientId = ?";
                        params.push(functionArgs.patientId);
                    }
                    if (functionArgs.doctorId) {
                        query += " AND a.doctorId = ?";
                        params.push(functionArgs.doctorId);
                    }
                    if (functionArgs.priority) {
                        query += " AND a.priority = ?";
                        params.push(functionArgs.priority);
                    }

                    query += `
                        ORDER BY 
                            CASE a.priority
                                WHEN 'Высокий' THEN 1
                                WHEN 'Средний' THEN 2
                                WHEN 'Лёгкий' THEN 3
                                ELSE 4
                            END ASC,
                            a.date DESC,
                            a.time DESC
                    `;

                    const stmt = db.prepare(query);
                    functionResult = stmt.all(...params);
                    break;
                }

                case "getAppointment": {
                    const stmt = db.prepare(`
                        SELECT a.*, u.name AS patientName
                        FROM Appointment a
                        JOIN User u ON a.patientId = u.id
                        WHERE a.id = ?
                    `);
                    functionResult = stmt.get(functionArgs.id);
                    if (!functionResult) {
                        functionResult = { error: `Appointment with ID ${functionArgs.id} not found` };
                    }
                    break;
                }

                case "createAppointment": {
                    const patient = db.prepare("SELECT * FROM User WHERE id = ?").get(functionArgs.patientId);
                    const doctor = db.prepare("SELECT * FROM User WHERE id = ?").get(functionArgs.doctorId);

                    if (!patient) {
                        functionResult = { error: `Patient with ID ${functionArgs.patientId} not found` };
                        break;
                    }
                    if (!doctor) {
                        functionResult = { error: `Doctor with ID ${functionArgs.doctorId} not found` };
                        break;
                    }

                    if (patient.role !== "patient") {
                        functionResult = { error: `User with ID ${functionArgs.patientId} is not a patient` };
                        break;
                    }
                    if (doctor.role !== "doctor") {
                        functionResult = { error: `User with ID ${functionArgs.doctorId} is not a doctor` };
                        break;
                    }

                    const now = new Date();
                    const date = functionArgs.date || now.toISOString().split("T")[0];
                    const time = functionArgs.time || now.toTimeString().substring(0, 8);

                    const stmt = db.prepare(`
                        INSERT INTO Appointment (patientId, doctorId, name, complaint, priority, date, time)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `);
                    const insertResult = stmt.run(
                        functionArgs.patientId,
                        functionArgs.doctorId,
                        functionArgs.name,
                        functionArgs.complaint,
                        functionArgs.priority,
                        date,
                        time
                    );

                    const newAppointment = db.prepare(`
                        SELECT a.*, u.name AS patientName
                        FROM Appointment a
                        JOIN User u ON a.patientId = u.id
                        WHERE a.id = ?
                    `).get(insertResult.lastInsertRowid);

                    functionResult = newAppointment;
                    break;
                }

                case "updateAppointment": {
                    const existing = db.prepare("SELECT * FROM Appointment WHERE id = ?").get(functionArgs.id);
                    if (!existing) {
                        functionResult = { error: `Appointment with ID ${functionArgs.id} not found` };
                        break;
                    }

                    const updates = [];
                    const values = [];

                    if (functionArgs.name !== undefined) {
                        updates.push("name = ?");
                        values.push(functionArgs.name);
                    }
                    if (functionArgs.complaint !== undefined) {
                        updates.push("complaint = ?");
                        values.push(functionArgs.complaint);
                    }
                    if (functionArgs.priority !== undefined) {
                        updates.push("priority = ?");
                        values.push(functionArgs.priority);
                    }
                    if (functionArgs.date !== undefined) {
                        updates.push("date = ?");
                        values.push(functionArgs.date);
                    }
                    if (functionArgs.time !== undefined) {
                        updates.push("time = ?");
                        values.push(functionArgs.time);
                    }

                    if (updates.length === 0) {
                        functionResult = { error: "No fields to update" };
                        break;
                    }

                    values.push(functionArgs.id);
                    const stmt = db.prepare(`
                        UPDATE Appointment 
                        SET ${updates.join(", ")}
                        WHERE id = ?
                    `);
                    stmt.run(...values);

                    const updated = db.prepare(`
                        SELECT a.*, u.name AS patientName
                        FROM Appointment a
                        JOIN User u ON a.patientId = u.id
                        WHERE a.id = ?
                    `).get(functionArgs.id);

                    functionResult = updated;
                    break;
                }

                case "deleteAppointment": {
                    const existing = db.prepare("SELECT * FROM Appointment WHERE id = ?").get(functionArgs.id);
                    if (!existing) {
                        functionResult = { error: `Appointment with ID ${functionArgs.id} not found` };
                        break;
                    }

                    const stmt = db.prepare("DELETE FROM Appointment WHERE id = ?");
                    stmt.run(functionArgs.id);

                    functionResult = { message: `Appointment ${functionArgs.id} deleted successfully` };
                    break;
                }

                default:
                    functionResult = { error: `Unknown function: ${functionName}` };
            }

            // Send function result back to AI for final response
            const finalResponse = await axios.post(`${BASE_URL}/v1/chat/completions`, {
                model: MODEL,
                messages: [
                    ...messages,
                    aiResponse,
                    {
                        role: "function",
                        name: functionName,
                        content: JSON.stringify(functionResult)
                    }
                ],
                functions: functionDefinitions,
                temperature: 0.7,
                max_tokens: 500
            });

            return res.json({
                reply: finalResponse.data.choices[0].message.content,
                function_called: functionName,
                function_result: functionResult
            });
        } else {
            // No function call, just return the AI response
            return res.json({
                reply: aiResponse.content
            });
        }
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ 
            error: "Error communicating with LM Studio",
            details: error.message
        });
    }
});

router.delete("/deleteAllPatients", (req, res)=>{
    db.prepare("DELETE FROM Appointment").run();
    db.prepare("DELETE FROM sqlite_sequence WHERE name='Appointment';").run();
     res.json({ message: "All tables cleared and IDs reset" });
})
export default router;