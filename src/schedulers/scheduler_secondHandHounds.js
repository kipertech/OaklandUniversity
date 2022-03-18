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

// Helpers
import { apiWrapper } from "../utils/util_api_helpers";

// Define scheduler
const scheduler = new ToadScheduler();

// Global
const GLOBAL = require('../configs/config_secondHandHounds');

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
    return new Promise((resolve) => {
        const connection = getMySQLConnection();

        connection.query(
            {
                sql: "SELECT * FROM SchedulerConfigs WHERE name = ?",
                timeout: 10000,
                values: [jobName]
            },
            (error, results) => {
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
        (error) => {
            if (error)
            {
                connection.end();
                sendSlackMessage('Updating SchedulerConfigs', error.sqlMessage);
            }
            else connection.end();
        }
    );
}
// endregion

// region Query - Add New Scheduler Config
function addSchedulerConfig(jobName, nextRunAt)
{
    return new Promise((resolve) => {
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
            (error, result) => {
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

// region --- RESCUE GROUPS API ---

// region List Animal API
export function getAnimalList(currentPage = 1, pageSize = 100)
{
    return apiWrapper(
        `/animals?page=${currentPage}&limit=${pageSize}`,
        'GET',
        'GET ANIMAL LIST'
    );
}
// endregion

// endregion

const jobNames = {
    ANIMAL: 'animalFetch'
};

let currentAnimalJob = null;

// region Shared Function - Run Node Scheduler
function runNodeScheduler({
    jobName = '',
    nodeSchedulerInstance = null,
    minuteInterval = 15,
    dayInterval = 3,
    jobFunction = () => {}
})
{
    return new Promise((resolve) => {
        // if (process.env.IS_LOCAL === 'true')
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
        checkJobIsRunning(jobName).then((isRunning) => {
            if (isRunning)
            {
                resolve(`The ${jobName} job is already running`);
                return;
            }

            // Check for next reminder time
            let duration = process.env.IS_LOCAL === 'true' ? (60 * minuteInterval) : (86400 * dayInterval),
                errDuration = process.env.IS_LOCAL === 'true' ? (60 * minuteInterval) : 86400;

            getSchedulerConfig(jobName)
                .then((config) => {
                    if (config)
                    {
                        let isInPast = moment().unix() > Number(config['nextRunAt']),
                            runTime = isInPast ? (moment().unix() + 1) : config['nextRunAt'];

                        if (isInPast) updateSchedulerConfig(config.id, runTime + duration);
                        jobFunction(runTime, config.id, duration, isInPast);

                        let returnMsg = isInPast ? `(${jobName}) Scheduler will be run now!` : `(${jobName}) Scheduler will be run in ${moment.unix(runTime).diff(moment(), 'minutes')} minutes`;

                        if (process.env.IS_LOCAL === 'true') console.log(returnMsg);
                        resolve(returnMsg);
                    }
                    else
                    {
                        let nextRunAt = moment().unix() + duration;
                        addSchedulerConfig(jobName, nextRunAt)
                            .then((newConfig) => {
                                if (newConfig)
                                {
                                    let returnMsg = `(${jobName}) Scheduler will be run in ${moment.unix(nextRunAt).diff(moment(), 'minutes')} minutes`;
                                    jobFunction(nextRunAt);

                                    if (process.env.IS_LOCAL === 'true') console.log(returnMsg);
                                    resolve(returnMsg);
                                }
                                else
                                {
                                    let runTime = moment().unix() + errDuration,
                                        returnMsg = `(${jobName}) Scheduler will be run in ${moment.unix(runTime).diff(moment(), 'minutes')} minutes`;

                                    jobFunction(runTime);

                                    if (process.env.IS_LOCAL === 'true') console.log(returnMsg);
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
    return new Promise((resolve) => {
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

// region SCHEDULER - Animals
export function runAnimalScheduler()
{
    return runNodeScheduler({
        jobName: jobNames.ANIMAL,
        nodeSchedulerInstance: currentAnimalJob,
        minuteInterval: process.env.ANIMAL_JOB_INTERVAL_MINUTES || 5,
        dayInterval: process.env.ANIMAL_JOB_INTERVAL_DAYS || 1,
        jobFunction: (a, b, c, d) => scheduleAnimalFetch(a, b, c, d)
    });
}

function scheduleAnimalFetch(scheduleTime, configItemID = null, duration = 86400 * 2, alreadyUpdateTime = false)
{
    currentAnimalJob = nodeScheduler.scheduleJob(moment.unix(scheduleTime).toDate(), function () {
        // Configure the job
        const task = new AsyncTask(
            jobNames.ANIMAL,
            () => {
                // Update next reminder time
                if (configItemID && !alreadyUpdateTime)
                {
                    let nextRunAt = moment().unix() + duration;
                    updateSchedulerConfig(configItemID, nextRunAt);
                }

                // TODO: Start calling List Animal API
                return new Promise((bigResolve, bigReject) => {
                    // Record time
                    const startedAt = moment().unix();

                    // Execute task
                    setTimeout(() => {
                        sendSlackMessage('Done', `Fake data fetch completed, took ${moment().unix() - startedAt}s`, true);
                        bigResolve(true);
                    }, 3000);
                });
            },
            (error) => sendSlackMessage('Scheduler Error', error.message + '\n\n' + JSON.stringify(error))
        );

        const job = new SimpleIntervalJob(
            Object.assign({ runImmediately: true }, process.env.IS_LOCAL === 'true' ? { minutes: process.env.ANIMAL_JOB_INTERVAL_MINUTES || 5 } : { days: process.env.ANIMAL_JOB_INTERVAL_DAYS || 1 }),
            task,
            jobNames.ANIMAL
        );

        scheduler.addSimpleIntervalJob(job);
    });
}
// endregion
