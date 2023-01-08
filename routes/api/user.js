const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const path = require('path');
const fs = require('fs/promises');

const { createError, createHashPassword } = require('../../helpers');
const User = require('../../models/user');
const authorize = require('../../middlewares/authorize');
const upload = require('../../middlewares/upload');

const registerUserSchema = Joi.object({
    password: Joi.string().min(6).required(),
    email: Joi.string()
    .pattern(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
    .required(),
    subscription: Joi.string(),
    token: Joi.string()
})

const loginUserSchema = Joi.object({
    email: Joi.string()
    .pattern(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
    .required(),
    password: Joi.string().min(6).required(),
})

const { SECRET_KEY } = process.env;
const router = express.Router();

router.post("/signup", async (req, res, next) => {
    try {
        const { error } = registerUserSchema.validate(req.body);
        if (error) {
            throw createError(400, error.message); 
        }
        const { email, password} = req.body;
        const user = await User.findOne({ email });
        if (user) {
            throw createError(409, "Email in use");
        }
        const hashPassword = await createHashPassword(password);
        const avatarURL = gravatar.url(email);
        const newUser = await User.create({ email, password: hashPassword });
        res.status(201).json({
            email: newUser.email,
            subscription: newUser.subscription,
            avatarURL,
        });
    } catch (error) {
        next(error);
    }
})

router.post("/login", async (req, res, next) => {
    try {
        const { error } = loginUserSchema.validate(req.body);
        if (error) {
            throw createError(400, error.message); 
        }
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            throw createError(401, "Email or password is wrong");
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw createError(401, "Email or password is wrong");
        }

        const payload = {
            id: user._id,
        }

        const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
        
        await User.findByIdAndUpdate({_id: user._id}, {token})

        res.status(200).json({
            token,
        })
    } catch (error) {
        next(error);
    }
})

router.get('/logout', authorize, async (req, res, next) => {
    try {
        const { _id } = req.user;
        await User.findByIdAndUpdate(_id, { token: "" });
        res.status(204).json({
            message: "No Content"
        })
    } catch (error) {
        next(error);
    }
})

router.get('/current', authorize, async (req, res, next) => {
    try {
        const { email } = req.user;
        res.status(200).json({
            email,
        }); 
    } catch (error) {
        next(error);
    }
})

router.patch('/avatars', authorize, upload.single("avatar"), async (req, res, next) => {
    try {
        const { _id } = req.user;
        const { path: tempDir, originalname } = req.file;
        const [extention] = originalname.split(".").reverse();
        const newName = `${_id}.${extention}`;
        const uploadDir = path.join(__dirname, "../../", "public", "avatars", newName);
        await fs.rename(tempDir, uploadDir); 
        const avatarURL = path.join("avatars", newName);
        await User.findByIdAndUpdate(_id, { avatarURL });
        res.status(201).json(avatarURL);
    } catch (error) {
        await fs.unlink(req.file.path);
        next(error);
    }
})

module.exports = router;
