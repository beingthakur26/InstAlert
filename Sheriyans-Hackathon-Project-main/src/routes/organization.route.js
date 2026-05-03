import express from "express";
import multer from "multer";
import path from "path";
import validateUser from "../middlewares/validateUser.middleware.js";
import {
    createOrganization,
    getEmployees,
    getMyOrg,
    getMyOwnOrganization,
    removeEmployee,
    updateOrganization,
    getOrgStats,
    transferOwnership,
    deleteOrganization,
    uploadLogo,
    updateNotificationSettings
} from "../controllers/organization.controller.js";
import validateAccessMiddleware from "../middlewares/validateAccess.middleware.js";

const upload = multer({
    storage: multer.diskStorage({
        destination: "./uploads/",
        filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp|gif/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        cb(null, ext && mime);
    },
});

const router = express.Router();

/*
    @route POST /organization/create
    @desc Create a new organization
    @access Private
*/
router.post("/create", validateUser, createOrganization);

/*
    @route GET /organization/stats
    @desc Get organization stats for dashboard
    @access Private
*/
router.get("/stats", validateUser, getOrgStats);

/*
    @route PUT /organization/update
    @desc Update organization details
    @access Private
    @roles organization (owner only)
*/
router.put("/update", validateUser, validateAccessMiddleware.validateOrganization, updateOrganization);

/*
    @route POST /organization/transfer-ownership
    @desc Transfer organization ownership to another member
    @access Private
    @roles organization (owner only)
*/
router.post("/transfer-ownership", validateUser, validateAccessMiddleware.validateOrganization, transferOwnership);

/*
    @route DELETE /organization/delete
    @desc Delete organization and all related data
    @access Private
    @roles organization (owner only)
*/
router.delete("/delete", validateUser, validateAccessMiddleware.validateOrganization, deleteOrganization);

/*
    @route GET /organization/get-employees
    @desc Get all employees/members of organizations the user belongs to
    @access Private
    @roles organization, user, employee
*/
router.get("/get-employees", validateUser, getEmployees);

/*
    @route GET /organization/get-my-org
    @desc Get the current user's organization
    @access Private
*/
router.get("/get-my-org", validateUser, getMyOrg);

/*
    @route GET /organization/get-my-own-org
    @desc Get own organization data - ONLY for organization owners
    @access Private
    @roles organization (owner only)
*/
router.get("/get-my-own-org", validateUser,validateAccessMiddleware.validateOrganization, getMyOwnOrganization);

/*
    @route DELETE /organization/remove-employee/:userId
    @desc Remove an employee from organization (owner only)
    @access Private
    @roles organization (owner only)
*/
router.delete("/remove-employee/:userId", validateUser, removeEmployee);

/*
    @route GET /organization/dashboard
    @desc Welcome message for organization dashboard
    @access Private
*/
router.get("/dashboard", (req, res) => {
    res.json({ message: "Welcome to the organization dashboard!" });
});

/*
    @route POST /organization/upload-logo
    @desc Upload organization logo
    @access Private (owner only)
*/
router.post("/upload-logo", validateUser, upload.single("logo"), uploadLogo);

/*
    @route PUT /organization/notification-settings
    @desc Update organization notification preferences
    @access Private (owner only)
*/
router.put("/notification-settings", validateUser, validateAccessMiddleware.validateOrganization, updateNotificationSettings);

export default router;