import sendSlackMessage from "../utils/util_slack";

require('dotenv').config();

import fetch from 'node-fetch';
import {
    ToadScheduler,
    SimpleIntervalJob,
    AsyncTask
} from 'toad-scheduler';
import { Router } from "express";
import nodeScheduler from 'node-schedule';
import moment from 'moment-timezone';
import MySQL from 'mysql';
import { Promise } from "bluebird";
import ExcelJS from "exceljs";

// Helpers
import { apiWrapper, apiWrapperXML } from "../utils/util_api_helpers";
import {
    Abort,
    isObject,
    Success
} from "../utils";
import { writeFile } from "fs/promises";
import { sloppyAuthenticate } from "../middlewares/middleware_authentication";

// Define scheduler
const scheduler = new ToadScheduler();

// Global
const GLOBAL = require('../configs/config_secondHandHounds');

let secondHandHoundsRouter = Router();

// region Check local
function isLocal()
{
    return(process.env.IS_LOCAL === 'true');
}
// endregion

// region --- DATABASE ---

// region Function - Start RDS Database
export function getMySQLConnection()
{
    let connection = MySQL.createConnection({
        host: process.env.RDS_HOSTNAME,
        user: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD,
        database: process.env.RDS_DB_NAME,
        port: process.env.RDS_PORT
    });

    return(connection);
}
// endregion

// region Query - Fetch Scheduler Config
function getSchedulerConfig(jobName)
{
    return new Promise((resolve) =>
    {
        const connection = getMySQLConnection();

        connection.query(
            {
                sql: "SELECT * FROM SchedulerConfigs WHERE name = ?",
                timeout: 10000,
                values: [jobName]
            },
            (error, results) =>
            {
                if (error)
                {
                    connection.end();
                    sendSlackMessage('Fetching SchedulerConfigs', error.sqlMessage);
                    resolve(null);
                }
                else
                {
                    connection.end();
                    resolve(results[0]);
                }
            }
        );
    });
}
// endregion

// region Query - Update Scheduler Next Run
function updateSchedulerConfig(jobID, nextRunAt)
{
    const connection = getMySQLConnection();

    connection.query(
        {
            sql: "UPDATE SchedulerConfigs SET nextRunAt = ?, updatedAt = ? WHERE id = ?",
            timeout: 10000,
            values: [nextRunAt, moment().unix(), jobID]
        },
        (error) =>
        {
            if (error)
            {
                connection.end();
                sendSlackMessage('Updated SchedulerConfigs', error.sqlMessage);
            }
            else connection.end();
        }
    );
}
// endregion

// region Query - Add New Scheduler Config
function addSchedulerConfig(jobName, nextRunAt)
{
    return new Promise((resolve) =>
    {
        const connection = getMySQLConnection();

        connection.query(
            {
                sql: "INSERT INTO SchedulerConfigs SET ?",
                timeout: 10000,
                values: {
                    name: jobName,
                    nextRunAt: nextRunAt,
                    createdAt: moment().unix(),
                    updatedAt: moment().unix()
                }
            },
            (error, result) =>
            {
                if (error)
                {
                    connection.end();
                    sendSlackMessage('Add New SchedulerConfigs', error.sqlMessage);
                    resolve(null);
                }
                else
                {
                    connection.end();
                    resolve(result['insertId']);
                }
            }
        );
    });
}
// endregion

// endregion

// region Instance Variables
const jobNames = {
    ANIMAL: 'animalFetch',
    PICTURE: 'pictureFetch',
    BREED: 'breedFetch',
    COLOR: 'colorFetch',
    CONTACT: 'contactFetch',
    LOCATION: 'locationFetch',
    PATTERN: 'patternFetch',
    SPECIES: 'speciesFetch',
    STATUS: 'statusFetch'
};

let currentAnimalJob = null,
    currentPictureJob = null,
    currentBreedJob = null,
    currentColorJob = null,
    currentContactJob = null,
    currentLocationJob = null,
    currentPatternJob = null,
    currentSpeciesJob = null,
    currentStatusJob = null;
// endregion

