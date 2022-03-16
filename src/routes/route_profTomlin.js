import { Router } from "express";
import { writeFile } from 'fs/promises';
import json2xls from 'json2xls';
import fs from 'fs';
import ExcelJS from "exceljs";

// Modules
import {
    Abort,
    Success
} from '../utils';

let profTomlinRouter = Router();

// Data File
// const dataFile = require('../../data/ProfTomlin/FullData_PriorRemoved.json');
const dataFile = [];

// region --- COMPENSATION ---
// region Check Fields
let checkFields = [
    "Total Annual Cash Compensation  2019",
    "Total Annual Cash Compensation  2018",
    "Total Annual Cash Compensation  2017",
    "Total Annual Cash Compensation  2016",
    "Total Annual Cash Compensation  2015",
    "Total Annual Cash Compensation  2014",
    "Total Annual Cash Compensation  2013",
    "Total Annual Cash Compensation  2012",
    "Total Annual Cash Compensation  2011",
    "Total Annual Cash Compensation  2010",
    "Total Annual Cash Compensation  2009",
    "Total Annual Cash Compensation  2008",
    "Salary  2019",
    "Salary  2018",
    "Salary  2017",
    "Salary  2016",
    "Salary  2015",
    "Salary  2014",
    "Salary  2013",
    "Salary  2012",
    "Salary  2011",
    "Salary  2010",
    "Salary  2009",
    "Salary  2008",
    "Non-Equity Annual Incentive Plan  2019",
    "Non-Equity Annual Incentive Plan  2018",
    "Non-Equity Annual Incentive Plan  2017",
    "Non-Equity Annual Incentive Plan  2016",
    "Non-Equity Annual Incentive Plan  2015",
    "Non-Equity Annual Incentive Plan  2014",
    "Non-Equity Annual Incentive Plan  2013",
    "Non-Equity Annual Incentive Plan  2012",
    "Non-Equity Annual Incentive Plan  2011",
    "Non-Equity Annual Incentive Plan  2010",
    "Non-Equity Annual Incentive Plan  2009",
    "Non-Equity Annual Incentive Plan  2008",
    "Total Options Amount  [Latest Annual - 1]",
    "Total Options Amount  [Latest Annual - 2]",
    "Total Options Amount  [Latest Annual - 3]",
    "Total Options Amount  [Latest Annual - 4]",
    "Total Options Amount  [Latest Annual - 5]",
    "Total Options Amount  [Latest Annual - 6]",
    "Total Options Amount  [Latest Annual - 7]",
    "Total Options Amount  [Latest Annual - 8]",
    "Total Options Amount  [Latest Annual - 9]",
    "Total Options Amount  [Latest Annual - 10]",
    "Total Options Amount  [Latest Annual - 11]",
    "Total Options Amount  [Latest Annual - 12]",
    "Bonus  2019",
    "Bonus  2018",
    "Bonus  2017",
    "Bonus  2016",
    "Bonus  2015",
    "Bonus  2014",
    "Bonus  2013",
    "Bonus  2012",
    "Bonus  2011",
    "Bonus  2010",
    "Bonus  2009",
    "Bonus  2008",
    "Director Bonus  2019",
    "Director Bonus  2018",
    "Director Bonus  2017",
    "Director Bonus  2016",
    "Director Bonus  2015",
    "Director Bonus  2014",
    "Director Bonus  2013",
    "Director Bonus  2012",
    "Director Bonus  2011",
    "Director Bonus  2010",
    "Director Bonus  2009",
    "Director Bonus  2008",
    "Cash And Equivalents [Latest Annual - 1] ",
    "Cash And Equivalents [Latest Annual - 2] ",
    "Cash And Equivalents [Latest Annual - 3] ",
    "Cash And Equivalents [Latest Annual - 4] ",
    "Cash And Equivalents [Latest Annual - 5] ",
    "Cash And Equivalents [Latest Annual - 6] ",
    "Cash And Equivalents [Latest Annual - 7] ",
    "Cash And Equivalents [Latest Annual - 8] ",
    "Cash And Equivalents [Latest Annual - 9] ",
    "Cash And Equivalents [Latest Annual - 10] ",
    "Cash And Equivalents [Latest Annual - 11] ",
    "Cash And Equivalents [Latest Annual - 12] ",
    "Total Stock Awards Amount  [Latest Annual - 1]",
    "Total Stock Awards Amount  [Latest Annual - 2]",
    "Total Stock Awards Amount  [Latest Annual - 3]",
    "Total Stock Awards Amount  [Latest Annual - 4]",
    "Total Stock Awards Amount  [Latest Annual - 5]",
    "Total Stock Awards Amount  [Latest Annual - 6]",
    "Total Stock Awards Amount  [Latest Annual - 7]",
    "Total Stock Awards Amount  [Latest Annual - 8]",
    "Total Stock Awards Amount  [Latest Annual - 9]",
    "Total Stock Awards Amount  [Latest Annual - 10]",
    "Total Stock Awards Amount  [Latest Annual - 11]",
    "Total Stock Awards Amount  [Latest Annual - 12]",
    "Option Awards  2019",
    "Option Awards  2018",
    "Option Awards  2017",
    "Option Awards  2016",
    "Option Awards  2015",
    "Option Awards  2014",
    "Option Awards  2013",
    "Option Awards  2012",
    "Option Awards  2011",
    "Option Awards  2010",
    "Option Awards  2009",
    "Option Awards  2008",
    "Director Option Awards  2019",
    "Director Option Awards  2018",
    "Director Option Awards  2017",
    "Director Option Awards  2016",
    "Director Option Awards  2015",
    "Director Option Awards  2014",
    "Director Option Awards  2013",
    "Director Option Awards  2012",
    "Director Option Awards  2011",
    "Director Option Awards  2010",
    "Director Option Awards  2009",
    "Director Option Awards  2008"
];
// endregion

