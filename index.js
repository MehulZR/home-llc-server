import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool();
const App = express();

App.use(cors({ origin: process.env.ORIGIN, credentials: true }));
App.use(cookieParser());
App.use(express.json());
App.use(express.urlencoded({ extended: true }));

App.post("/login", async (req, res) => {
  try {
    if (
      !Object.hasOwnProperty.call(req.body, "email") ||
      !Object.hasOwnProperty.call(req.body, "password")
    ) {
      res.status(400).send("Credentials Missing");
      return;
    }
    const dbResponse = await pool.query(
      "SELECT id, password FROM users WHERE email=$1",
      [req.body.email]
    );
    if (!dbResponse.rows.length) {
      res.status(400).send("No User Found");
      return;
    }
    const { id, password } = dbResponse.rows[0];
    const match = await bcrypt.compare(req.body.password, password);
    if (!match) {
      res.status(400).send("Wrong Credentials");
      return;
    }
    const token = jwt.sign({ id }, process.env.JWT_PRIVATE_KEY, {
      algorithm: "RS256",
      issuer: process.env.JWT_ISSUER,
    });
    res.cookie("Access_Token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      domain: process.env.DOMAIN,
    });
    res.cookie("LoggedIn", "null", {
      secure: true,
      sameSite: "none",
      path: "/",
      domain: process.env.DOMAIN,
    });
    res.status(200).send("Login Successful");
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

App.post("/signup", async (req, res) => {
  try {
    if (
      !Object.hasOwnProperty.call(req.body, "first_name") ||
      !Object.hasOwnProperty.call(req.body, "last_name") ||
      !Object.hasOwnProperty.call(req.body, "email") ||
      !Object.hasOwnProperty.call(req.body, "password")
    ) {
      res.status(400).send("Missing Query");
      return;
    }
    const { first_name, last_name, email, password } = req.body;
    const dbResponse = await pool.query(
      "SELECT email FROM users WHERE email=$1",
      [email]
    );
    if (dbResponse.rows.length) {
      res.status(400).send("An account with the given email already exists");
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userAddedResponse = await pool.query(
      "INSERT INTO users(first_name, last_name, email, password) VALUES($1, $2, $3, $4)",
      [first_name, last_name, email, hashedPassword]
    );
    if (!userAddedResponse.rowCount) throw "Insert Query Failed";
    res.status(200).send("User Signed Up Successfully");
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

App.post("/reset-password", async (req, res) => {
  try {
    if (
      !Object.hasOwnProperty.call(req.body, "first_name") ||
      !Object.hasOwnProperty.call(req.body, "last_name") ||
      !Object.hasOwnProperty.call(req.body, "email") ||
      !Object.hasOwnProperty.call(req.body, "password")
    ) {
      res.status(400).send("Missing Query");
      return;
    }
    const { first_name, last_name, email, password } = req.body;
    const dbResponse = await pool.query(
      "SELECT id FROM users WHERE first_name=$1 AND last_name=$2 AND email=$3",
      [first_name, last_name, email]
    );
    if (!dbResponse.rowCount) {
      res.status(400).send("Incorrect Details");
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const passwordUpdated = await pool.query(
      "UPDATE users SET password=$1 WHERE id=$2",
      [hashedPassword, dbResponse.rows[0].id]
    );
    if (!passwordUpdated.rowCount) throw "Password Update Query Failed";
    res.status(200).send("Password Updated Successful");
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

App.get("/my-info", async (req, res) => {
  try {
    if (
      !Object.hasOwnProperty.call(req.cookies, "Access_Token") ||
      !Object.hasOwnProperty.call(req.cookies, "LoggedIn")
    ) {
      res.status(400).send("Missing Credentials");
      return;
    }
    const { id } = await jwt.verify(
      req.cookies.Access_Token,
      process.env.JWT_PUBLIC_KEY,
      {
        algorithms: "RS256",
        issuer: process.env.JWT_ISSUER,
      }
    );
    const dbResponse = await pool.query(
      "SELECT first_name, last_name, email FROM users WHERE id=$1",
      [id]
    );
    const data = {
      first_name: dbResponse.rows[0].first_name,
      last_name: dbResponse.rows[0].last_name,
      email: dbResponse.rows[0].email,
    };
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

App.post("/logout", async (req, res) => {
  try {
    res.clearCookie("Access_Token", { httpOnly: true, secure: true });
    res.clearCookie("LoggedIn");
    res.status(200).send("Logout Successful");
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

App.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
