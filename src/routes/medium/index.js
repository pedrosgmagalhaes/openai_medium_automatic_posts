const axios = require('axios');
const dotenv = require('dotenv');
const express = require('express');
const Medium = require('../../models/mediumAuth/');

// Load environment variables from .env file
dotenv.config();

const mediumRouter = express.Router();

const {
    MEDIUM_CLIENT_ID,
    MEDIUM_CLIENT_SECRET,
    MEDIUM_CALLBACK,
} = process.env;

mediumRouter.get('/login', async (req, res) => {

    // Generate a random state value
    const stateValue = Math.random().toString(36).substring(2, 15);

    // Create a new state in the database
    const medium = new Medium({ state: stateValue });

    try {
        await medium.save().then(
            () => res.redirect(`https://medium.com/m/oauth/authorize?client_id=${MEDIUM_CLIENT_ID}&scope=basicProfile,publishPost&state=${stateValue}&response_type=code&redirect_uri=${MEDIUM_CALLBACK}`)
        );

    } catch (error) {
        res.send(error)
    }
});


mediumRouter.get('/callback', async (req, res) => {
    try {
        // Get the authorization code, state, and error from the query parameters
        const code = req.query.code;
        const state = req.query.state;
        const error = req.query.error;

        // Check if the request contains an error
        if (error) {
            // Handle the error
            console.error(error);
            res.send(error);
        } else {
            // Retrieve the state stored in MongoDB
            const mediumAuth = await Medium.findOne({ state: state });

            // Check if the state matches the one stored in MongoDB
            if (!mediumAuth || mediumAuth.state !== state) {
                // Handle the error
                res.send('Invalid state');
            } else {
                // Set up the axios instance with the necessary headers
                const exchangeCodeForToken = axios.create({
                    baseURL: 'https://api.medium.com/v1',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Basic ${Buffer.from(`${MEDIUM_CLIENT_ID}:${MEDIUM_CLIENT_SECRET}`).toString('base64')}`,
                    },
                });

                // Exchange the authorization code for an access token
                const tokenResponse = await exchangeCodeForToken.post('/tokens', {
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: MEDIUM_CALLBACK,
                });

                // Update the access_token field in the mediumAuth object
                mediumAuth.access_token = tokenResponse.data.access_token;

                // Save the updated mediumAuth object to the database
                await mediumAuth.save({ access_token: tokenResponse.data.access_token });
            }
        }
    } catch (error) {
        console.error(error);
        res.send(error);
    }
});



module.exports = mediumRouter;