// region Field Keys
let compensationFields = [
    "Total Annual Cash Compensation  2008",
    "Total Annual Cash Compensation  2009",
    "Total Annual Cash Compensation  2010",
    "Total Annual Cash Compensation  2011",
    "Total Annual Cash Compensation  2012",
    "Total Annual Cash Compensation  2013",
    "Total Annual Cash Compensation  2014",
    "Total Annual Cash Compensation  2015",
    "Total Annual Cash Compensation  2016",
    "Total Annual Cash Compensation  2017",
    "Total Annual Cash Compensation  2018",
    "Total Annual Cash Compensation  2019",
    "Salary  2008",
    "Salary  2009",
    "Salary  2010",
    "Salary  2011",
    "Salary  2012",
    "Salary  2013",
    "Salary  2014",
    "Salary  2015",
    "Salary  2016",
    "Salary  2017",
    "Salary  2018",
    "Salary  2019",
    "Non-Equity Annual Incentive Plan  2008",
    "Non-Equity Annual Incentive Plan  2009",
    "Non-Equity Annual Incentive Plan  2010",
    "Non-Equity Annual Incentive Plan  2011",
    "Non-Equity Annual Incentive Plan  2012",
    "Non-Equity Annual Incentive Plan  2013",
    "Non-Equity Annual Incentive Plan  2014",
    "Non-Equity Annual Incentive Plan  2015",
    "Non-Equity Annual Incentive Plan  2016",
    "Non-Equity Annual Incentive Plan  2017",
    "Non-Equity Annual Incentive Plan  2018",
    "Non-Equity Annual Incentive Plan  2019",
    "Total Options Amount  2008",
    "Total Options Amount  2009",
    "Total Options Amount  2010",
    "Total Options Amount  2011",
    "Total Options Amount  2012",
    "Total Options Amount  2013",
    "Total Options Amount  2014",
    "Total Options Amount  2015",
    "Total Options Amount  2016",
    "Total Options Amount  2017",
    "Total Options Amount  2018",
    "Total Options Amount  2019",
    "Bonus  2008",
    "Bonus  2009",
    "Bonus  2010",
    "Bonus  2011",
    "Bonus  2012",
    "Bonus  2013",
    "Bonus  2014",
    "Bonus  2015",
    "Bonus  2016",
    "Bonus  2017",
    "Bonus  2018",
    "Bonus  2019",
    "Director Bonus  2008",
    "Director Bonus  2009",
    "Director Bonus  2010",
    "Director Bonus  2011",
    "Director Bonus  2012",
    "Director Bonus  2013",
    "Director Bonus  2014",
    "Director Bonus  2015",
    "Director Bonus  2016",
    "Director Bonus  2017",
    "Director Bonus  2018",
    "Director Bonus  2019",
    "Cash And Equivalents 2008",
    "Cash And Equivalents 2009",
    "Cash And Equivalents 2010",
    "Cash And Equivalents 2011",
    "Cash And Equivalents 2012",
    "Cash And Equivalents 2013",
    "Cash And Equivalents 2014",
    "Cash And Equivalents 2015",
    "Cash And Equivalents 2016",
    "Cash And Equivalents 2017",
    "Cash And Equivalents 2018",
    "Cash And Equivalents 2019",
    "Total Stock Awards Amount  2008",
    "Total Stock Awards Amount  2009",
    "Total Stock Awards Amount  2010",
    "Total Stock Awards Amount  2011",
    "Total Stock Awards Amount  2012",
    "Total Stock Awards Amount  2013",
    "Total Stock Awards Amount  2014",
    "Total Stock Awards Amount  2015",
    "Total Stock Awards Amount  2016",
    "Total Stock Awards Amount  2017",
    "Total Stock Awards Amount  2018",
    "Total Stock Awards Amount  2019",
    "Director Option Awards  2008",
    "Director Option Awards  2009",
    "Director Option Awards  2010",
    "Director Option Awards  2011",
    "Director Option Awards  2012",
    "Director Option Awards  2013",
    "Director Option Awards  2014",
    "Director Option Awards  2015",
    "Director Option Awards  2016",
    "Director Option Awards  2017",
    "Director Option Awards  2018",
    "Director Option Awards  2019",
    "Option Awards  2008",
    "Option Awards  2009",
    "Option Awards  2010",
    "Option Awards  2011",
    "Option Awards  2012",
    "Option Awards  2013",
    "Option Awards  2014",
    "Option Awards  2015",
    "Option Awards  2016",
    "Option Awards  2017",
    "Option Awards  2018",
    "Option Awards  2019"
];

let financialFields = [
    "Capital Expenditure  [CY 2001] ",
    "Capital Expenditure  [CY 2002] ",
    "Capital Expenditure  [CY 2003] ",
    "Capital Expenditure  [CY 2004] ",
    "Capital Expenditure  [CY 2005] ",
    "Capital Expenditure  [CY 2006] ",
    "Capital Expenditure  [CY 2007] ",
    "Capital Expenditure  [CY 2008] ",
    "Capital Expenditure  [CY 2009] ",
    "Capital Expenditure  [CY 2010] ",
    "Capital Expenditure  [CY 2011] ",
    "Capital Expenditure  [CY 2012] ",
    "Capital Expenditure  [CY 2013] ",
    "Capital Expenditure  [CY 2014] ",
    "Capital Expenditure  [CY 2015] ",
    "Capital Expenditure  [CY 2016] ",
    "Capital Expenditure  [CY 2017] ",
    "Capital Expenditure  [CY 2018] ",
    "Capital Expenditure  [CY 2019] ",
    "Capital Expenditure  [CY 2020] ",
    "Net PP&E  [CY 2001] ",
    "Net PP&E  [CY 2002] ",
    "Net PP&E  [CY 2003] ",
    "Net PP&E  [CY 2004] ",
    "Net PP&E  [CY 2005] ",
    "Net PP&E  [CY 2006] ",
    "Net PP&E  [CY 2007] ",
    "Net PP&E  [CY 2008] ",
    "Net PP&E  [CY 2009] ",
    "Net PP&E  [CY 2010] ",
    "Net PP&E  [CY 2011] ",
    "Net PP&E  [CY 2012] ",
    "Net PP&E  [CY 2013] ",
    "Net PP&E  [CY 2014] ",
    "Net PP&E  [CY 2015] ",
    "Net PP&E  [CY 2016] ",
    "Net PP&E  [CY 2017] ",
    "Net PP&E  [CY 2018] ",
    "Net PP&E  [CY 2019] ",
    "Net PP&E  [CY 2020] ",
    "R&D Exp-  [CY 2001] ",
    "R&D Exp-  [CY 2002] ",
    "R&D Exp-  [CY 2003] ",
    "R&D Exp-  [CY 2004] ",
    "R&D Exp-  [CY 2005] ",
    "R&D Exp-  [CY 2006] ",
    "R&D Exp-  [CY 2007] ",
    "R&D Exp-  [CY 2008] ",
    "R&D Exp-  [CY 2009] ",
    "R&D Exp-  [CY 2010] ",
    "R&D Exp-  [CY 2011] ",
    "R&D Exp-  [CY 2012] ",
    "R&D Exp-  [CY 2013] ",
    "R&D Exp-  [CY 2014] ",
    "R&D Exp-  [CY 2015] ",
    "R&D Exp-  [CY 2016] ",
    "R&D Exp-  [CY 2017] ",
    "R&D Exp-  [CY 2018] ",
    "R&D Exp-  [CY 2019] ",
    "R&D Exp-  [CY 2020] ",
    "Return on Assets %  [CY 2001]",
    "Return on Assets %  [CY 2002]",
    "Return on Assets %  [CY 2003]",
    "Return on Assets %  [CY 2004]",
    "Return on Assets %  [CY 2005]",
    "Return on Assets %  [CY 2006]",
    "Return on Assets %  [CY 2007]",
    "Return on Assets %  [CY 2008]",
    "Return on Assets %  [CY 2009]",
    "Return on Assets %  [CY 2010]",
    "Return on Assets %  [CY 2011]",
    "Return on Assets %  [CY 2012]",
    "Return on Assets %  [CY 2013]",
    "Return on Assets %  [CY 2014]",
    "Return on Assets %  [CY 2015]",
    "Return on Assets %  [CY 2016]",
    "Return on Assets %  [CY 2017]",
    "Return on Assets %  [CY 2018]",
    "Return on Assets %  [CY 2019]",
    "Return on Assets %  [CY 2020]",
    "Total Debt/Capital %  [CY 2001]",
    "Total Debt/Capital %  [CY 2002]",
    "Total Debt/Capital %  [CY 2003]",
    "Total Debt/Capital %  [CY 2004]",
    "Total Debt/Capital %  [CY 2005]",
    "Total Debt/Capital %  [CY 2006]",
    "Total Debt/Capital %  [CY 2007]",
    "Total Debt/Capital %  [CY 2008]",
    "Total Debt/Capital %  [CY 2009]",
    "Total Debt/Capital %  [CY 2010]",
    "Total Debt/Capital %  [CY 2011]",
    "Total Debt/Capital %  [CY 2012]",
    "Total Debt/Capital %  [CY 2013]",
    "Total Debt/Capital %  [CY 2014]",
    "Total Debt/Capital %  [CY 2015]",
    "Total Debt/Capital %  [CY 2016]",
    "Total Debt/Capital %  [CY 2017]",
    "Total Debt/Capital %  [CY 2018]",
    "Total Debt/Capital %  [CY 2019]",
    "Total Debt/Capital %  [CY 2020]",
    "Total Debt/Equity %  [CY 2001]",
    "Total Debt/Equity %  [CY 2002]",
    "Total Debt/Equity %  [CY 2003]",
    "Total Debt/Equity %  [CY 2004]",
    "Total Debt/Equity %  [CY 2005]",
    "Total Debt/Equity %  [CY 2006]",
    "Total Debt/Equity %  [CY 2007]",
    "Total Debt/Equity %  [CY 2008]",
    "Total Debt/Equity %  [CY 2009]",
    "Total Debt/Equity %  [CY 2010]",
    "Total Debt/Equity %  [CY 2011]",
    "Total Debt/Equity %  [CY 2012]",
    "Total Debt/Equity %  [CY 2013]",
    "Total Debt/Equity %  [CY 2014]",
    "Total Debt/Equity %  [CY 2015]",
    "Total Debt/Equity %  [CY 2016]",
    "Total Debt/Equity %  [CY 2017]",
    "Total Debt/Equity %  [CY 2018]",
    "Total Debt/Equity %  [CY 2019]",
    "Total Debt/Equity %  [CY 2020]",
    "Total Employees  [CY 2001]",
    "Total Employees  [CY 2002]",
    "Total Employees  [CY 2003]",
    "Total Employees  [CY 2004]",
    "Total Employees  [CY 2005]",
    "Total Employees  [CY 2006]",
    "Total Employees  [CY 2007]",
    "Total Employees  [CY 2008]",
    "Total Employees  [CY 2009]",
    "Total Employees  [CY 2010]",
    "Total Employees  [CY 2011]",
    "Total Employees  [CY 2012]",
    "Total Employees  [CY 2013]",
    "Total Employees  [CY 2014]",
    "Total Employees  [CY 2015]",
    "Total Employees  [CY 2016]",
    "Total Employees  [CY 2017]",
    "Total Employees  [CY 2018]",
    "Total Employees  [CY 2019]",
    "Total Employees  [CY 2020]",
    "Total Revenue  [CY 2001] ",
    "Total Revenue  [CY 2002] ",
    "Total Revenue  [CY 2003] ",
    "Total Revenue  [CY 2004] ",
    "Total Revenue  [CY 2005] ",
    "Total Revenue  [CY 2006] ",
    "Total Revenue  [CY 2007] ",
    "Total Revenue  [CY 2008] ",
    "Total Revenue  [CY 2009] ",
    "Total Revenue  [CY 2010] ",
    "Total Revenue  [CY 2011] ",
    "Total Revenue  [CY 2012] ",
    "Total Revenue  [CY 2013] ",
    "Total Revenue  [CY 2014] ",
    "Total Revenue  [CY 2015] ",
    "Total Revenue  [CY 2016] ",
    "Total Revenue  [CY 2017] ",
    "Total Revenue  [CY 2018] ",
    "Total Revenue  [CY 2019] ",
    "Total Revenue  [CY 2020] ",
    "Total Revenues, 1 Yr Growth %  [CY 2001] ",
    "Total Revenues, 1 Yr Growth %  [CY 2002] ",
    "Total Revenues, 1 Yr Growth %  [CY 2003] ",
    "Total Revenues, 1 Yr Growth %  [CY 2004] ",
    "Total Revenues, 1 Yr Growth %  [CY 2005] ",
    "Total Revenues, 1 Yr Growth %  [CY 2006] ",
    "Total Revenues, 1 Yr Growth %  [CY 2007] ",
    "Total Revenues, 1 Yr Growth %  [CY 2008] ",
    "Total Revenues, 1 Yr Growth %  [CY 2009] ",
    "Total Revenues, 1 Yr Growth %  [CY 2010] ",
    "Total Revenues, 1 Yr Growth %  [CY 2011] ",
    "Total Revenues, 1 Yr Growth %  [CY 2012] ",
    "Total Revenues, 1 Yr Growth %  [CY 2013] ",
    "Total Revenues, 1 Yr Growth %  [CY 2014] ",
    "Total Revenues, 1 Yr Growth %  [CY 2015] ",
    "Total Revenues, 1 Yr Growth %  [CY 2016] ",
    "Total Revenues, 1 Yr Growth %  [CY 2017] ",
    "Total Revenues, 1 Yr Growth %  [CY 2018] ",
    "Total Revenues, 1 Yr Growth %  [CY 2019] ",
    "Total Revenues, 1 Yr Growth %  [CY 2020] "
];
// endregion

