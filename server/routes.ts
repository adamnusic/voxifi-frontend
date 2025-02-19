import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server for static file serving
  const httpServer = createServer(app);
  return httpServer;
}
