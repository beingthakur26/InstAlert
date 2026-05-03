import User from "../models/user.model.js";
import githubService from "../services/github.service.js";
import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";
import {config} from "dotenv";

config();

const githubAuth = (req, res) => {

    const url = githubService.getAuthUrl();

    res.send(`<a href="${url}">Login with GitHub</a>`);
}


const githubcallback = async (req, res) => {
    try {

        const { code } = req.query;
        const response = await githubService.getUser(code);
        res.json(response);

    } catch (error) {

        console.log("ERROR:", error.response?.data || error.message);
        res.status(500).json(error.response?.data);

    }
};

const getUserRepos = async (req, res) => {
    try {

        const accessToken = req.query.accessToken || req.headers.authorization?.split(' ')[1];

        if (!accessToken) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const data = await githubService.getUserRepos(accessToken);
        res.json(data);

    } catch (error) {

        console.log('ERROR:', error.response?.data || error.message);
        res.status(500).json(error.response?.data || error.message);

    }
};

const getUserCommits = async (req, res) => {
    try {
        const accessToken = req.query.accessToken || req.headers.authorization?.split(' ')[1];
        const { owner, repo } = req.query;

        const data = await githubService.getUserCommits(accessToken, owner, repo);
        res.json(data);

    } catch (error) {
        console.log('ERROR:', error.response?.data || error.message);
        res.status(500).json(error.response?.data || error.message);
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const token = JWT.sign(
            {
                id: user._id,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        });

        res.status(200).json({
            message: "User logged in successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
};

const register = async (req, res) => {
    try {
        console.log("Registering user with data:", req.body);
        const { username, email, password } = req.body || {};
    
        if(!username || !email || !password){
            return res.status(400).json({ error: "All fields are required" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({ username, email, password: hashedPassword });
        
        const token = JWT.sign(
            {
                id: user._id,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        });

        res.status(201).json({ message: "User registered successfully", user });

    } catch (error) {
        console.error("Error registering user:", error);
        
        // Handle Mongoose duplicate key error (11000)
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ 
                error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
                message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
            });
        }

        res.status(500).json({ error: "Internal server error", message: "Internal server error" });
    }
}



const me = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Me error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export default {
    githubAuth,
    githubcallback,
    login,
    register,
    getUserRepos,
    getUserCommits,
    me,
    logout,
}