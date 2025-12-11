import express from "express";
import bcrypt from "bcrypt";
import db from "../db/db.js";
import jwt from "jsonwebtoken";
//Create User model
const router = express.Router();
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if(!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  try{
  const user = db.prepare("SELECT * FROM User WHERE email = ?").get(email);
  if(!user) {
    return res.status(400).json({ message: "User not found" });
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if(!isPasswordValid) {
    return res.status(400).json({ message: "Invalid password" });
  }
  const role = user.role;
  return res.status(200).json({ message: "Login successful", role: role, name: user.name });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/register", async (req, res) => {
  const { name, age, email, password, role } = req.body;
  if(!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  try{
  const existingUser = db.prepare("SELECT * FROM User WHERE email = ?").get(email);
  if(existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  db.prepare("INSERT INTO User (name, age, email, password, role) VALUES (?, ?, ?, ?, ?)").run(name, age, email, hashedPassword, role);
  return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});
router.get("/getAllUsers",  (req, res) => {
  const users = db.prepare("SELECT id, name, age, email, role FROM User").all();
  try{
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});
router.post("/logout", (req, res) => {
  return res.status(200).json({ message: "Logout successful" });
});
router.delete("/deleteAllUsers", (req, res)=>{
    db.prepare("DELETE FROM User").run();
    db.prepare("DELETE FROM sqlite_sequence WHERE name='User';").run();
     res.json({ message: "All tables cleared and IDs reset" });
});

export default router;