// region POST - Transpose File
profTomlinRouter.post('/transposeFile', (request, response) =>
{
    let useSample = request.query['useSample'] === 'true';

    let dataFile = useSample ? require('../../data/ProfTomlin/FullData_Final_Sample.json') : require('../../data/ProfTomlin/FullData_Final.json'),
        transposeData = [];

    let uniqueCompensation = [
            "Total Annual Cash Compensation",
            "Salary",
            "Non-Equity Annual Incentive Plan",
            "Total Options Amount",
            "Bonus",
            "Director Bonus",
            "Cash And Equivalents",
            "Total Stock Awards Amount",
            "Director Option Awards",
            "Option Awards"
        ],
        uniqueFinancial = [
            "Capital Expenditure",
            "Net PP&E",
            "R&D Exp-",
            "Return on Assets %",
            "Total Debt/Capital %",
            "Total Debt/Equity %",
            "Total Employees",
            "Total Revenue",
            "Total Revenues, 1 Yr Growth %"
        ];

    dataFile.forEach((item) =>
    {
        // For every year from 2008 to 2019, add a new row with the same company info
        for (let i = 2008; i <= 2019; ++i)
        {
            let newRow = {
                "Company No": Number(item["No."]),
                "Company Name": item["Company Name"],
                "Primary Industry": item["Primary Industry"],
                "Year Founded": item["Year Founded"],
                "Number of Employees - Global (Latest)": item["Number of Employees - Global (Latest)"],
                "Person Name": item["Person Name"],
                "Person Age": item["Person Age"],
                "Professional Job Functions": item["Professional Job Functions"],
                "Professional Titles": item["Professional Titles"],
                "Year": i
            };

            let fullKeyList = Object.keys(item);
            // Start searching for the compensation piece of data
            uniqueCompensation.forEach((compensationKey) =>
            {
                // Find the near match key in item for this compensation key
                let nearMatchKey = fullKeyList.find((key) => key.includes(compensationKey) && key.includes(i.toString()));

                // Add to the newRow
                newRow[compensationKey] = item[nearMatchKey];
            });

            // Start searching for the financial piece of data
            uniqueFinancial.forEach((financialKey) =>
            {
                // Find the near match key in item for this compensation key
                let nearMatchKey = fullKeyList.find((key) => key.includes(financialKey) && key.includes(i.toString()));

                // Add to the newRow
                newRow[financialKey] = item[nearMatchKey];
            });

            transposeData.push(newRow);
        }
    });

    writeFile(`./profTomlin_TransposedFile_${useSample ? 'Sample' : 'Full'}.json`, JSON.stringify(transposeData, null, 4))
        .then(() => Success(response, 'Write file successfully'))
        .catch((writeError) => Abort(response, 'Write Error', 500, writeError.message));
});
// endregion

// region POST - Convert Transposed File to Excel
profTomlinRouter.post('/transposeToExcel', (request, response) =>
{
    let useSample = request.query['useSample'] === 'true',
        transposedFile = useSample ? require('../../profTomlin_TransposedFile_Sample.json') : require('../../profTomlin_TransposedFile_Full.json');

    const xls = json2xls(transposedFile);

    writeFile(`profTomlin_TransposedFile_${useSample ? 'Sample' : 'Full'}.xlsx`, xls, 'binary')
        .then(() => Success(response, 'Converted to Excel successfully'))
        .catch((writeError) => Abort(response, 'Write Error', 500, writeError.message));
});
// endregion

// region GET - List Unique Compensations
profTomlinRouter.get('/uniqueList', (request, response) =>
{
    let uniqueCompensation = [],
        uniqueFinancial = [];

    compensationFields.forEach((key) =>
    {
        let refinedKey = key.substring(0, key.length - 4).trim();
        if (!uniqueCompensation.includes(refinedKey)) uniqueCompensation.push(refinedKey);
    });

    financialFields.forEach((key) =>
    {
        let refinedKey = key.substring(0, key.length - 10).trim();
        if (!uniqueFinancial.includes(refinedKey)) uniqueFinancial.push(refinedKey);
    });

    Success(response, 'Successfully get unique Compensation list', { uniqueCompensation, uniqueFinancial });
});
// endregion

