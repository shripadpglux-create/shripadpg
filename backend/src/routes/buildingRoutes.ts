import { Router } from "express";
import { BuildingController } from "../controllers/buildingController.js";

const router = Router();

router.get("/buildings", BuildingController.getAll);
router.post("/buildings", BuildingController.create);
router.put("/buildings/:name", BuildingController.update);
router.delete("/buildings/:name", BuildingController.delete);

export default router;
