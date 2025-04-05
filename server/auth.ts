import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { IStorage } from "./storage";
import { User, loginUserSchema } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      password?: string;
      googleId?: string;
      profilePicture?: string;
      displayName?: string;
      createdAt?: Date;
    }
  }
}

const SESSION_SECRET = process.env.SESSION_SECRET || "wellbeing-app-secret";

export async function setupAuth(app: Express, storage: IStorage) {
  app.use(
    session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: storage.sessionStore,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Invalid email or password." });
          }

          const isPasswordValid = await bcrypt.compare(password, user.password || "");
          if (!isPasswordValid) {
            return done(null, false, { message: "Invalid email or password." });
          }

          return done(null, {
            id: user.id,
            username: user.username ?? "",
            email: user.email,
            password: user.password ?? undefined,
            googleId: user.googleId ?? undefined,
            profilePicture: user.profilePicture ?? undefined,
            displayName: user.displayName ?? undefined,
            createdAt: user.createdAt ?? undefined,
          });
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) return done(null, false);
      return done(null, {
        id: user.id,
        username: user.username ?? "",
        email: user.email,
        password: user.password ?? undefined,
        googleId: user.googleId ?? undefined,
        profilePicture: user.profilePicture ?? undefined,
        displayName: user.displayName ?? undefined,
        createdAt: user.createdAt ?? undefined,
      });
    } catch (error) {
      return done(error);
    }
  });

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const registerSchema = loginUserSchema.extend({
        username: z.string().min(3, "Username must be at least 3 characters"),
      });

      const parsedData = registerSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ error: parsedData.error.errors[0].message });
      }

      const { username, email, password } = parsedData.data;

      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ error: "Email already in use" });
      }

      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
      });

      const cleanedUser: Express.User = {
        id: user.id,
        username: user.username ?? "",
        email: user.email,
        password: user.password ?? undefined,
        googleId: user.googleId ?? undefined,
        profilePicture: user.profilePicture ?? undefined,
        displayName: user.displayName ?? undefined,
        createdAt: user.createdAt ?? undefined,
      };

      req.login(cleanedUser, (err) => {
        if (err) return next(err);

        const { password, ...userWithoutPassword } = cleanedUser;
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || "Invalid credentials" });

      req.login(user, (err: any) => {
        if (err) return next(err);

        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { password, ...userWithoutPassword } = req.user as User;
    res.json(userWithoutPassword);
  });
}
