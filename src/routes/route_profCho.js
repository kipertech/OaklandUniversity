import { Router } from "express";
import * as readLine from 'readline';
import { createReadStream } from "fs";
import {
    readdir,
    writeFile,
    stat
} from 'fs/promises';
import fetch from "node-fetch";
import moment from "moment";
import json2xls from "json2xls";

// Modules
import {
    Abort,
    Success,
    getFirstDateFromString,
    htmlToText
} from '../utils';

let profChoRouter = Router();

// region --- CIK Crawler ---

// region Function - Get content of each form's url
function checkFormContent(checkItem = {}, index)
{
    return new Promise((resolve) => {
        setTimeout(() => {
            fetch(checkItem.url, {
                headers: {
                    'User-Agent': 'hoangphatpham@oakland.edu',
                    'Accept-Encoding': 'gzip,deflate'
                }
            })
                .then((response) => response.text())
                .then((body) => {
                    let plainText = htmlToText(body);
                    if (plainText.toLowerCase().includes('topic 842'))
                    {
                        let occurrenceCount = plainText.match(new RegExp('Topic 842', 'g')).length,
                            totalParagraphHasAdopt = 0,
                            longestParagraphIndex = 0,
                            longestParagraphLength = 0,
                            textList = [];

                        let getTextFunc = (firstIndex) => {
                            let searchPos = plainText.indexOf('Topic 842', firstIndex),
                                textBefore = plainText.substring(0, searchPos),
                                startPos = textBefore.lastIndexOf('\n'),
                                endPos = plainText.indexOf('\n', searchPos),
                                foundParagraph = plainText.substring(startPos + 1, endPos),
                                hasAdopt = foundParagraph.match(new RegExp('adopt', 'ig'))?.length > 0;

                            return({ text: foundParagraph || '', lastPos: endPos, hasAdopt });
                        };

                        let currentText = getTextFunc(0);
                        textList.push(currentText.text);
                        totalParagraphHasAdopt += currentText.hasAdopt ? 1 : 0;
                        longestParagraphLength = currentText.text.length;

                        for (let i = 2; i <= occurrenceCount; ++i)
                        {
                            currentText = getTextFunc(currentText.lastPos);
                            textList.push(currentText.text);
                            totalParagraphHasAdopt += currentText.hasAdopt ? 1 : 0;

                            let paragraphLength = currentText.text.length;
                            if (paragraphLength > longestParagraphLength)
                            {
                                longestParagraphLength = paragraphLength;
                                longestParagraphIndex = i - 1;
                            }
                        }

                        let longestText = textList[longestParagraphIndex]

                        resolve({
                            url: checkItem.url,
                            occurrenceCount,
                            totalParagraphHasAdopt,
                            longestText,
                            reportedDate: checkItem.filingDate,
                            adoptedDate: getFirstDateFromString(longestText, '842', 0)
                        });
                    }
                    else resolve(false);
                })
                .catch((error) => resolve('[Fetch Error] ' + error.message))
        }, index * 500);
    });
}
// endregion