// region Shared Function - Run Node Scheduler
function runNodeScheduler({
    jobName = '',
    nodeSchedulerInstance = null,
    minuteInterval = 15,
    dayInterval = 3,
    jobFunction = () => {}
})
{
    return new Promise((resolve) =>
    {
        // if (isLocal())
        // {
        //     resolve('Node Scheduler is not usable on Dev environment');
        //     return;
        // }

        // If we already scheduled the job to start
        let nextInvocation = nodeSchedulerInstance?.nextInvocation();
        if (nextInvocation)
        {
            resolve(`A Node Scheduler instance for the selected job is already in process for next invocation (${moment.unix(nextInvocation._date.ts / 1000).fromNow()})`);
            return;
        }

        // Check if the job is already running
        checkJobIsRunning(jobName).then((isRunning) =>
        {
            if (isRunning)
            {
                resolve(`The ${jobName} job is already running`);
                return;
            }

            // Check for next reminder time
            let duration = isLocal() ? (60 * minuteInterval) : (86400 * dayInterval),
                errDuration = isLocal() ? (60 * minuteInterval) : 86400;

            getSchedulerConfig(jobName)
                .then((config) =>
                {
                    if (config)
                    {
                        let isInPast = moment().unix() > Number(config['nextRunAt']),
                            runTime = isInPast ? (moment().unix() + 1) : config['nextRunAt'];

                        if (isInPast) updateSchedulerConfig(config.id, runTime + duration);

                        // Run job
                        jobFunction({
                            scheduleTime: runTime,
                            configItemID: config.id,
                            duration,
                            alreadyUpdateTime: isInPast
                        });

                        let returnMsg = isInPast ? `(${jobName}) Scheduler will be run now!` : `(${jobName}) Scheduler will be run in ${moment.unix(runTime).diff(moment(), 'minutes')} minutes`;

                        if (isLocal()) console.log(returnMsg);
                        resolve(returnMsg);
                    }
                    else
                    {
                        let nextRunAt = moment().unix() + duration;
                        addSchedulerConfig(jobName, nextRunAt)
                            .then((newConfig) =>
                            {
                                if (newConfig)
                                {
                                    let returnMsg = `(${jobName}) Scheduler will be run in ${moment.unix(nextRunAt).diff(moment(), 'minutes')} minutes`;

                                    // Run job
                                    jobFunction({ scheduleTime: nextRunAt });

                                    if (isLocal()) console.log(returnMsg);
                                    resolve(returnMsg);
                                }
                                else
                                {
                                    let runTime = moment().unix() + errDuration,
                                        returnMsg = `(${jobName}) Scheduler will be run in ${moment.unix(runTime).diff(moment(), 'minutes')} minutes`;

                                    // Run job
                                    jobFunction({ scheduleTime: runTime });

                                    if (isLocal()) console.log(returnMsg);
                                    resolve(returnMsg);
                                }
                            });
                    }
                });
        });
    });
}
// endregion

// region Shared Function - Check Running Job
function checkJobIsRunning(jobName = '')
{
    return new Promise((resolve) =>
    {
        if (!jobName) resolve(false);

        try
        {
            let job = scheduler.getById(jobName);
            resolve(job?.getStatus() === 'running');
        }
        catch (err)
        {
            resolve(false);
        }
    });
}
// endregion

// region Function - Generate SQL Statement and Import to DB
function parseAttributeValue(attributeValue)
{
    // Check null and undefined
    if (attributeValue === '' || attributeValue === null || attributeValue === undefined)
    {
        return('NULL');
    }

    // Check arrays and objects
    if (Array.isArray(attributeValue))
    {
        return('"' + attributeValue.map((item) => JSON.stringify(item)).join('-').replaceAll('"', '') + '"');
    }
    else if (isObject(attributeValue))
    {
        return('"' + JSON.stringify(attributeValue).replaceAll(',', '-') + '"');
    }

    // Other common types
    let returnValue = 'NULL';

    switch(typeof attributeValue)
    {
        case "string":
        {
            if (isNaN(attributeValue))
            {
                returnValue = '"' + attributeValue.replaceAll('"', `'`) + '"';
            }
            else returnValue = Number(attributeValue);
            break;
        }
        case "number":
        {
            returnValue = Number(attributeValue);
            break;
        }
        case "boolean":
        {
            returnValue = attributeValue ? '1' : '0';
            break;
        }
        default:
        {
            returnValue = '"' + JSON.stringify(attributeValue).replaceAll('"', `'`) + '"';
            break;
        }
    }

    // Remove all backslash
    return(
        typeof returnValue === 'string' ?
            returnValue.replaceAll('`', '')
            :
            returnValue
    );
}