// region POST - Remove No Compensation
profTomlinRouter.post('/removeNoCompensation', (request, response) =>
{
    let personList = JSON.parse(JSON.stringify(dataFile || {}))['Full Data - Horizontal'],
        personListLength = personList.length,
        newList = [];

    // Check all persons
    personList.forEach((person) =>
    {
        let isValid = false;
        checkFields.forEach((field) =>
        {
            if (person[field]?.toString().trim() !== "-")
            {
                isValid = true;
            }
        });
        if (isValid) newList.push(person);
    });

    // Write to new file
    let fileName = `profTomlin_dataFile_updated.json`;
    writeFile(`./${fileName}`, JSON.stringify(newList, null, 4))
        .then(() => Success(response, 'Successfully write to file ' + fileName, { pldLength: personListLength, newLength: newList.length }))
        .catch((err) => Abort(response, 'Failed to write to file', 500, err.message));
});
// endregion
// endregion

// region --- TARIFF PROJECT ---

// region POST - Combine small files into Master JSON
profTomlinRouter.post('/tariff/combineSmallTariffs', (request, response) =>
{
    let tariff1 = require('../../data/ProfTomlin/tariff_project/tariff_1.json'),
        tariff2 = require('../../data/ProfTomlin/tariff_project/tariff_2.json'),
        tariff3 = require('../../data/ProfTomlin/tariff_project/tariff_3.json'),
        tariff4 = require('../../data/ProfTomlin/tariff_project/tariff_4.json');

    let tariffMaster = tariff3['Sheet1'].concat(tariff4['Sheet1']);

    writeFile(`tariff_master_2.json`, JSON.stringify(tariffMaster, null, 4))
        .then(() => Success(response, 'Successfully combined all tariff files'))
        .catch((writeError) => Abort(response, 'Write Error', 500, writeError.message));
});
// endregion

// region GET - Get NAICS and SIC Code for one HTS8
profTomlinRouter.post('/tariff/getCodeSingle', (request, response) =>
{
    let c = require('../../data/ProfTomlin/tariff_project/commodity_wizard.json'),
        commodityData = c['Import Concordance'],
        code = '01011000',
        naicsList = [], sicList = [];

    // Get the all items in Commodity that has this HTS8 code
    let singleCodeData = commodityData.filter((item) => item['hts8'] === code);

    // Get all SIC and NAICS for this single code data
    singleCodeData.forEach((item) =>
    {
        if (item['sic'] && !sicList.includes(item['sic'])) sicList.push(item['sic']);
        if (item['naics'] && !naicsList.includes(item['naics'])) naicsList.push(item['naics']);
    });

    console.log(naicsList);
    console.log(sicList);

    // Parse into data
    let newCodeData = Object.assign({}, singleCodeData);
    naicsList.forEach((naicsCode, index) => newCodeData['naics' + (index + 1).toString()] = naicsCode);
    sicList.forEach((sicCode, index) => newCodeData['sic' + (index + 1).toString()] = sicCode);

    // Response
    Success(response, 'Successfully get data for single code', newCodeData);
});
// endregion

// region POST - Get NAICS and SIC from Commodity Wizard
profTomlinRouter.post('/tariff/getCodes', (request, response) =>
{
    let c = require('../../data/ProfTomlin/tariff_project/commodity_wizard.json'),
        tariffFile = require('../../data/ProfTomlin/tariff_project/tariff_5.json');
    // region Column Names
    // Tariff File Column Names (to fill in the blank)
    let columnNames = [
        "hts8",
        "year",
        "brief_description",
        "quantity_1_code",
        "quantity_2_code",
        "wto_binding_code",
        "mfn_text_rate",
        "mfn_rate_type_code",
        "mfn_ave",
        "mfn_ad_val_rate",
        "mfn_specific_rate",
        "mfn_other_rate",
        "col1_special_text",
        "col1_special_mod",
        "gsp_indicator",
        "gsp_ctry_excluded",
        "apta_indicator",
        "civil_air_indicator",
        "nafta_canada_ind",
        "nafta_mexico_ind",
        "mexico_rate_type_code",
        "mexico_ad_val_rate",
        "mexico_specific_rate",
        "cbi_indicator",
        "cbi_ad_val_rate",
        "cbi_specific_rate",
        "agoa_indicator",
        "cbtpa_indicator",
        "cbtpa_rate_type_code",
        "cbtpa_ad_val_rate",
        "cbtpa_specific_rate",
        "israel_fta_indicator",
        "atpa_indicator",
        "atpa_ad_val_rate",
        "atpa_specific_rate",
        "atpdea_indicator",
        "jordan_indicator",
        "jordan_rate_type_code",
        "jordan_ad_val_rate",
        "jordan_specific_rate",
        "jordan_other_rate",
        "singapore_indicator",
        "singapore_rate_type_code",
        "singapore_ad_val_rate",
        "singapore_specific_rate",
        "singapore_other_rate",
        "chile_indicator",
        "chile_rate_type_code",
        "chile_ad_val_rate",
        "chile_specific_rate",
        "chile_other_rate",
        "morocco_indicator",
        "morocco_rate_type_code",
        "morocco_ad_val_rate",
        "morocco_specific_rate",
        "morocco_other_rate",
        "australia_indicator",
        "australia_rate_type_code",
        "australia_ad_val_rate",
        "australia_specific_rate",
        "australia_other_rate",
        "bahrain_indicator",
        "bahrain_rate_type_code",
        "bahrain_ad_val_rate",
        "bahrain_specific_rate",
        "bahrain_other_rate",
        "dr_cafta_indicator",
        "dr_cafta_rate_type_code",
        "dr_cafta_ad_val_rate",
        "dr_cafta_specific_rate",
        "dr_cafta_other_rate",
        "dr_cafta_plus_indicator",
        "dr_cafta_plus_rate_type_code",
        "dr_cafta_plus_ad_val_rate",
        "dr_cafta_plus_specific_rate",
        "dr_cafta_plus_other_rate",
        "oman_indicator",
        "oman_rate_type_code",
        "oman_ad_val_rate",
        "oman_specific_rate",
        "oman_other_rate",
        "peru_indicator",
        "peru_rate_type_code",
        "peru_ad_val_rate",
        "peru_specific_rate",
        "peru_other_rate",
        "pharmaceutical_ind",
        "dyes_indicator",
        "col2_text_rate",
        "col2_rate_type_code",
        "col2_ad_val_rate",
        "col2_specific_rate",
        "col2_other_rate",
        "begin_effect_date",
        "end_effective_date",
        "footnote_comment",
        "additional_duty",
        "korea_indicator",
        "korea_rate_type_code",
        "korea_ad_val_rate",
        "korea_specific_rate",
        "korea_other_rate",
        "columbia_indicator",
        "columbia_rate_type_code",
        "columbia_ad_val_rate",
        "columbia_specific_rate",
        "columbia_other_rate",
        "panama_indicator",
        "panama_rate_type_code",
        "panama_ad_val_rate",
        "panama_specific_rate",
        "panama_other_rate",
        "nepal_indicator",
        "japan_indicator",
        "japan_rate_type_code",
        "japan_ad_val_rate",
        "japan_specific_rate",
        "japan_other_rate",
        "usmca_indicator",
        "usmca_rate_type_code",
        "usmca_ad_val_rate",
        "usmca_specific_rate",
        "usmca_other_rate"
    ];
    // endregion

    // Get code into the master Tariff file
    let newTariffMaster1 = tariffFile['Sheet1'].map((item) =>
    {
        let tariffHTS8 = item['hts8'].length === 8 ? item['hts8'] : item['hts8'].padStart(8, '0');

        // Find NAICS and HTS based on the year
        let hts8ItemFound = c['Import Concordance'].find((cItem) =>
        {
            let commodityHTS8 = cItem['hts8'].length === 8 ? cItem['hts8'] : cItem['hts8'].padStart(8, '0');
            return((cItem['year'] === item['year']) && (commodityHTS8 === tariffHTS8));
        }) || { naics: '', sic: '' };

        // Generate new item
        let newItemData = Object.assign({}, item, { naics: hts8ItemFound['naics'], sic: hts8ItemFound['sic'] });

        // Add missing columns in
        columnNames.forEach((columnName) => !newItemData.hasOwnProperty(columnName) && (newItemData[columnName] = ""));

        // Return the item
        return(newItemData);
    });

    const xls = json2xls(newTariffMaster1);

    writeFile(`profTomlin_tariffMaster5.xlsx`, xls, 'binary')
        .then(() => Success(response, 'Converted to Excel successfully'))
        .catch((writeError) => Abort(response, 'Write Error', 500, writeError.message));
});
// endregion