// region Function - Get CIK Data Single
function getCIKDataSingle(CIK)
{
    return new Promise((resolve, reject) => {
        // Get the JSON file first
        let link = `https://data.sec.gov/submissions/CIK${CIK}.json`;
        fetch(link, {
            headers: {
                'User-Agent': 'hoangphatpham@oakland.edu',
                'Accept-Encoding': 'gzip,deflate'
            }
        })
            .then((webResponse) => {
                if (webResponse.status !== 200)
                {
                    return({ statusCode: webResponse.status });
                }
                else return webResponse.json();
            })
            .then((webResponse) => {
                if (webResponse.statusCode)
                {
                    reject('Error status code: ' + webResponse.statusCode);
                    return;
                }

                // Important Fields
                // (fillings.recent) accessionNumber - filingDate - form - primaryDocument
                let parentObj = webResponse['filings']['recent'],
                    accessionNumber = parentObj['accessionNumber'],
                    filingDate = parentObj['filingDate'],
                    form = parentObj['form'],
                    primaryDocument = parentObj['primaryDocument'];

                // Generate list of all 10-K form links
                let formList = [];

                // Get only the 10-K form
                form.forEach((item, index) => {
                    if (item === '10-K' && primaryDocument[index].includes('.htm') && moment(filingDate[index], 'YYYY-MM-DD').year() >= 2017)
                    {
                        let accessNum = accessionNumber[index].toString(),
                            docName = primaryDocument[index];

                        formList.push({
                            accessionNumber: accessionNumber[index],
                            filingDate: filingDate[index],
                            form: item,
                            primaryDocument: primaryDocument[index],
                            url: `https://www.sec.gov/Archives/edgar/data/${CIK}/${accessNum.replaceAll('-', '')}/${docName}`
                        });
                    }
                });

                // Generate Url-only list
                let checkList = formList.map((item) => ({
                    CIK,
                    filingDate: item.filingDate,
                    url: item.url
                }));

                // Check if any url contains "Topic 842"
                Promise.all(checkList.map((item, index) => checkFormContent(item, index)))
                    .then((allResult) => {
                        let responseObj = {
                            CIK,
                            companyName: webResponse.name,
                            filingCheck: allResult,
                            bestResult: allResult.reverse().find((item) => item && item['adoptedDate'].isValid)
                        };

                        // Response back
                        resolve(responseObj);
                    })
                    .catch((promiseErr) => reject(promiseErr.message));
            })
            .catch((error) => reject(error.message));
    });
}
// endregion

// region GET - Single SEC Crawl
profChoRouter.get('/singleCrawl/:CIK', (request, response) => {
    let CIK = request.params['CIK'];

    if (!CIK)
    {
        Abort(response, 'CIK is required', 403);
        return;
    }

    getCIKDataSingle(CIK)
        .then((responseObj) => Success(response, 'Successfully detect Topic 842', responseObj, 200))
        .catch((error) => Abort(response, 'Failed to fetch company filing list', 500, error));
});
// endregion

// region GET - SEC Crawl - Multiple
profChoRouter.get('/multiCrawl', (request, response) => {
    let CIKList = require('../data/CIK.json');

    let smallFunc = function(cik, index)
    {
        return new Promise((resolve) => {
            setTimeout(() => {
                getCIKDataSingle(cik)
                    .then((data) => resolve(data))
                    .catch((error) => {
                        console.log('error', error.message);
                        resolve({});
                    });
            }, index * 500);
        });
    };

    Promise
        .all(CIKList.map((cik, index) => smallFunc(cik, index)))
        .then((finalResult) => {
            let formatList = finalResult.map((item) => ({
                CIK: item.CIK,
                reportedDate: item.bestResult?.reportedDate,
                adoptionDate: item.bestResult?.adoptedDate,
                bestParagraphFound: item.bestResult?.longestText
            }));

            writeFile(`./multiData.json`, JSON.stringify(formatList, null, 4))
                .then(() => Success(response, 'Write file successfully'))
                .catch((writeError) => Abort(response, 'Write Error', 500, writeError.message));
        })
        .catch((error) => Abort(response, 'Failed to get multiple data', 500, error.message));
});
// endregion

// region POST - Fix Multi Data File
profChoRouter.post('/fixMultiDataFile', (request, response) => {
    let CIKList = require('../data/CIK.json'),
        dataList = require('../multiData.json');

    let fixedList = [];

    dataList.forEach((item, index) => {
        let errorText = item['CIK'] ? '(Not Found)' : '(Error)';

        fixedList.push({
            "CIK": !item['CIK'] ? CIKList[index] : item['CIK'],
            "reportedDate": item['reportedDate'] || errorText,
            "adoptionDate": item['adoptionDate']?.dateStr || errorText,
            "bestParagraphFound": item['bestParagraphFound']?.trim() || errorText
        });
    });

    writeFile(`./multiDataFixed.json`, JSON.stringify(fixedList, null, 4))
        .then(() => Success(response, 'Fixed file successfully'))
        .catch((writeError) => Abort(response, 'Write Error', 500, writeError.message));
});
// endregion

// endregion

// region --- SEC Financial Data ---

