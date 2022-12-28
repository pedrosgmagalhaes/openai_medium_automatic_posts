const express = require('express');
const mongoose = require('mongoose');
const Parser = require('rss-parser');
const dotenv = require('dotenv');
const { Configuration, OpenAIApi } = require('openai');
const bodyParser = require('body-parser');
const axios = require('axios');

// Load environment variables from .env file
dotenv.config();

const app = express();

const {
    BLOGS,
    OPENAI_API_KEY,
    MEDIUM_CLIENT_ID,
    MEDIUM_CLIENT_SECRET,
    MEDIUM_CALLBACK,
    MEDIUM_USER_ID
} = process.env;

// Use body-parser as a middleware
app.use(bodyParser.json());

// AI TRANSFORMATION
const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const parser = new Parser();

const blogs = BLOGS.split(',');

app.post('/update-feeds', async (req, res) => {
    try {
        // Exchange the authorization code for an access token
        const tokenResponse = req.session.accessToken;

        // Loop through the blogs
        for (const blog of blogs) {
            // Get the RSS feed for the blog
            const rssFeed = await parser.parseURL(blog);

            // Loop through the items in the RSS feed
            for (const item of rssFeed.items) {
                // Set the parameters for the title generation
                const paramsTitle = {
                    model: 'text-davinci-002',
                    prompt: `Generate a title for this article: ${item.title}`,
                    max_tokens: 25,
                    temperature: 0.8
                };

                // Set the parameters for the text generation
                const slipttedContent = item.content.slice(0, 700);
                const paramsContent = {
                    model: 'text-davinci-003',
                    prompt: `Create a full 8 paragraphs SEO friendly content about this using html syntax for <p> and </p> new lines without text formatted, use html bold syntax for repeated words: ${slipttedContent}`,
                    max_tokens: 2048,
                    temperature: 0.8
                };

                // Generate a title using the OpenAI API
                const resultTitle = await openai.createCompletion(paramsTitle);
                const generatedTitle = resultTitle.data.choices[0].text;

                // Generate similar text using the OpenAI API
                const resultContent = await openai.createCompletion(paramsContent);
                const generatedText = resultContent.data.choices[0].text;

                // Set up the axios instance with the necessary headers
                const createPostToMedium = axios.create({
                    baseURL: 'https://api.medium.com/v1',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${tokenResponse.access_token}`,
                    },
                });

                // Create a new post on Medium with the generated title and text
                const postMedium = {
                    title: generatedTitle,
                    contentFormat: 'html',
                    content: generatedText,
                    tags: ['crypto', 'blockchain', 'web3'],
                    publishStatus: 'draft'
                };

                try {
                    await createPostToMedium.post(`/users/${MEDIUM_USER_ID}/posts`, postMedium);
                } catch (error) {
                    console.log(error)
                }

                // Pause the loop for 40 seconds after every 10 posts
                if (counter % 10 === 0) {
                    console.log('Pausing for 40 seconds...');
                    await new Promise(resolve => setTimeout(resolve, 40000));
                }
                counter++;
            }
        }

        res.send('Feeds sent to Medium');
    } catch (error) {
        console.error(error);
        res.send(error);
    }
});

app.get('/callback', async (req, res) => {
    try {
        // Get the authorization code from the query parameters
        const code = req.query.code;

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

        // Save the access token to a session or cookie
        req.session.accessToken = tokenResponse.data.access_token;

        // Redirect the user to the home page
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.send(error);
    }
});


app.listen(3000, () => {
    console.log('Express app listening on port 3000');
});