// region GET - NAICS/SIC based on HTS8

// region - Extract HTS8 codes
profTomlinRouter.get('/tariff/codes', (request, response) => {
    let codeFilePath = "D:\\Drive\\Classes\\Oakland\\GA\\Prof Tomlin\\Tariff Project\\Processed Files\\NAICS_Codes_Only.xlsx";

    const workbook = new ExcelJS.Workbook();
    workbook.xlsx.readFile(codeFilePath)
        .then((workbookContent) => {
            const worksheet = workbookContent.worksheets[0];

            let hts8Map = {},
                sicMap = {};

            // Go thru all HTS8 code
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1)
                {
                    // 1 - HTS8; 2 - NAICS; 3 - SIC; 4 - Year
                    let rowValues = row.values,
                        hts8 = rowValues[1]?.toString().trim(),
                        naics = rowValues[2]?.toString().trim(),
                        sic = rowValues[3]?.toString().trim();

                    if (naics)
                    {
                        // Update NAICS List
                        if (hts8Map.hasOwnProperty(naics))
                        {
                            if (hts8) hts8Map[naics] = hts8;
                        }
                        else hts8Map[naics] = hts8 || "";

                        // Update NAICS List
                        if (sicMap.hasOwnProperty(naics))
                        {
                            if (sic?.trim()) sicMap[naics] = sic;
                        }
                        else sicMap[naics] = sic || "";
                    }
                }
            });

            // Write to file
            writeFile(`./tempData/profTomlin_hts8Codes.json`, JSON.stringify({ sicMap, hts8Map }, null, 4))
                .then(() => Success(response, 'Successfully fetched HTS8/NAICS/SIC codes'))
                .catch((writeError) => Abort(response, 'Write Error', 500, writeError.message));
        })
        .catch((error) => Abort(response, 'Failed to read file', 500, error.message));
});
// endregion

profTomlinRouter.post('/tariff/fillCodes', (request, response) => {
    let codeFile = require('../../tempData/profTomlin_hts8Codes.json'),
        codeFilePath = "D:\\Drive\\Classes\\Oakland\\GA\\Prof Tomlin\\Tariff Project\\Processed Files\\NAICS_Codes_Only.xlsx";

    const workbook = new ExcelJS.Workbook();
    workbook.xlsx.readFile(codeFilePath)
        .then((workbookContent) => {
            const worksheet = workbookContent.worksheets[0];

            // Go thru all HTS8 code
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1)
                {
                    let currentHTS8 = row.values[1]?.toString().trim,
                        currentNAICS = row.values[2]?.toString().trim(),
                        currentSIC = row.values[3]?.toString().trim(),
                        currentYear = row.values[3]?.toString().trim();

                    let newNAICS = currentNAICS || Object.keys(codeFile['hts8Map']).find((naicsKey) => codeFile['hts8Map'][naicsKey] === currentHTS8) || "",
                        newSIC = currentSIC || codeFile['sicMap'][newNAICS] || "";

                    // If NAICS is still not found for currentHTS8
                    // check the next line in Excel file
                    // condition: Year <= 2000
                    if (!newNAICS)
                    {
                        let nextRow = worksheet.getRow(rowNumber + 1);

                        let nextHTS8 = nextRow.values[1]?.toString().trim,
                            nextNAICS = nextRow.values[2]?.toString().trim(),
                            nextYear = nextRow.values[3]?.toString().trim();

                        if (nextHTS8 === currentHTS8 && (currentYear !== nextYear) && (Number(nextYear) <= 2000))
                        {
                            newNAICS = nextNAICS;
                            newSIC = codeFile['sicMap'][newNAICS] || "";
                        }
                    }

                    // if still not there, check the previous line
                    if (!newNAICS && ((rowNumber - 2) >= 0))
                    {
                        let previousRow = worksheet.getRow(rowNumber - 1);

                        let previousHTS8 = previousRow.values[1]?.toString().trim,
                            previousNAICS = previousRow.values[2]?.toString().trim(),
                            previousYear = previousRow.values[3]?.toString().trim();

                        if (previousHTS8 === currentHTS8 && (currentYear !== previousYear) && (Number(previousYear) >= 2020))
                        {
                            newNAICS = previousNAICS;
                            newSIC = codeFile['sicMap'][newNAICS] || "";
                        }
                    }

                    // If the row's NAICS is empty
                    worksheet.getCell(rowNumber, 2).value = newNAICS;

                    // If the row's SIC is empty
                    worksheet.getCell(rowNumber, 3).value = newSIC;

                    // Commit a completed row to stream
                    row.commit();
                }
            });

            workbook.xlsx.writeFile(codeFilePath)
                .then(() => Success(response, 'Successfully write file'))
                .catch((writeError) => Abort(response, 'Failed to write file', 500, writeError.message));
        })
        .catch((error) => Abort(response, 'Failed to read file', 500, error.message));
});
// endregion

// endregion

// region --- COMPENSATION LOBBY ---

// region POST - Lobby data into Master file
profTomlinRouter.post('/lobbyDataIntoMaster', (request, response) =>
{
    let lobbyData = require('../../data/ProfTomlin/compensation_lobby_data.json'),
        masterCompensationFile = require('../../data/ProfTomlin/compensation_master.json');

    let newData = [],
        cacheList = {};

    masterCompensationFile.forEach((masterItem) =>
    {
        const companyID = Number(masterItem["No"]);

        // Check the cache first
        if (cacheList.hasOwnProperty(companyID))
        {
            // Get the lobby amount of the current masterItem's "Year"
            newData.push({ "LobbyAmount": cacheList[companyID] ? Number(cacheList[companyID][masterItem["Year"].toString()]) : 0 });
        }
        else
        {
            // Get the lobby data item for this company
            let foundLobbyIndex = lobbyData.findIndex((lobbyItem) => masterItem["Company Name"].toLowerCase().includes(lobbyItem["Name"].toLowerCase()));
            if (foundLobbyIndex > -1)
            {
                cacheList[companyID] = lobbyData[foundLobbyIndex];

                // Put LobbyAmount for the first master company item
                newData.push({ "LobbyAmount": Number(cacheList[companyID][masterItem["Year"].toString()]) });

                // Remove this lobby data from the original array to reduce search time on following execution
                lobbyData.splice(foundLobbyIndex, 1);
            }
            else
            {
                cacheList[companyID] = null;
                newData.push({ "LobbyAmount": 0 });
            }
        }
    });

    // Convert into Excel
    const xls = json2xls(newData);
    writeFile(`compensation_master_with_lobby.xlsx`, xls, 'binary')
        .then(() => Success(response, 'Successfully fetch lobby data for master file'))
        .catch((writeError) => Abort(response, 'Write Error', 500, writeError.message));
});
// endregion

// endregion

// region --- NAICS UNEMPLOYMENT RATE ---