// region GET - All Tags for All Years
profChoRouter.get('/allTagNames', (request, response) => {
    let singleYear = request.query['singleYear'];

    let yearArr = singleYear ? [singleYear] : [...Array(12).keys()].map((i) => i + 2009),
        apiCalls = yearArr.map((year) => {
            const filePath = "E:\\Prof. Cho Project\\Data\\" + year.toString() + "q3_notes" + "\\num.tsv";

            return new Promise((resolve) => {
                // Check if the file exists
                stat(filePath)
                    .then(() => {
                        // Read the file line-by-line
                        let tagList = [],
                            currentLineCount = 0,
                            yearTimeStart = moment().unix();

                        console.log('[Started]', year);

                        // Read the file line-by-line
                        readLine.createInterface({ input: createReadStream(filePath) })
                            .on('line', (data) => {
                                let dataLine = data.split("\t"),
                                    tagName = dataLine[1];

                                // Put tag into corresponding category
                                if (!tagList.includes(tagName)) tagList.push(tagName);

                                // Increase line counter
                                currentLineCount += 1;
                            })
                            .on('close', () => {
                                console.log('[Completed] ' + year + ' in ' + ((moment().unix() - yearTimeStart) / 60).toFixed(1) + ' minutes - Read ' + currentLineCount + ' lines.');
                                resolve({ year, tagList, totalLines: currentLineCount });
                            });
                    })
                    .catch((error) => {
                        console.log('[FAILED] File Not Exists', error.message);
                        resolve(false);
                    });
            });
        });

    Promise
        .all(apiCalls)
        .then((resultArr) => {
            let resultObj = {},
                totalLines = 0;

            resultArr.forEach((yearObj) => {
                if (yearObj)
                {
                    resultObj[yearObj.year] = yearObj.tagList;
                    totalLines += yearObj.totalLines;
                }
            });

            writeFile(`./profCho_allTagNames.json`, JSON.stringify(resultObj, null, 4))
                .then(() => Success(response, 'Write file successfully', { totalLines }, 200))
                .catch((writeError) => Abort(response, 'Write Error', 500, writeError.message));
        });
});
// endregion

// region GET - Tag Names
profChoRouter.get('/tagNames', (request, response) => {
    let year = request.query['year'],
        matchOnly = request.query['matchOnly'] || false;

    let timeStart = moment().valueOf();

    if (!year)
    {
        Abort(response, 'Failed to get tag name', 403, 'Missing input year');
        return;
    }

    // Define data file path
    const filePath = "E:\\Prof. Cho Project\\Data\\" + year.toString() + "q3_notes" + "\\num.tsv";

    // Define search strings
    const searchStrings = [
        'Revenue',
        'SalesRevenueNet',
        'CostOfGoodsAndServicesSold',
        'NetIncomeLoss',
        'GrossProfit',
        'ResearchAndDevelopmentExpense',
        'SellingGeneralAndAdministrativeExpense',
    ];

    // Read the file line-by-line
    let tagObj = {},
        currentLineCount = 0,
        lowerSearchStrings = searchStrings.map((str) => str.toLowerCase());

    // Initialize object
    searchStrings.forEach((item) => tagObj[item] = []);

    // Read the file line-by-line
    readLine.createInterface({ input: createReadStream(filePath) })
        .on('line', (data) => {
            let dataLine = data.split("\t"),
                tagName = dataLine[1];

            // Put tag into corresponding category
            lowerSearchStrings.forEach((item, index) => {
                let tagNameMatch =
                    matchOnly ?
                        (tagName.toLowerCase() === item)
                        :
                        (tagName.toLowerCase().includes(item));

                if (tagNameMatch && !tagObj[searchStrings[index]].includes(tagName))
                {
                    tagObj[searchStrings[index]].push(tagName);
                }
            });

            // Increase line counter
            currentLineCount += 1;
        })
        .on('close', () => {
            tagObj['Summary'] = {
                'Total Line': currentLineCount,
                'Total Time': (moment().valueOf() - timeStart) / 1000,
                'Category Count': {}
            };

            searchStrings.forEach((item) => tagObj['Summary']['Category Count'][item] = tagObj[item].length);

            // Response back
            Success(response, 'Successfully read file', tagObj, 200);
        });
});
// endregion

