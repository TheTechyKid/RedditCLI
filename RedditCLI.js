// RedditCLI.js

import fetch from 'node-fetch';
import figlet from 'figlet';
import chalk from 'chalk';
import readln from 'readline';

const profanityList = ["frack", "shiet", "demn", "batch"];
const text = 'RedditCLI';
const font = 'Standard';

const rl =
readln.createInterface({
    input: process.stdin,
    output: process.stdout
})

function filterProfanity(text) {
    const words = String(text).toLowerCase().split(/\s+/);
    const filteredWords = words.map(word =>
        profanityList.includes(word) ? '*'.repeat(word.length) : word
    );
    return filteredWords.join(' ');
}

async function getComments(permalink) {
    try {
        const response = await fetch(`https://www.reddit.com${permalink}.json`);
        const data = await response.json();

        const comments = [];

        if (data[1] && data[1].data && data[1].data.children) {
            for (const comment of data[1].data.children) {
                comments.push(comment.data.body);
            }
        }

        return comments;
    } catch (error) {
        console.log(error);
        return [];
    }
}

async function getRedditData(sub) {
    const subreddit = sub;
    let delay = 1000;

    try {
        const response = await fetch(`https://www.reddit.com/r/${subreddit}/new.json`);
        const data = await response.json();
        const posts = data.data.children;
        const info = [];

        for (const post of posts) {
            let postTitleInfo = post.data.title;
            let postImageUrl = post.data.url;
            let postTextInfo = post.data.selftext;
            let postCommentsInfo = await getComments(post.data.permalink);
            let postScore = post.data.score;
            let postAuthor = post.data.author; // Add this line to get the post author's username
            
            if (postCommentsInfo === undefined) {
                postCommentsInfo = "No comments.";
            };

            info.push({
                "title": filterProfanity(postTitleInfo),
                "url": postImageUrl,
                "selftext": filterProfanity(postTextInfo.replace(/\n/g, "")),
                "comments": postCommentsInfo.map(filterProfanity),
                "score": postScore,
                "author": postAuthor // Include the post author's username in the info object
            });
        }
    
        return info;
    } catch (error) {
        if (error.status === 429) {
            console.log('Rate limit exceeded. Retrying after delay...');
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Double the delay for each retry
            return getRedditData(sub); // Retry the request
        } else {
            console.log(error);
            throw error;
        }
    }
}

function showReddit(data) {
    function showPosts() {
        let postNum = 0;
        data.forEach((post) => {
            postNum++;
            console.log(`\nPostnum ${chalk.yellow.bold(postNum)}`)
            console.log(`${chalk.blue.bold(post.author)}: "${chalk.green.bold(post.title)}"`);
            console.log(`${chalk.grey(post.selftext)}`)
            console.log(`Url: ${chalk.green.bold(post.url)}`);
            console.log(`Comments:\n${chalk.grey(post.comments.join('\n\n'))}`)
            console.log('-------------------------------------------------s')
        });
    }
    figlet.text(text, { font }, (err, data) => {
        if (err) {
            console.error('Error:', err);
            return;
        }
        console.log(chalk.red.bold(data));
        showPosts();
    });
}

async function run() {
    try {
        rl.question("Subreddit pls > ", async function (userInput) {

            rl.close();
            let data = await getRedditData(userInput);
            showReddit(data);
          });
    } catch (error) {
        console.log(error);
    }
}

run();