// region GET - Calculate average unemployment rates of all states
profTomlinRouter.get('/stateUnemploymentRates', (request, response) =>
{
    let directoryPath = "D:\\Drive\\Classes\\Oakland\\GA\\Prof Tomlin\\NAICS Unemployment Rate\\State Data";

    fs.readdir(directoryPath, (err, files) =>
    {
        if (err)
        {
            console.log('Unable to scan directory: ' + err);
            return;
        }

        // Generate promises that read thru all files
        let filePromises = files.map((fileName) => new Promise((resolve) =>
        {
            const workbook = new ExcelJS.Workbook();

            let returnObj = {},
                stateName = fileName.replace('.xlsx', '');

            workbook.xlsx.readFile(directoryPath + "\\" + fileName)
                .then((workbookContent) =>
                {
                    // Select active worksheet
                    const worksheet = workbookContent.worksheets[0];

                    // Object to store row values by year
                    let yearValues = {};

                    // Iterate over all rows that have values in a worksheet
                    worksheet.eachRow((row, rowNumber) =>
                    {
                        let year = row.values[1]?.toString(),
                            yearValueByMonth = Number(row.values[2] || 0);

                        if (year !== 'Year')
                        {
                            if (yearValues.hasOwnProperty(year))
                            {
                                yearValues[year] = Number(((yearValues[year] + yearValueByMonth) / 2).toFixed(1));
                            }
                            else yearValues[year] = yearValueByMonth;
                        }
                    });

                    // Return the list of each year's rate
                    returnObj[stateName] = yearValues;
                    resolve(returnObj);
                })
                .catch((error) =>
                {
                    returnObj[stateName] = error.message;
                    resolve(error.message);
                });
        }));

        // Execute promise
        Promise.all(filePromises)
            .then((promiseResult) =>
            {
                let finalResult = promiseResult[0];
                promiseResult.forEach((result) => finalResult = Object.assign({}, finalResult, result));

                // Save to JSON
                writeFile(`./tempData/profTomlin_stateUnemploymentRates.json`, JSON.stringify(finalResult, null, 4))
                    .then(() => Success(response, 'Successfully calculated unemployment rate of all states', finalResult))
                    .catch((writeError) => Abort(response, 'Write Error', 500, writeError.message));
            })
            .catch((promiseErr) => Abort(response, 'Failed to get state unemployment rate', 500, promiseErr.message));
    });
});
// endregion

// region POST - Add unemployment data to NAICS Master File
profTomlinRouter.post('/writeUnemploymentData', (request, response) =>
{
    const masterFile = require("D:\\Drive\\Classes\\Oakland\\GA\\Prof Tomlin\\NAICS Unemployment Rate\\profTomlin_naicsBigFileMater_Simplified3.json")["Virginia - Wyoming"];
    const unemploymentData = require('../../tempData/profTomlin_stateUnemploymentRates.json');

    console.log(masterFile[0]);

    let newMasterFile = [];

    masterFile.forEach((item) =>
    {
        let stateData = unemploymentData[item["State"]];
        newMasterFile.push(Object.assign({}, item, { "Unemployment Rate": stateData ? stateData[item["Year"]] : 0 }));
        if (!stateData) console.log('State not exists', item["State"]);
    });

    // Convert into Excel
    const xls = json2xls(newMasterFile);
    writeFile(`./tempData/profTomlin_naicsMasterFile_Updated3.xlsx`, xls, 'binary')
        .then(() => Success(response, 'Successfully fetch lobby data for master file'))
        .catch((writeError) => Abort(response, 'Write Error', 500, writeError.message));
});
// endregion

// endregion

// region --- NAICS CRIME RATE & PERSONAL INCOME ---

// region GET - State Crime Rate
profTomlinRouter.get('/stateCrimeData', (request, response) =>
{
    let directoryPath = "D:\\Drive\\Classes\\Oakland\\GA\\Prof Tomlin\\NAICS Unemployment Rate\\Crime Data";

    fs.readdir(directoryPath, (err, files) =>
    {
        if (err)
        {
            console.log('Unable to scan directory: ' + err);
            return;
        }

        // Generate promises that read thru all files
        let filePromises = files.map((fileName) => new Promise((resolve) =>
        {
            const workbook = new ExcelJS.Workbook();

            let returnObj = {},
                stateName = fileName.replace('.csv', '');

            workbook.csv.readFile(directoryPath + "\\" + fileName)
                .then((worksheet) =>
                {
                    // Object to store row values by year
                    let yearValues = {},
                        rowData = worksheet.getRow(2).values; // Year 2000 starts from cell index 2

                    // The data is in row #3 (index 2)
                    for (let i = 2000; i <= 2020; ++i)
                    {
                        yearValues[i] = rowData[i - 1998];
                    }

                    // Return the list of each year's rate
                    returnObj[stateName] = yearValues;
                    resolve(returnObj);
                })
                .catch((error) =>
                {
                    returnObj[stateName] = error.message;
                    resolve(error.message);
                });
        }));

        // Execute promise
        Promise.all(filePromises)
            .then((promiseResult) =>
            {
                let finalResult = promiseResult[0];
                promiseResult.forEach((result) => finalResult = Object.assign({}, finalResult, result));

                // Save to JSON
                writeFile(`./tempData/profTomlin_stateCrimeData.json`, JSON.stringify(finalResult, null, 4))
                    .then(() => Success(response, 'Successfully calculated crime data of all states', finalResult))
                    .catch((writeError) => Abort(response, 'Write Error', 500, writeError.message));
            })
            .catch((promiseErr) => Abort(response, 'Failed to get state unemployment rate', 500, promiseErr.message));
    });
});
// endregion

// region GET - State Capital Income
profTomlinRouter.get('/stateCapitalIncome', (request, response) =>
{
    let filePath = "D:\\Drive\\Classes\\Oakland\\GA\\Prof Tomlin\\NAICS Unemployment Rate\\Per-Capita-Income.xlsx";

    const workbook = new ExcelJS.Workbook();

    workbook.xlsx.readFile(filePath)
        .then((workbookContent) =>
        {
            const worksheet = workbookContent.worksheets[0];

            // Object to store row values by year
            let stateData = {};

            // Go thru all states
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1)
                {
                    let rowValues = row.values,
                        yearValues = {};

                    // The data is in row #3 (index 2)
                    for (let i = 2000; i <= 2020; ++i)
                    {
                        yearValues[i] = rowValues[i - 1998];
                    }

                    // Append to the state
                    stateData[rowValues[1]] = yearValues;
                }
            });

            // Write to file
            writeFile(`./tempData/profTomlin_stateCapitalIncome.json`, JSON.stringify(stateData, null, 4))
                .then(() => Success(response, 'Successfully calculated capital income of all states', stateData))
                .catch((writeError) => Abort(response, 'Write Error', 500, writeError.message));
        })
        .catch((error) => Abort(response, 'Failed to read file', 500, error.message));
});
// endregion

// region POST - Add Crime Data & Capital Income to the Big File
profTomlinRouter.post('/writeCrimeData', (request, response) =>
{
    const masterFile = require("D:\\Drive\\Classes\\Oakland\\GA\\Prof Tomlin\\NAICS Unemployment Rate\\profTomlin_naicsBigFile_Simplified1.json")["Alabama - Minnesota"];
    const crimeData = require('../../tempData/profTomlin_stateCrimeData.json');
    const incomeData = require('../../tempData/profTomlin_stateCapitalIncome.json');

    let newMasterFile = [];

    masterFile.forEach((item) =>
    {
        let stateName = item["State"];

        if (stateName === "Deleware") stateName = "Delaware";

        let stateCrimeData = crimeData[stateName],
            stateIncomeData = incomeData[stateName];

        newMasterFile.push(Object.assign({}, item, {
            "State": stateName,
            "Crime": stateCrimeData ? stateCrimeData[item["Year"]] : 0,
            "CapitalIncome": stateIncomeData ? stateIncomeData[item["Year"]] : 0
        }));

        if (!stateCrimeData) console.log('[Crime] State not exists', stateName);
        if (!stateIncomeData) console.log('[Income] State not exists', stateName);
    });

    // Convert into Excel
    const xls = json2xls(newMasterFile);
    writeFile(`./tempData/profTomlin_naicsMasterFile_CrimeAndIncome1.xlsx`, xls, 'binary')
        .then(() => Success(response, 'Successfully fetch Crime and Income data for master file'))
        .catch((writeError) => Abort(response, 'Write Error', 500, writeError.message));
});
// endregion