function generateImportStatement({ jobName, apiLink, tableName, dbAttributeNames = [] })
{
    return new Promise((bigResolve, bigReject) =>
    {
        // Record time
        const startedAt = moment().unix();

        // Step 1: Call the first API with pageSize=0 to get metadata from it
        let pageSize = 250;
        apiWrapper({ link: `${apiLink}?limit=0`, functionName: `[API] ${jobName}` })
            .then((metaResult) =>
            {
                let totalPages = Math.ceil(metaResult.totalResult / pageSize),
                    pageArr = Array.from(Array(totalPages), (_, x) => x + 1);

                // Step 2: Call APIs sequentially
                Promise
                    .mapSeries(pageArr, (page) => new Promise((apiResolve) =>
                    {
                        // Delay API execution time by 1s to avoid access block from Rescue Groups
                        setTimeout(() =>
                        {
                            apiWrapper({
                                link: `${apiLink}?page=${page}&limit=${pageSize}`,
                                functionName: `[API] ${jobName}`,
                                noLogs: true
                            })
                                .then((apiResult) =>
                                {
                                    // Generate recordValueList
                                    let recordValueList = apiResult.data.map((item) =>
                                    {
                                        // Add the ID in
                                        let recordValues = `(${Number(item.id)}`;

                                        // Add other attributes in, must be in order of the items in dbAttributeNames
                                        // If any value missing, put in NULL
                                        // Need to standardize the attribute returned by API first since we have some minor differences in capitalization
                                        dbAttributeNames.forEach((key) =>
                                        {
                                            let attributeValue = item['attributes'][Object.keys(item['attributes']).find((k) => k.toLowerCase() === key.toLowerCase())];

                                            if (attributeValue)
                                            {
                                                recordValues += (', ' + parseAttributeValue(attributeValue));
                                            }
                                            else recordValues += `, NULL`;
                                        });

                                        // Add closing parenthesis
                                        recordValues += ')';

                                        // Return
                                        return recordValues;
                                    });

                                    // Resolve API call
                                    apiResolve(recordValueList.join(',\n'));
                                })
                                .catch((error) =>
                                {
                                    sendSlackMessage(`[API Error] ${jobName}`, error);
                                    apiResolve([]);
                                });
                        }, 2000);
                    }))
                    .then((bigRecordValueList) =>
                    {
                        // Call INSERT statement
                        let sqlStatement =
                            `INSERT INTO ${tableName} (id, ${dbAttributeNames.join(', ')})\n` +
                            'VALUES\n' +
                            bigRecordValueList.join(',\n') +
                            '\nON DUPLICATE KEY UPDATE\n' +
                            dbAttributeNames.map((item) => (item + ' = VALUES(' + item + ')')).join(',\n');

                        // Invoke query statement to DB
                        let invokeDBWrite = function()
                        {
                            const connection = getMySQLConnection();
                            connection.query(sqlStatement, (error) =>
                            {
                                // Notify via Slack
                                if (error) sendSlackMessage(`[SQL Error] ${jobName}`, error.sqlMessage);
                                else sendSlackMessage('Done', `[Job Completed] ${jobName}, took ${moment().unix() - startedAt}s`, true);

                                // Close connection
                                connection.end();

                                // Resolve
                                bigResolve(true);
                            });
                        };

                        // Write to file for review
                        if (isLocal())
                        {
                            writeFile(`./tempData/secondHandHounds_${tableName}.sql`, sqlStatement)
                                .then(() => invokeDBWrite())
                                .catch((writeError) => {
                                    invokeDBWrite();
                                    sendSlackMessage('[Write File Error]', writeError.message);
                                });
                        }
                        else invokeDBWrite();
                    })
                    .catch((error) => bigReject(`[SCHEDULER STEP 2]\n\n${error}`));
            })
            .catch((error) => bigReject(`[SCHEDULER STEP 1]\n\n${error}`));
    });
}
// endregion

