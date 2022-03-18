import fetch from 'node-fetch';
import { is } from "cheerio/lib/api/traversing";

export default function sendSlackMessage(title, body, isSuccess = false)
{
    return new Promise((resolve) => {
        const webHookLink =
            isSuccess ?
                "https://hooks.slack.com/services/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"
                :
                "https://hooks.slack.com/services/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";

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
