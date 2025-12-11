import express from "express";
import db from "./db/db.js";

const router = express.Router();
const log = (...args) => console.log("[MCP]", new Date().toISOString(), ...args);

// CORS/preflight for MCP paths (LM Studio may send OPTIONS)
router.options(/^\/mcp(?:\/.*)?$/, (req, res) => {
  log("OPTIONS", req.originalUrl);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Cache-Control");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.sendStatus(200);
});

// SSE endpoint for MCP (LM Studio expects SSE)
router.get("/mcp/sse", (req, res) => {
  log("SSE connect", req.originalUrl, "ua:", req.headers["user-agent"]);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

  // Push headers immediately
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  // Initial event so client considers connection established
  res.write(`event: message\ndata: ${JSON.stringify({ type: "connection", status: "connected" })}\n\n`);

  // Keep-alive pings every 5s (to avoid idle timeouts)
  const keepAlive = setInterval(() => res.write(`: keepalive\n\n`), 5000);

  // Clean up on close/error
  const closeHandler = () => {
    log("SSE closed", req.originalUrl);
    clearInterval(keepAlive);
    res.end();
  };

  req.on("close", closeHandler);
  req.on("error", closeHandler);
});

// MCP Protocol implementation for LM Studio
// Based on Model Context Protocol specification

// Initialize MCP - returns available tools
router.post("/mcp/initialize", (req, res) => {
  log("POST /mcp/initialize");
  res.json({
    protocolVersion: "2024-11-05",
    capabilities: {
      tools: {}
    },
    serverInfo: {
      name: "medlink-mcp-server",
      version: "1.0.0"
    }
  });
});

// List available tools
router.post("/mcp/tools/list", (req, res) => {
  log("POST /mcp/tools/list");
  res.json({
    tools: [
      {
        name: "appointments_list",
        description: "Get a list of all appointments with optional filters",
        inputSchema: {
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
        name: "appointments_get",
        description: "Get a single appointment by ID",
        inputSchema: {
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
        name: "appointments_create",
        description: "Create a new appointment",
        inputSchema: {
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
              description: "Appointment date (YYYY-MM-DD format, optional, defaults to today)"
            },
            time: {
              type: "string",
              description: "Appointment time (HH:MM:SS format, optional, defaults to current time)"
            }
          },
          required: ["patientId", "doctorId", "name", "complaint", "priority"]
        }
      },
      {
        name: "appointments_update",
        description: "Update an existing appointment",
        inputSchema: {
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
        name: "appointments_delete",
        description: "Delete an appointment by ID",
        inputSchema: {
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
    ]
  });
});

// Call a tool
router.post("/mcp/tools/call", async (req, res) => {
  const { name, arguments: args } = req.body;
  log("POST /mcp/tools/call", name, args ? Object.keys(args) : "no-args");

  try {
    let result;

    switch (name) {
      case "appointments_list": {
        let query = `
          SELECT a.*, u.name AS patientName
          FROM Appointment a
          JOIN User u ON a.patientId = u.id
          WHERE 1=1
        `;
        const params = [];

        if (args.patientId) {
          query += " AND a.patientId = ?";
          params.push(args.patientId);
        }
        if (args.doctorId) {
          query += " AND a.doctorId = ?";
          params.push(args.doctorId);
        }
        if (args.priority) {
          query += " AND a.priority = ?";
          params.push(args.priority);
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
        result = stmt.all(...params);
        break;
      }

      case "appointments_get": {
        const stmt = db.prepare(`
          SELECT a.*, u.name AS patientName
          FROM Appointment a
          JOIN User u ON a.patientId = u.id
          WHERE a.id = ?
        `);
        result = stmt.get(args.id);
        if (!result) {
          return res.json({
            content: [
              {
                type: "text",
                text: `Appointment with ID ${args.id} not found`
              }
            ],
            isError: true
          });
        }
        break;
      }

      case "appointments_create": {
        // Validate patient and doctor exist
        const patient = db.prepare("SELECT * FROM User WHERE id = ?").get(args.patientId);
        const doctor = db.prepare("SELECT * FROM User WHERE id = ?").get(args.doctorId);

        if (!patient) {
          return res.json({
            content: [
              {
                type: "text",
                text: `Patient with ID ${args.patientId} not found`
              }
            ],
            isError: true
          });
        }
        if (!doctor) {
          return res.json({
            content: [
              {
                type: "text",
                text: `Doctor with ID ${args.doctorId} not found`
              }
            ],
            isError: true
          });
        }

        if (patient.role !== "patient") {
          return res.json({
            content: [
              {
                type: "text",
                text: `User with ID ${args.patientId} is not a patient`
              }
            ],
            isError: true
          });
        }
        if (doctor.role !== "doctor") {
          return res.json({
            content: [
              {
                type: "text",
                text: `User with ID ${args.doctorId} is not a doctor`
              }
            ],
            isError: true
          });
        }

        const now = new Date();
        const date = args.date || now.toISOString().split("T")[0];
        const time = args.time || now.toTimeString().substring(0, 8);

        const stmt = db.prepare(`
          INSERT INTO Appointment (patientId, doctorId, name, complaint, priority, date, time)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const insertResult = stmt.run(
          args.patientId,
          args.doctorId,
          args.name,
          args.complaint,
          args.priority,
          date,
          time
        );

        const newAppointment = db.prepare(`
          SELECT a.*, u.name AS patientName
          FROM Appointment a
          JOIN User u ON a.patientId = u.id
          WHERE a.id = ?
        `).get(insertResult.lastInsertRowid);

        result = newAppointment;
        break;
      }

      case "appointments_update": {
        // Check if appointment exists
        const existing = db.prepare("SELECT * FROM Appointment WHERE id = ?").get(args.id);
        if (!existing) {
          return res.json({
            content: [
              {
                type: "text",
                text: `Appointment with ID ${args.id} not found`
              }
            ],
            isError: true
          });
        }

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (args.name !== undefined) {
          updates.push("name = ?");
          values.push(args.name);
        }
        if (args.complaint !== undefined) {
          updates.push("complaint = ?");
          values.push(args.complaint);
        }
        if (args.priority !== undefined) {
          updates.push("priority = ?");
          values.push(args.priority);
        }
        if (args.date !== undefined) {
          updates.push("date = ?");
          values.push(args.date);
        }
        if (args.time !== undefined) {
          updates.push("time = ?");
          values.push(args.time);
        }

        if (updates.length === 0) {
          return res.json({
            content: [
              {
                type: "text",
                text: "No fields to update"
              }
            ],
            isError: true
          });
        }

        values.push(args.id);
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
        `).get(args.id);

        result = updated;
        break;
      }

      case "appointments_delete": {
        const existing = db.prepare("SELECT * FROM Appointment WHERE id = ?").get(args.id);
        if (!existing) {
          return res.json({
            content: [
              {
                type: "text",
                text: `Appointment with ID ${args.id} not found`
              }
            ],
            isError: true
          });
        }

        const stmt = db.prepare("DELETE FROM Appointment WHERE id = ?");
        stmt.run(args.id);

        result = { message: `Appointment ${args.id} deleted successfully` };
        break;
      }

      default:
        return res.json({
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`
            }
          ],
          isError: true
        });
    }

    res.json({
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    });
  } catch (error) {
    console.error("MCP tool call error:", error);
    res.json({
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    });
  }
});

export default router;