// region SCHEDULER Function
export function runJobScheduler(jobName, nodeSchedulerInstance, apiLink = '', dbAttributeNames = [], tableName = '')
{
    let minuteInterval = process.env.ANIMAL_JOB_INTERVAL_MINUTES || 5,
        dayInterval = process.env.ANIMAL_JOB_INTERVAL_DAYS || 1;

    return runNodeScheduler({
        jobName,
        nodeSchedulerInstance,
        minuteInterval,
        dayInterval,
        jobFunction: ({
            scheduleTime,
            configItemID,
            duration,
            alreadyUpdateTime
        }) => scheduleFetchJob({
            jobName,
            nodeSchedulerInstance,
            scheduleTime,
            configItemID,
            duration,
            alreadyUpdateTime,
            minuteInterval,
            dayInterval,
            apiLink,
            dbAttributeNames,
            tableName
        })
    });
}

function scheduleFetchJob({
    jobName,
    nodeSchedulerInstance,
    scheduleTime,
    configItemID,
    duration,
    alreadyUpdateTime,
    minuteInterval,
    dayInterval,

    apiLink,
    tableName = '',
    dbAttributeNames = []
})
{
    nodeSchedulerInstance = nodeScheduler.scheduleJob(moment.unix(scheduleTime).toDate(), function ()
    {
        // Configure the job
        const task = new AsyncTask(
            jobName,
            () =>
            {
                // Update next reminder time
                if (configItemID && !alreadyUpdateTime)
                {
                    let nextRunAt = moment().unix() + duration;
                    updateSchedulerConfig(configItemID, nextRunAt);
                }

                return generateImportStatement({
                    jobName,
                    apiLink,
                    tableName,
                    dbAttributeNames
                });
            },
            (error) => sendSlackMessage(`[Job Error] ${jobName}`, typeof error === 'string' ? error : (error.message + '\n\n' + JSON.stringify(error)))
        );

        const job = new SimpleIntervalJob(
            Object.assign({ runImmediately: true }, isLocal() ? { minutes: minuteInterval } : { days: dayInterval }),
            task,
            jobName
        );

        scheduler.addSimpleIntervalJob(job);
    });
}
// endregion

// region Function - Import Contacts from XML
function importContactsFromXML()
{
    return new Promise((resolve) => {
        // Log time
        const startedAt = moment().unix();

        // Fetch data
        apiWrapperXML({ type: 'contacts', viewID: '550520', tagName: 'Contact_' })
            .then((json) => {
                // Mapping attributes to their correct DB names
                let attributeMap = {
                    "id": 'id',
                    "Email": 'email',
                    "Firstname": 'firstName',
                    "Lastname": 'lastName',
                    "PhoneCell": 'phoneCell',
                    "City": 'city',
                    "State": 'state',

                    "Active": 'isActive',
                    "Address": 'address',
                    "Country": 'country',
                    "Zipcode": 'zip',
                    "Class": 'type'
                };

                // Go over all items in the JSON array and parse them to the correct format we need
                let sqlValues = [],
                    keyList = Object.keys(attributeMap),
                    dbAttributeList = keyList.map((key) => attributeMap[key]);

                json.forEach((item) => {
                    sqlValues.push(
                        '(' +
                        keyList.map((attributeKey) => {
                            if (attributeKey === 'Active')
                            {
                                return(item[attributeKey].toLowerCase() === 'yes' ? '1' : '0');
                            }
                            else return(parseAttributeValue(item[attributeKey]));
                        }).join(', ') +
                        ')'
                    );
                });

                // Generate SQL statement
                let sqlStatement =
                    `INSERT INTO Contacts (${dbAttributeList.join(', ')})\n` +
                    'VALUES\n' +
                    sqlValues.join(',\n') +
                    '\nON DUPLICATE KEY UPDATE\n' +
                    dbAttributeList.map((item) => (item + ' = VALUES(' + item + ')')).join(',\n');

                // Invoke query statement to DB
                let invokeDBWrite = function()
                {
                    const connection = getMySQLConnection();
                    connection.query(sqlStatement, (error) => {
                        // Notify result via Slack
                        if (error) sendSlackMessage(`[SQL Error] Import Contacts From XML`, error.sqlMessage);
                        else sendSlackMessage('Done', `[Job Completed] Import Contacts From XML, took ${moment().unix() - startedAt}s`, true);

                        // Close connection
                        connection.end();

                        // Resolve Promise
                        resolve('Done');
                    });
                };

                // Write to file for review
                if (isLocal())
                {
                    writeFile(`./tempData/secondHandHounds_Contacts.sql`, sqlStatement)
                        .then(() => invokeDBWrite())
                        .catch((writeError) => {
                            invokeDBWrite();
                            sendSlackMessage('[Write File Error] importContactsFromXML', writeError.message);
                        });
                }
                else invokeDBWrite();
            })
            .catch((error) => {
                sendSlackMessage('[XML Fetch Error] importContactsFromXML', error.message);
                resolve(null);
            });
    });
}
// endregion

