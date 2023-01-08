const RateLimit = require('express-rate-limit');
const express = require('express');
const router = express.Router();
const User = require('../../models/auth'); // Import the User model
const bcrypt = require('bcryptjs'); // Import the bcryptjs library for hashing passwords
const passport = require('passport');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer'); // Import the nodemailer library for sending emails

const authRouter = express.Router();

const rateLimiter = RateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // limit each IP to 5 requests per windowMs
    delayMs: 0, // disable delaying - full speed until the max limit is reached
});

// Set up a nodemailer transport for sending emails
const transporter = nodemailer.createTransport({
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
        user: 'user@example.com',
        pass: 'password'
    }
});


// Sign up a new user
authRouter.post('/signup', rateLimiter, async (req, res) => {
    // Validate the email field
    check('email')
        .isEmail().withMessage('Please enter a valid email')
        .trim()
        .normalizeEmail(),
        // Validate the name field
        check('name')
            .not().isEmpty().withMessage('Please enter your name'),
        // Validate the password field
        check('password')
            .not().isEmpty().withMessage('Please enter a password')
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    // Check if there are validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).send({ message: 'Validation failed', errors: errors.array() });
    }

    // If there are no errors, proceed with the signup process
    try {
        // Get the user data from the request body
        const { email, name, lastName, password, mediumUsername } = req.body;

        // Check if the email is already in use
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).send({ message: 'Email is already in use' });
        }

        // Hash the password
        const salt = await bcrypt.genSaltSync(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // If the email is not already in use, create a new user object with the provided data
        const user = new User({
            email: email,
            name: name,
            lastName: lastName,
            password: hashedPassword,
            mediumUsername: mediumUsername,
            balance: 0,
        });

        // Save the user to the database
        await user.save();

        // Create a JWT and send a verification email to the user
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const verificationUrl = `http://localhost:3000/verify-email?token=${token}`;
        const mailOptions = {
            from: 'user@example.com',
            to: email,
            subject: 'Verify your email',
            html: `<p>Please click the following link to verify your email:</p>
           <p><a href="${verificationUrl}">${verificationUrl}</a></p>`
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
                return res.status(500).send({ message: 'Error sending verification email' });
            }
            // If the email was successfully sent, return a success message
            res.status(200).send({ message: 'Verification email sent. Please check your email.' });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Internal server error' });
    }
});

// Verify the user's email address
authRouter.get('/verify-email', rateLimiter, async (req, res) => {
    // Get the JWT from the query string
    const token = req.query.token;
    if (!token) {
        return res.status(400).send({ message: 'Invalid token' });
    }
    // Verify the JWT
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded._id;
        // Update the user's email verification status
        const user = await User.findByIdAndUpdate(userId, { emailVerified: true });
        if (!user) {
            return res.status(400).send({ message: 'User not found' });
        }
        // Return a success message
        res.status(200).send({ message: 'Email verified successfully' });
    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Invalid token' });
    }
});

// Log in a user
authRouter.post('/login', rateLimiter, (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(400).send({ message: 'User not found' });
        }
        req.logIn(user, (error) => {
            if (error) {
                return next(error);
            }
            // If the login is successful, create a JWT and send it back to the client
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.status(200).send({ token });
        });
    })(req, res, next);
});

module.exports = authRouter;