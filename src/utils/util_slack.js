import fetch from 'node-fetch';

export default function sendSlackMessage(title, body, isSuccess = false)
{
    return new Promise((resolve) => {
        const webHookLink = isSuccess ? process.env.SLACK_SUCCESS_LINK : process.env.SLACK_ERROR_LINK;

        if (!webHookLink?.trim())
        {
            resolve(null);
            return;
        }

        fetch(webHookLink, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                "text": title,
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": `${process.env.IS_LOCAL === 'true' ? '(Local)' : ''} ${title}\n`
                        }
                    },
                    { "type": "divider" },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": `${body}`
                        }
                    }
                ]
            })
        })
            .then(() => resolve('Done'))
            .catch((error) => {
                if (process.env.IS_LOCAL === 'true') console.log('[FAILED] POST MESSAGE TO SLACK', error);
                resolve(error.message);
            });
    });
}