// region Function - Import Foster/Adopter ID from XML
function importFosterAdopterFromXML()
{
    return new Promise((resolve) => {
        // Log time
        const startedAt = moment().unix();

        // Fetch data
        apiWrapperXML({ type: 'animals', viewID: '550550', tagName: 'Animal_' })
            .then((json) => {
                // Map json attribute names with DB attribute names
                let attributeMap = {
                    "id": 'id',
                    "Adopter_ContactID": 'adopterID',
                    "Foster_ContactID": 'fosterID'
                };

                // Go over all items in the JSON array and parse them to the correct format we need
                let sqlValues = [],
                    keyList = Object.keys(attributeMap),
                    dbAttributeList = keyList.map((key) => attributeMap[key]);

                json.forEach((item) => sqlValues.push('(' + keyList.map((attributeKey) => parseAttributeValue(item[attributeKey])).join(', ') + ')'));

                // Generate SQL statement
                let sqlStatement =
                    `INSERT INTO Animals (${dbAttributeList.join(', ')})\n` +
                    'VALUES\n' +
                    sqlValues.join(',\n') +
                    '\nON DUPLICATE KEY UPDATE\n' +
                    dbAttributeList.map((item) => (item + ' = VALUES(' + item + ')')).join(',\n');

                // Invoke query statement to DB
                let invokeDBWrite = function()
                {
                    const connection = getMySQLConnection();
                    connection.query(sqlStatement, (error) => {
                        // Notify via Slack
                        if (error) sendSlackMessage(`[SQL Error] Import Foster/Adopter From XML`, error.sqlMessage);
                        else sendSlackMessage('Done', `[Job Completed] Import Foster/Adopter From XML, took ${moment().unix() - startedAt}s`, true);

                        // Close connection
                        connection.end();

                        // Resolve
                        resolve('Done');
                    });
                };

                // Write to file for review
                if (isLocal())
                {
                    writeFile(`./tempData/secondHandHounds_FosterAdopter.sql`, sqlStatement)
                        .then(() => invokeDBWrite())
                        .catch((writeError) => {
                            invokeDBWrite();
                            sendSlackMessage('[Write File Error] importFosterAdopterFromXML', writeError.message);
                        });
                }
                else invokeDBWrite();
            })
            .catch((error) => {
                sendSlackMessage('[XML Fetch Error] importFosterAdopterFromXML', error.message);
                resolve('Done');
            });
    });
}
// endregion

