const express = require("express");
const router = express.Router();

const hopDongController = require("../controllers/hopDong.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

router.post(
    "/",
    authMiddleware,
    authorizeAdmin,
    hopDongController.createContract
);

router.get(
    "/admin",
    authMiddleware,
    authorizeAdmin,
    hopDongController.getAllContracts
);

router.get(
    "/my",
    authMiddleware,
    hopDongController.getMyContracts
);

router.get(
    "/profile/:profileId",
    authMiddleware,
    hopDongController.getContractByProfileId
);

router.put(
    "/:id/upload",
    authMiddleware,
    hopDongController.uploadSignedContract
);

router.put(
    "/:id/confirm",
    authMiddleware,
    authorizeAdmin,
    hopDongController.confirmContract
);

router.put(
    "/:id/cancel",
    authMiddleware,
    authorizeAdmin,
    hopDongController.cancelContract
);

router.get(
    "/:id",
    authMiddleware,
    hopDongController.getContractById
);

module.exports = router;