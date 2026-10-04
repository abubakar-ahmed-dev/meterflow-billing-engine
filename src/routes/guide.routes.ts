import { Router } from "express";
import { GuideController } from "../controllers/guide.controller.js";

export const guideRouter = Router();

// Guides Archive / Hub page
guideRouter.get("/", GuideController.renderArchive);

// Individual Guide Article page
guideRouter.get("/:slug", GuideController.renderArticle);
