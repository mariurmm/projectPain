import DataBase from "better-sqlite3";

const db = new DataBase("medlink.db");

db.exec(`CREATE TABLE IF NOT EXISTS User(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('patient', 'doctor'))
    )`);
db.exec(`CREATE TABLE IF NOT EXISTS Appointment(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patientId INTEGER NOT NULL,
    doctorId INTEGER NOT NULL,
    name TEXT NOT NULL,
    complaint TEXT NOT NULL,
    priority TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,

    FOREIGN KEY(patientId) REFERENCES User(id),
    FOREIGN KEY(doctorId) REFERENCES User(id)
    )`);
export default db;