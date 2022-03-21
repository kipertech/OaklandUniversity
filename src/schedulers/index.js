export * from './scheduler_secondHandHounds';

// TEMPLATE
// // region SCHEDULER - Animals
// export function runAnimalScheduler()
// {
//     return runNodeScheduler({
//         jobName: jobNames.ANIMAL,
//         nodeSchedulerInstance: currentAnimalJob,
//         minuteInterval: process.env.ANIMAL_JOB_INTERVAL_MINUTES || 5,
//         dayInterval: process.env.ANIMAL_JOB_INTERVAL_DAYS || 1,
//         jobFunction: (a, b, c, d) => scheduleAnimalFetch(a, b, c, d)
//     });
// }
//
// function scheduleAnimalFetch(scheduleTime, configItemID = null, duration = 86400 * 2, alreadyUpdateTime = false)
// {
//     currentAnimalJob = nodeScheduler.scheduleJob(moment.unix(scheduleTime).toDate(), function () {
//         // Configure the job
//         const task = new AsyncTask(
//             jobNames.ANIMAL,
//             () => {
//                 // Update next reminder time
//                 if (configItemID && !alreadyUpdateTime)
//                 {
//                     let nextRunAt = moment().unix() + duration;
//                     updateSchedulerConfig(configItemID, nextRunAt);
//                 }
//
//                 return new Promise((bigResolve, bigReject) => {
//                     // Record time
//                     const startedAt = moment().unix();
//
//                     // Execute task
//                     setTimeout(() => {
//                         sendSlackMessage('Done', `Fake data fetch completed, took ${moment().unix() - startedAt}s`, true);
//                         bigResolve(true);
//                     }, 3000);
//                 });
//             },
//             (error) => sendSlackMessage('Scheduler Error', error.message + '\n\n' + JSON.stringify(error))
//         );
//
//         const job = new SimpleIntervalJob(
//             Object.assign({ runImmediately: true }, process.env.IS_LOCAL === 'true' ? { minutes: process.env.ANIMAL_JOB_INTERVAL_MINUTES || 5 } : { days: process.env.ANIMAL_JOB_INTERVAL_DAYS || 1 }),
//             task,
//             jobNames.ANIMAL
//         );
//
//         scheduler.addSimpleIntervalJob(job);
//     });
// }
// // endregion