// endregion

// region --- NAICS TAXES, EDUCATION, HIGHWAYS, GDP DEFLATOR & UNION DENSITY ---

// region GET - State Union Density
profTomlinRouter.get('/stateUnionDensity', (request, response) =>
{
    let filePath = "D:\\Drive\\Classes\\Oakland\\GA\\Prof Tomlin\\NAICS Unemployment Rate\\UnionDensity.xlsx";

    const workbook = new ExcelJS.Workbook();

    workbook.xlsx.readFile(filePath)
        .then((workbookContent) =>
        {
            const worksheet = workbookContent.worksheets[0];

            // Object to store row values by year
            let stateData = {};

            // Go thru all states
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1)
                {
                    let rowValues = row.values,
                        yearValues = {};

                    // The data is in row #2 (index 1)
                    for (let i = 2020; i >= 2000; --i)
                    {
                        yearValues[i] = Number(rowValues[2022 - i].toFixed(1));
                    }

                    // Append to the state (first rowValues cell is null)
                    stateData[rowValues[1]] = yearValues;
                }
            });

            // Write to file
            writeFile(`./tempData/profTomlin_stateUnionDensity.json`, JSON.stringify(stateData, null, 4))
                .then(() => Success(response, 'Successfully calculated Union Density of all states', stateData))
                .catch((writeError) => Abort(response, 'Write Error', 500, writeError.message));
        })
        .catch((error) => Abort(response, 'Failed to read file', 500, error.message));
});
// endregion

// region GET - GDP Deflator by Year
profTomlinRouter.get('/stateGDPDeflator', (request, response) =>
{
    let filePath = "D:\\Drive\\Classes\\Oakland\\GA\\Prof Tomlin\\NAICS Unemployment Rate\\GDPDeflator.xlsx";

    const workbook = new ExcelJS.Workbook();

    workbook.xlsx.readFile(filePath)
        .then((workbookContent) =>
        {
            const worksheet = workbookContent.worksheets[0];

            let yearValues = {};

            // Go thru all states
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1)
                {
                    let rowValues = row.values,
                        year = rowValues[1]?.toString();

                    if (!yearValues[year])
                    {
                        let totalGDP = 0;
                        for (let i = 1; i <= 4; ++i)
                        {
                            totalGDP += worksheet.getRow((rowNumber - 1) + i).values[2];
                        }

                        yearValues[year] = Number((totalGDP / 4).toFixed(3));
                    }
                }
            });

            // Write to file
            writeFile(`./tempData/profTomlin_stateGDPDeflator.json`, JSON.stringify(yearValues, null, 4))
                .then(() => Success(response, 'Successfully calculated GDP Deflator of all years', yearValues))
                .catch((writeError) => Abort(response, 'Write Error', 500, writeError.message));
        })
        .catch((error) => Abort(response, 'Failed to read file', 500, error.message));
});
// endregion

// region GET - Get Taxes, Education & Highways Data
function capitalizeFirstLetter(string)
{
    return(string.charAt(0).toUpperCase() + string.toLowerCase().slice(1));
}

profTomlinRouter.get('/stateTaxes', (request, response) =>
{
    let directoryPath = "D:\\Drive\\Classes\\Oakland\\GA\\Prof Tomlin\\NAICS Unemployment Rate\\Tax Education Highway Data";

    fs.readdir(directoryPath, (err, files) =>
    {
        if (err)
        {
            console.log('Unable to scan directory: ' + err);
            return;
        }

        // Generate promises that read thru all files
        let filePromises = files.map((fileName) => new Promise((resolve) =>
        {
            const workbook = new ExcelJS.Workbook();

            let returnObj = {},
                yearName = fileName.replace('.xlsx', '');

            workbook.xlsx.readFile(directoryPath + "\\" + fileName)
                .then((workbookContent) =>
                {
                    // Select active worksheet
                    const worksheet = workbookContent.worksheets[0];

                    // Object to store row values by state
                    let stateValues = {};

                    // Iterate over all cells
                    // Row #1 = HEADERS
                    // Row #2 = Taxes
                    // Row #3 = Education
                    // Row #4 = Highways

                    let headerRow = worksheet.getRow(1);

                    // Get all states
                    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
                        let cellValue = cell.value;
                        if (colNumber > 1)
                        {
                            let stateName = capitalizeFirstLetter(cellValue.trim());
                            stateValues[stateName] = {
                                taxes: worksheet.getCell(2, colNumber).value,
                                education: worksheet.getCell(3, colNumber).value,
                                highways: worksheet.getCell(4, colNumber).value
                            };
                        }
                    });

                    // Return the list of each year's rate
                    returnObj[yearName] = stateValues;
                    resolve(returnObj);
                })
                .catch((error) =>
                {
                    returnObj[yearName] = error.message;
                    resolve(error.message);
                });
        }));

        // Execute promise
        Promise.all(filePromises)
            .then((promiseResult) =>
            {
                let finalResult = promiseResult[0];
                promiseResult.forEach((result) => finalResult = Object.assign({}, finalResult, result));

                // Save to JSON
                writeFile(`./tempData/profTomlin_stateTaxesData.json`, JSON.stringify(finalResult, null, 4))
                    .then(() => Success(response, 'Successfully calculated taxes data of all states', finalResult))
                    .catch((writeError) => Abort(response, 'Write Error', 500, writeError.message));
            })
            .catch((promiseErr) => Abort(response, 'Failed to get state taxes', 500, promiseErr.message));
    });
});
// endregion

// region POST - Add Data to Big File
profTomlinRouter.post('/writeTaxData', (request, response) =>
{
    const masterFile = require("D:\\Drive\\Classes\\Oakland\\GA\\Prof Tomlin\\NAICS Unemployment Rate\\profTomlin_naicsBigFile_Simplified3.json")["Virginia - Wyoming"];
    const unionData = require('../../tempData/profTomlin_stateUnionDensity.json');
    const gdpData = require('../../tempData/profTomlin_stateGDPDeflator.json');
    const taxData = require('../../tempData/profTomlin_stateTaxesData.json');

    let newMasterFile = [];

    masterFile.forEach((item) =>
    {
        let stateName = item["State"],
            year = item["Year"];

        if (stateName === "Deleware") stateName = "Delaware";

        let stateUnionData = unionData[stateName],
            stateGDPData = gdpData[year], // GDP only based on year, not state-specific
            stateTaxData = taxData[year][stateName];

        if (!stateUnionData) console.log('[Union] State not exists', stateName);
        if (!stateGDPData) console.log('[GDP] State not exists', stateName);
        if (!stateTaxData) console.log('[Tax] State not exists', stateName);

        newMasterFile.push(Object.assign({}, item, {
            "State": stateName,
            "Taxes": stateTaxData?.["taxes"] || 0,
            "Education": stateTaxData?.["education"] || 0,
            "Highways": stateTaxData?.["highways"] || 0,
            "GDPDeflator": stateGDPData || 0,
            "Union": stateUnionData ? stateUnionData[year] : 0
        }));
    });

    // Convert into Excel
    const xls = json2xls(newMasterFile);
    writeFile(`./tempData/profTomlin_naicsMasterFile_TaxData3.xlsx`, xls, 'binary')
        .then(() => Success(response, 'Successfully fetch Tax data for master file'))
        .catch((writeError) => Abort(response, 'Write Error', 500, writeError.message));
});
// endregion