// region Function - Import Origin/Received Date from XML
function importOriginReceivedDateFromXML()
{
    return new Promise((resolve) => {
        // Load mapping file
        const originMapping = require('../../data/SecondHandHounds/originMapping.json');

        // Log time
        const startedAt = moment().unix();

        // Fetch data
        apiWrapperXML({ type: 'animals', viewID: '550661', tagName: 'Animal_' })
            .then((json) => {
                // Map json attribute names with DB attribute names
                let attributeMap = {
                    "id": 'id',
                    "ReceivedDate": 'receivedDate',
                    "Origin": 'originRaw'
                };

                // Go over all items in the JSON array and parse them to the correct format we need
                let sqlValues = [],
                    keyList = Object.keys(attributeMap),
                    dbAttributeList = keyList.map((key) => attributeMap[key]).concat('originParsed');

                json.forEach((item) => {
                    let originParsed = originMapping.find((origin) => origin['Origin'].toLowerCase() === item['Origin']?.toLowerCase())?.['Category'] || 'Other';

                    sqlValues.push(
                        '(' +
                        keyList
                            .map((attributeKey) => {
                                if (attributeKey === 'ReceivedDate')
                                {
                                    return(item[attributeKey]?.trim() ? ('"' + moment(item[attributeKey], 'MM/DD/YYYY').format('YYYY-MM-DD') + '"') : 'NULL');
                                }
                                else return parseAttributeValue(item[attributeKey]);
                            })
                            .concat('"' + originParsed.replaceAll('\n', ' ').replaceAll('"', '') + '"')
                            .join(', ') +
                        ')'
                    );
                });

                // Generate SQL statement
                let sqlStatement =
                    `INSERT INTO Animals (${dbAttributeList.join(', ')})\n` +
                    'VALUES\n' +
                    sqlValues.join(',\n') +
                    '\nON DUPLICATE KEY UPDATE\n' +
                    dbAttributeList.map((item) => (item + ' = VALUES(' + item + ')')).join(',\n');

                // Invoke query statement to DB
                let invokeDBWrite = function()
                {
                    const connection = getMySQLConnection();
                    connection.query(sqlStatement, (error) => {
                        // Notify via Slack
                        if (error) sendSlackMessage(`[SQL Error] Import Origin/Received Date From XML`, error.sqlMessage);
                        else sendSlackMessage('Done', `[Job Completed] Import Origin/Received Date From XML, took ${moment().unix() - startedAt}s`, true);

                        // Close connection
                        connection.end();

                        // Resolve
                        resolve('Done');
                    });
                };

                // Write to file for review
                if (isLocal())
                {
                    writeFile(`./tempData/secondHandHounds_OriginReceivedDate.sql`, sqlStatement)
                        .then(() => invokeDBWrite())
                        .catch((writeError) => {
                            invokeDBWrite();
                            sendSlackMessage('[Write File Error] importOriginReceivedDateFromXML', writeError.message);
                        });
                }
                else invokeDBWrite();
            })
            .catch((error) => {
                sendSlackMessage('[Fetch XML Error] importOriginReceivedDateFromXML', error.message);
                resolve('Done');
            });
    });
}
// endregion

// region POST - Import from XML
secondHandHoundsRouter.post('/importContactsXML', sloppyAuthenticate, (request, response) => {
    // Call function
    importContactsFromXML();

    // Response first, notify result over Slack later
    Success(response, 'Import Contacts from XML initiated, result will be notified via Slack');
});

secondHandHoundsRouter.post('/importFosterAdopterXML', sloppyAuthenticate, (request, response) => {
    // Call function
    importFosterAdopterFromXML();

    // Response first, notify result over Slack later
    Success(response, 'Import Foster/Adopter from XML initiated, result will be notified via Slack');
});

secondHandHoundsRouter.post('/importOriginReceivedDateXML', sloppyAuthenticate, (request, response) => {
    // Call function
    importOriginReceivedDateFromXML();

    // Response first, notify result over Slack later
    Success(response, 'Import Origin/Received Date from XML initiated, result will be notified via Slack');
});
// endregion

