const express = require('express');
const Joi = require('joi');
const Jimp = require('jimp');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const path = require('path');
const fs = require('fs/promises');

const { createError, createHashPassword, sendMail } = require('../../helpers');
const User = require('../../models/user');
const authorize = require('../../middlewares/authorize');
const upload = require('../../middlewares/upload');
const { nanoid } = require('nanoid');
const { mail } = require('sendgrid');

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

const verifyUserSchema = Joi.object({
    email: Joi.string()
    .pattern(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
    .required(),
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
        const verificationToken = nanoid();

        const newUser = await User.create({ email, password: hashPassword, avatarURL, verificationToken });

        const mail = {
            to: email,
            subject: "Email verification",
            html: `<a ref="http://localhost:3000/api/user/verify/${verificationToken}>Verify user</a>`
        }
        await sendMail(mail);

        res.status(201).json({
            email: newUser.email,
            subscription: newUser.subscription,
            avatarURL,
        });

    } catch (error) {
        next(error);
    }
})

router.get("/verify/:verificationToken", async (req, res, next,) => {
    try {
        const { verificationToken } = req.params;

        const user = await User.findOne({ verificationToken });
        if (!user) {
            throw createError(404, "User not found");
        }

        await User.findByIdAndUpdate(user._id, { verify: true, verificationToken: "", });
        res.status(200).json({ message: "Verification successful" });
    } catch (error) {
        next(error);
    }
})

router.post("/verify", async (req, res, next) => {
    try {
        const { error } = verifyUserSchema.validate(req.body);
        if (error) {
            throw createError(400, error.message);
        }
        
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            throw createError(404, "User not found");
        }
        if (user.verify) {
            throw createError(400, "Verification has already been passed");
        }
         const mail = {
            to: email,
            subject: "Email verification",
            html: `<a ref="http://localhost:3000/api/user/verify/${user.verificationToken}>Verify user</a>`
        }

        await sendMail(mail);

        res.status(200).json({ message: "Verification email sent" });

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

        if (!user.verificationToken) {
            throw createError(401, "User not verified");
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

router.patch('/avatars', authorize, upload, async (req, res, next) => {
    try {
        const { _id } = req.user;
        const { path: tempDir, originalname } = req.file;
        const [extention] = originalname.split(".").reverse();
        const newName = `${_id}.${extention}`;

        const uploadDir = path.join(__dirname, "../../", "public", "avatars", newName);
        
        await fs.rename(tempDir, uploadDir);

        Jimp.read(uploadDir, (err, image) => {
            if (err) throw err;
            image.resize(250, 250).write(uploadDir);
        })

        const avatarURL = path.join("avatars", newName);
        await User.findByIdAndUpdate(_id, { avatarURL });
        res.status(201).json(avatarURL);
    } catch (error) {
        await fs.unlink(req.file.path);
        next(error);
    }
})

module.exports = router;