// region GET - Air/Transit/Water Data
profTomlinRouter.get('/airTransitWaterData', (request, response) =>
{
    let filePath = "D:\\Drive\\Classes\\Oakland\\GA\\Prof Tomlin\\NAICS Unemployment Rate\\FDI-Air-Highway-Transit-data.xlsx";

    const workbook = new ExcelJS.Workbook();

    workbook.xlsx.readFile(filePath)
        .then((workbookContent) =>
        {
            const worksheet = workbookContent.worksheets[0];

            // Object to store row values by year
            let stateData = {};

            // Go thru all states
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1)
                {
                    let rowValues = row.values;

                    // Row: 1 - State; 2 - Mode; 3 - Year; 4 - Amount
                    // Append to the state (first rowValues cell is null)
                    // Only take the data when Mode is "Air"/"Transit"/Water
                    let mode = rowValues[2]?.toString().trim(),
                        modeList = ['Air', 'Transit', 'Water'];

                    if (modeList.includes(mode))
                    {
                        if (!stateData[rowValues[1]]) stateData[rowValues[1]] = {};
                        if (!stateData[rowValues[1]][rowValues[2]]) stateData[rowValues[1]][rowValues[2]] = {};
                        stateData[rowValues[1]][mode][rowValues[3]] = rowValues[4];
                    }
                }
            });

            // Write to file
            writeFile(`./tempData/profTomlin_airTransitWater.json`, JSON.stringify(stateData, null, 4))
                .then(() => Success(response, 'Successfully calculated GDP Deflator of all years', stateData))
                .catch((writeError) => Abort(response, 'Write Error', 500, writeError.message));
        })
        .catch((error) => Abort(response, 'Failed to read file', 500, error.message));
});
// endregion

// region POST - Add Crime Data & Capital Income to the Big File
profTomlinRouter.post('/writeAirTransitWater', (request, response) =>
{
    const masterFile = require("D:\\Drive\\Classes\\Oakland\\GA\\Prof Tomlin\\NAICS Unemployment Rate\\profTomlin_naicsBigFile_Simplified3.json")["Virginia - Wyoming"];
    const jsonDataFile = require('../../tempData/profTomlin_airTransitWater.json');

    let newMasterFile = [];

    masterFile.forEach((item) =>
    {
        let stateName = item["State"],
            year = item["Year"];

        if (stateName === "Deleware") stateName = "Delaware";

        let airTransitWaterData = jsonDataFile[stateName] || {};

        newMasterFile.push(Object.assign({}, item, {
            "State": stateName,
            "Air": airTransitWaterData['Air']?.[year] || 0,
            "Transit": airTransitWaterData['Transit']?.[year] || 0,
            "Water": airTransitWaterData['Water']?.[year] || 0
        }));

        if (!airTransitWaterData) console.log('State not exists', stateName);
    });

    // Convert into Excel
    const xls = json2xls(newMasterFile);
    writeFile(`./tempData/profTomlin_naicsMasterFile_airTransitWater3.xlsx`, xls, 'binary')
        .then(() => Success(response, 'Successfully fetch Air Transit Water data for master file'))
        .catch((writeError) => Abort(response, 'Write Error', 500, writeError.message));
});
// endregion

// endregion

// region --- NAICS Combine ---

const numberColumnMap = {
    5: "FDI Value",
    6: "FDI Count",
    7: "Firms",
    8: "Establishments",
    9: "Employment",
    10: "Annual Payroll",
    11: "Unemployment Rate",
    12: "Crime",
    13: "CapitalIncome",
    14: "Taxes",
    15: "Education",
    16: "Highways",
    17: "GDPDeflator",
    18: "Union",
    19: "Air",
    20: "Transit",
    21: "Water"
};

// region GET - Combine Value
profTomlinRouter.get('/combineSIC', (request, response) =>
{
    let fileNumber = '3',
        filePath = "D:\\Drive\\Classes\\Oakland\\GA\\Prof Tomlin\\NAICS Unemployment Rate\\profTomlin_naicsBigFile_Small_" + fileNumber + ".xlsx";

    // Go thru all files
    const workbook = new ExcelJS.Workbook();

    workbook.xlsx.readFile(filePath)
        .then((workbookContent) =>
        {
            const worksheet = workbookContent.worksheets[0];

            // Final Object
            let sicObj = {};

            // Go thru rows
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1)
                {
                    let rowValues = row.values;

                    let sic = rowValues[1]?.toString().substring(0, 2),
                        naics = rowValues[2]?.toString(),
                        year = rowValues[3]?.toString(),
                        stateName = rowValues[4]?.toString();

                    // Check SIC exists
                    if (!sicObj[sic]) sicObj[sic] = {};

                    // Check state exists
                    if (!sicObj[sic][stateName]) sicObj[sic][stateName] = {};

                    // Check year exists in state
                    if (!sicObj[sic][stateName][year])
                    {
                        sicObj[sic][stateName][year] = { RECORD_COUNT: 1 };
                    }
                    else sicObj[sic][stateName][year]['RECORD_COUNT'] += 1;

                    // Number columns is from 5 to 21
                    for (let i = 5; i <= 21; ++i)
                    {
                        if (sicObj[sic][stateName][year][numberColumnMap[i]])
                        {
                            if (i < 11)
                            {
                                // These to be summed
                                sicObj[sic][stateName][year][numberColumnMap[i]] = Number((sicObj[sic][stateName][year][numberColumnMap[i]] + Number(rowValues[i])).toFixed(1));
                            }
                            // These just repeating by state/year
                            else sicObj[sic][stateName][year][numberColumnMap[i]] = Number(Number(rowValues[i]).toFixed(1));
                        }
                        else
                        {
                            sicObj[sic][stateName][year][numberColumnMap[i]] = Number(Number(rowValues[i]).toFixed(1));
                        }
                    }

                    // Generate NAICS array - NAICS code is independent of state
                    if (naics?.trim())
                    {
                        if (!sicObj[sic]['naics']) sicObj[sic]['naics'] = [];
                        if (!sicObj[sic]['naics'].includes(naics)) sicObj[sic]['naics'].push(naics);
                    }
                }
            });

            // Write to file
            writeFile(`./tempData/profTomlin_combinedNaics_${fileNumber}.json`, JSON.stringify(sicObj, null, 4))
                .then(() => Success(response, 'Successfully fetch combined SIC data', sicObj))
                .catch((writeError) => Abort(response, 'Write Error', 500, writeError.message));
        })
        .catch((error) => Abort(response, 'Failed to read file', 500, error.message));
});
// endregion

// region POST - Put data into combined Excel file
profTomlinRouter.post('/exportCombinedSIC', (request, response) => {
    const filePath = "D:\\Drive\\Classes\\Oakland\\GA\\Prof Tomlin\\NAICS Unemployment Rate\\profTomlin_combinedSIC_2digits.xlsx";
    const jsonDataFile = require('../../tempData/profTomlin_combinedNaics_3.json');

    // Go thru all files
    const workbook = new ExcelJS.Workbook();

    workbook.xlsx.readFile(filePath)
        .then((workbookContent) =>
        {
            const worksheet = workbookContent.worksheets[0];

            // Iterate over the sic codes
            Object.keys(jsonDataFile).forEach((sic) => {
                // Iterate over the states
                Object.keys(jsonDataFile[sic]).forEach((state) => {
                    // Exclude the "naics" one out
                    if (state !== 'naics')
                    {
                        // Iterate over the years
                        Object.keys(jsonDataFile[sic][state]).forEach((year) => {
                            let rowData = [sic, year, state];

                            // Append other data
                            for (let i = 5; i <= 21; ++i)
                            {
                                rowData.push(jsonDataFile[sic][state][year][numberColumnMap[i]]);
                            }

                            // Append all NAICS codes to it
                            const naicsList = jsonDataFile[sic]['naics'];
                            naicsList.forEach((naics) => rowData.push(naics));

                            // Start adding row
                            worksheet.addRow(rowData);
                        });
                    }
                });
            });

            // Write to file
            workbook.xlsx.writeFile(filePath)
                .then(() => Success(response, 'Successfully write file'))
                .catch((writeError) => Abort(response, 'Failed to write file', 500, writeError.message));
        })
        .catch((error) => Abort(response, 'Failed to read file', 500, error.message));
});
// endregion

// endregion

export default profTomlinRouter;