// region POST - Start Scheduler
secondHandHoundsRouter.post('/oneTimeImport', sloppyAuthenticate, (request, response) =>
{
    // Response back first and execute APIs later
    Success(response, 'Jobs executed, you will be notified via Slack');

    // Initiate all promises
    Promise
        .mapSeries([
            {
                // Breeds
                jobName: jobNames.BREED,
                apiLink: '/animals/breeds',
                tableName: 'Breeds',
                dbAttributeNames: ['name']
            },
            {
                // Patterns
                jobName: jobNames.PATTERN,
                apiLink: '/animals/patterns',
                tableName: 'Patterns',
                dbAttributeNames: ['name']
            },
            {
                // Species
                jobName: jobNames.SPECIES,
                apiLink: '/animals/species',
                tableName: 'Species',
                dbAttributeNames: ['singular', 'plural', 'youngSingular', 'youngPlural']
            },
            {
                // Statuses
                jobName: jobNames.STATUS,
                apiLink: '/animals/statuses',
                tableName: 'Statuses',
                dbAttributeNames: ['name', 'description']
            },
            {
                // Colors
                jobName: jobNames.COLOR,
                apiLink: '/animals/colors',
                tableName: 'Colors',
                dbAttributeNames: ['name']
            },
            {
                // Animals
                jobName: jobNames.ANIMAL,
                apiLink: '/orgs/3699/animals',
                tableName: 'Animals',
                dbAttributeNames: [
                    "activityLevel",
                    "adoptedDate",
                    "adoptionFeeString",
                    "adultSexesOk",
                    "ageGroup",
                    "ageString",
                    "availableDate",
                    "birthDate",
                    "breedPrimary",
                    "breedPrimaryId",
                    "breedSecondary",
                    "breedSecondaryId",
                    "breedString",
                    "coatLength",
                    "colorDetails",
                    "createdDate",
                    "descriptionText",
                    "distinguishingMarks",
                    "earType",
                    "energyLevel",
                    "exerciseNeeds",
                    "eyeColor",
                    "fenceNeeds",
                    "foundDate",
                    "foundPostalcode",
                    "groomingNeeds",
                    "housetrainedReasonNot",
                    "indoorOutdoor",
                    "isAdoptionPending",
                    "isAltered",
                    "isBirthDateExact",
                    "isBreedMixed",
                    "isCatsOk",
                    "isCourtesyListing",
                    "isCurrentVaccinations",
                    "isDeclawed",
                    "isDogsOk",
                    "isFarmAnimalsOk",
                    "isFound",
                    "isHousetrained",
                    "isKidsOk",
                    "isMicrochipped",
                    "isNeedingFoster",
                    "isSeniorsOk",
                    "isSpecialNeeds",
                    "isSponsorable",
                    "isYardRequired",
                    "killDate",
                    "killReason",
                    "name",
                    "newPeopleReaction",
                    "obedienceTraining",
                    "ownerExperience",
                    "pictureCount",
                    "pictureThumbnailUrl",
                    "priority",
                    "qualities",
                    "rescueId",
                    "searchString",
                    "sex",
                    "sheddingLevel",
                    "sizeCurrent",
                    "sizeGroup",
                    "sizePotential",
                    "sizeUOM",
                    "slug",
                    "specialNeedsDetails",
                    "sponsors",
                    "sponsorshipDetails",
                    "sponsorshipMinimum",
                    "summary",
                    "tailType",
                    "trackerimageUrl",
                    "updatedDate",
                    "url",
                    "videoCount",
                    "videoUrlCount",
                    "vocalLevel"
                ]
            },
            'contactImport',
            'animalFosterAdopterImport',
            'animalOriginReceivedDateImport'
        ], (item) => {
            if (typeof item === 'string')
            {
                switch(item)
                {
                    case 'contactImport': return importContactsFromXML();
                    case 'animalFosterAdopterImport': return importFosterAdopterFromXML();
                    case 'animalOriginReceivedDateImport': return importOriginReceivedDateFromXML();
                }
            }
            else return generateImportStatement(item);
        })
        .then(() => sendSlackMessage('Path: /oneTimeImport', 'Finished all imports', true))
        .catch((error) => sendSlackMessage('Path: /oneTimeImport', error.message));
});
// endregion

export { secondHandHoundsRouter };
