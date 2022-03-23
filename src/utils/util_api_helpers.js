import fetch from 'node-fetch';
import xml2js from 'xml2js';
import { writeFile } from "fs/promises";

import { isObject } from './util_helpers';
import { Abort, Success } from "./util_response_helpers";

const GLOBAL = require('../configs/config_secondHandHounds');

// region API Wrapper - XML Returned
export function apiWrapperXML({
    type = 'contacts',
    viewID = '550520',
    tagName = 'Contact_'
})
{
    return new Promise((resolve, reject) => {
        fetch(`https://rescuegroups.org/manage/data/get?type=${type}&viewID=${viewID}&viewType=Custom&Export=ExportDataXLS`, {
            method: 'GET',
            headers: { 'Cookie': process.env.SHH_COOKIE }
        })
            .then((response) => {
                if (response.status === 200)
                {
                    return response.text();
                }
                else return({ error: 'Status Code: ' + response.status });
            })
            .then((response) => {
                // Convert into JSON format
                xml2js
                    .parseStringPromise(response, {
                        explicitArray: false,
                        tagNameProcessors: [(name) => name?.replaceAll(tagName, '')]
                    })
                    .then((result) => {
                        let jsonResult = result[type]?.[type];

                        if (process.env.IS_LOCAL === 'true')
                        {
                            writeFile(`./tempData/secondHandHounds_${type.toUpperCase()}_XML.json`, JSON.stringify(jsonResult, null, 4))
                                .then(() => resolve(jsonResult))
                                .catch((writeError) => reject(writeError.message));
                        }
                        else resolve(jsonResult);
                    })
                    .catch((parseError) => reject(parseError.message));
            })
            .catch((error) => reject(error.message));
    });
}
// endregion

// region API Wrapper
export function apiWrapper({
    link,
    method = 'GET',
    functionName = '',
    body = null,
    completeFunc = () => {},
    customAuthorizationKey = null,
    noLogs = false
})
{
    return new Promise((resolve, reject) => {
        let hasPagination = link.toLowerCase().includes('page') || link.toLowerCase().includes('limit');

        fetch((link.startsWith('http') ? '' : GLOBAL.FATHER_LINK) + link, {
            method: method,
            headers: {
                'Content-Type': 'application/vnd.api+json',
                'Authorization': customAuthorizationKey || process.env.SHH_API_KEY
            },
            body
        })
            .then((response) => handleFirstResponse(response))
            .then((response) =>
            {
                if (!checkErrorExist(response))
                {
                    if (!noLogs) console.log(`[SUCCESS] ${functionName.toUpperCase()}`, response);
                    completeFunc(response);
                    resolve(
                        hasPagination ?
                            {
                                data: response.data,
                                currentPage: (response['meta'] || response)["pageReturned"],
                                lastPage: (response['meta'] || response)["pages"],
                                totalResult: (response['meta'] || response)["count"],
                                meta: response['meta'] || {}
                            }
                            :
                            response
                    );
                }
                else
                {
                    if (process.env.IS_LOCAL === 'true' && !noLogs) console.log(`[FAILED] ${functionName.toUpperCase()}`, response);
                    reject(convertError(response.errors || response.error));
                }
            })
            .catch((error) =>
            {
                if (process.env.IS_LOCAL === 'true' && !noLogs) console.log(`[FAILED] ${functionName.toUpperCase()}`, error);
                reject(error.message);
            });
    });
}
// endregion

// region Check if error exist in API response
export function checkErrorExist(responseObj)
{
    return(responseObj.hasOwnProperty('errors') || responseObj.hasOwnProperty('error') || responseObj.hasOwnProperty('exception'));
}
// endregion

// region Convert Error Object in Response to Readable Format
export function convertError(errorObj)
{
    if (Array.isArray(errorObj))
    {
        let errorData = errorObj[0];
        return(`(${errorData.status}) ${errorData.title}\n${errorData.detail}`);
    }
    if (isObject(errorObj))
    {
        // Extract error data
        let errorStr = '';
        let errorArr = Object.keys(errorObj);
        errorArr.forEach((errorKey) =>
        {
            errorStr += (errorArr.length > 1 ? '- ' : '') + (errorObj[errorKey])[0].toString();

            // Add line break
            if (errorArr.length > 1)
            {
                errorStr += '\n';
            }
        });

        return errorStr;
    }
    else if (typeof errorObj === 'string')
    {
        return(errorObj);
    }
    else if (errorObj.hasOwnProperty('headers'))
    {
        return('Status Code: ' + errorObj.status);
    }
}
// endregion

// region Check if response is valid JSON
function isJSON(str)
{
    try
    {
        JSON.parse(str);
    }
    catch (e)
    {
        return false;
    }
    return true;
}
// endregion

// region Function - Handle First Response
export function handleFirstResponse(response)
{
    if (typeof response === 'string')
    {
        if (isJSON(response))
        {
            return response.json();
        }
        else return({ errors: response });
    }
    else
    {
        let statusCode = response.status;

        switch(statusCode)
        {
            case 200:
            case 201:
            case 422:
            case 403:
            {
                return response.json();
            }
            case 204:
            case 205:
            {
                return({});
            }
            case 401:
            {
                return({ errors: 'Your account session has expired, please log out and log in again.' });
            }
            case 404:
            {
                return({ errors: '404' });
            }
            default: return({ errors: response });
        }
    }
}
// endregion