// endregion

// region GET - Tagged Data For Years

// Define search strings
const searchStrings = [
    'SalesRevenueNet',
    'CostOfGoodsAndServicesSold',
    'NetIncomeLoss'
];

function getAllFoldersFromYear(year = '')
{
    return new Promise((resolve) => {
        if (!year) resolve([]);

        let directoryPath = "E:\\Prof. Cho Project\\Data\\";

        readdir(directoryPath)
            .then((files) => {
                console.log('[SUCCESS] Found File List', files);
                let filteredFolders = files.filter((item) => item.includes(year.toString()));
                resolve(filteredFolders.map((fileName) => `${directoryPath}\\${fileName}\\`));
            })
            .catch((error) => {
                console.log('[FAILED] Read Folder', error);
                resolve([]);
            });
    });
}

function getDataFromNum(folderPath)
{
    let filePath = folderPath + "num.tsv";

    // Define header
    let headerTags = ['adsh', 'tag', 'version', 'ddate', 'qtrs', 'uom', 'dimh', 'iprx', 'value', 'footnote', 'footlen', 'dimn', 'coreg', 'durp', 'datp', 'dcml']

    return new Promise((resolve) => {
        // Read the file line-by-line
        let tagData = {},
            lowerSearchStrings = searchStrings.map((str) => str.toLowerCase());

        // Initialize object
        searchStrings.forEach((item) => tagData[item] = []);

        // Read the file line-by-line
        readLine.createInterface({ input: createReadStream(filePath) })
            .on('line', (data) => {
                let dataLine = data.split("\t"),
                    tagName = dataLine[1];

                // Put tag into corresponding category
                lowerSearchStrings.forEach((item, index) => {
                    let tagNameMatch = tagName.toLowerCase() === (item);
                    if (tagNameMatch)
                    {
                        let newDataLine = {};
                        newDataLine['companyCode'] = dataLine[0].substring(0, 10);
                        headerTags.forEach((headerItem, headerIndex) => newDataLine[headerItem] = dataLine[headerIndex]);
                        tagData[searchStrings[index]].push(newDataLine);
                    }
                });
            })
            .on('close', () => resolve(tagData));
    });
}

function writeJSONtoExcel(jsonFile, fileName)
{
    return new Promise((resolve) => {
        const xls = json2xls(jsonFile);
        writeFile(fileName, xls, 'binary')
            .then(() => resolve('Done'))
            .catch((writeError) => resolve(writeError.message));
    });
}

profChoRouter.post('/tagData', (request, response) => {
    let year = request.query['year'];

    if (!year)
    {
        Abort(response, 'Failed to get tag name', 403, 'Missing input year');
        return;
    }

    // Get folder list
    getAllFoldersFromYear(year)
        .then((folderList) => {
            let dataCalls = folderList.map((folderPath) => getDataFromNum(folderPath));

            // Execute data extraction for all quarters/months in the year
            Promise.all(dataCalls)
                .then((resultArr) => {
                    // Combine all data into one big JSON
                    let tagData = {};
                    searchStrings.forEach((tagName) => {
                        tagData[tagName] = [];
                        resultArr.forEach((dataFile) => tagData[tagName] = tagData[tagName].concat(dataFile[tagName]));
                    });

                    // Convert into Excel (for each category)
                    let exportPath = "E:\\Prof. Cho Project\\Exported Data",
                        convertCalls = Object.keys(tagData).map((tagName) => writeJSONtoExcel(tagData[tagName], `${exportPath}\\${tagName}_${year}.xlsx`));

                    Promise.all(convertCalls)
                        .then((convertResultArr) => {
                            let successCount = convertResultArr.filter((resultText) => resultText === 'Done').length,
                                failureCount = convertResultArr.length - successCount;

                            Success(response, 'Successfully exported financial files for ' + year, { successCount, failureCount });
                        });
                })
                .catch((error) => Abort(response, 'Failed to execute all Promises', 500, error.message));
        });
});
// endregion

export default profChoRouter;
