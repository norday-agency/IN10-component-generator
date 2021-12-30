#!/usr/bin/env node
require("path");
const inquirer = require("inquirer");
const fs = require("fs");
const replace = require("replace-in-file");
const argv = require("yargs").argv;
const {
    quicktype,
    InputData,
    jsonInputForTargetLanguage,
} = require("quicktype-core");
const { format } = require("date-fns");


const { apiBase, dir } = argv;

if(!apiBase) {
    console.error(`No base set for your API urls, set like this "npm run model --apiBase=https://api.in10.nl/api/website/v1.0/"`);
    return;
}

const baseDir = dir || "model";

const templatesDir = `${__dirname}/model-template`;

start();

function start() {
    let updateOrGenQuestion = {
        name: "update-or-generate",
        type: "list",
        message: "Do you want to generate or update a model?",
        choices: ["generate", "update"]
    }

    inquirer.prompt([updateOrGenQuestion]).then(answers => {
        const update = answers["update-or-generate"];
        if(update === 'generate') {
            questionNewModel();
        } else {
            questionUpdateModel();
        }
    });
}

function questionNewModel() {
    const questions = [
        {
            name: "model-name",
            type: "input",
            message: "Model name:",
            validate: function(input) {
                if (/^([A-Za-z\-\_\d])+$/.test(input)) return true;
                else
                    return "Model name may only include letters, numbers, underscores and dashes.";
            }
        },
        {
            name: "model-endpoint",
            type: "input",
            message: `API endpoint to use for quicktyping: ${apiBase}`
        },
    ];
    inquirer.prompt(questions).then(answers => {
        const modelName = answers["model-name"];
        const endpoint = answers["model-endpoint"];
        createModelFiles(modelName, endpoint);
    })
}

function createModelFiles(
    modelName,
    endpoint
) {
    const filesToCreate = fs.readdirSync(templatesDir);
    let firstItem = true;

    const modelNamePascal = toPascalCase(modelName);
    const writeDir = `${baseDir}/${modelNamePascal}`;

    if (!fs.existsSync(`${baseDir}/${modelName}`)) {
        filesToCreate.forEach(file => {
            const origFilePath = `${templatesDir}/${file}`;
            // get stats about the current file
            const stats = fs.statSync(origFilePath);

            if (stats.isFile()) {
                const contents = fs.readFileSync(origFilePath, "utf8");
                const fileWithoutExtension = file.replace(".ts", "");
                let writeFile = `${modelNamePascal}.ts`;

                if (fileWithoutExtension === "MODELNAME.type") {
                    writeFile = `${modelNamePascal}.type.ts`;
                } else if (fileWithoutExtension === "MODELNAME.transform") {
                    writeFile = `${modelNamePascal}.transform.ts`;
                } else if (fileWithoutExtension === "MODELNAME") {
                    writeFile = `${modelNamePascal}.ts`;
                }

                const writePath = `${writeDir}/${writeFile}`;

                if (firstItem) {
                    try {
                        fs.mkdirSync(writeDir, { recursive: true });
                    } catch (e) {
                        console.log(e);
                    }

                    firstItem = false;
                }

                try {
                    fs.writeFileSync(writePath, contents, "utf8");
                } catch (e) {
                    console.log(e);
                }

                const replaceOptions = {
                    files: writePath,
                    from: [/MODELNAME/g, /MODEL_QUICKTYPE_ENDPOINT/g],
                    to: [modelNamePascal, endpoint]
                };
                replace(replaceOptions)
                    .catch(() => {
                        console.log("Failed at replacing name");
                    });
            }
        });

        endpoint && fetchAndTypeAndWriteToFile(`${writeDir}/${modelNamePascal}.transform.d.ts`, modelName, endpoint)
    } else {
        console.error("Model already exists!");
        return false;
    }

    console.log(`-----------------------------------------`);
    console.log(`Your model ${modelNamePascal} has been created in ${writeDir}/${modelNamePascal}.ts`);
    console.log(`To finish the model please replace the "endpoint: () => QUICKTYPE_ENDPOINT" part with the actual endpoint, especially when the endpoint is dynamic or based on query or url params.`);
    console.log(`DO NOT remove the "const QUICKTYPE_ENDPOINT = XXX" line, this is used to update the endpoint typings`);
    console.log(`-----------------------------------------`);
}

function questionUpdateModel() {
    let exisitingModelQuestion = {
        name: "model-name",
        type: "list",
        message: "What model do you want to update?",
        choices: []
    };

    const modelsInBaseDir = fs.readdirSync(baseDir);

    if(modelsInBaseDir.length > 0) {
        exisitingModelQuestion.choices = modelsInBaseDir;
    }

    const questions = [
        exisitingModelQuestion,
        {
            name: "new-endpoint",
            type: "input",
            message: `Does the model have a new endpoint (empty to keep endpoint): ${apiBase}`
        },
    ];
    inquirer.prompt(questions).then(answers => {
        const modelName = answers["model-name"];
        const newEndpoint = answers["new-endpoint"];
        updateModelFiles(modelName, newEndpoint);
    })
}

function updateModelFiles(modelName, newEndpoint) {

    const modelFile = `${baseDir}/${modelName}/${modelName}.ts`;
    const quickTypedFile = `${baseDir}/${modelName}/${modelName}.transform.d.ts`;
    

    const contents = fs.readFileSync(modelFile, "utf8");

    const indexOfQuickTypeVar = contents.indexOf('QUICKTYPE_ENDPOINT');
    if(indexOfQuickTypeVar < 0) {
        console.error(`Cant find QUICKTYPE_ENDPOINT in ${baseDir}/${modelName}/${modelName}.ts`);
        console.error(`Please add 'const QUICKTYPE_ENDPOINT = "endpoint"' to the file that is used (or overwritten) as endpoint for quicktyping`);
        return false;
    }

    let endpoint;
    try {
        const firstQuoteAfterConst = contents.indexOf(`"`, indexOfQuickTypeVar) + 1;
        const nextQuoteAfterConst = contents.indexOf(`"`, firstQuoteAfterConst);

        endpoint = contents.substring(
            firstQuoteAfterConst,
            nextQuoteAfterConst
        );
    } catch (e) {
        console.error(`Can't parse QUICKTYPE_ENDPOINT in ${baseDir}/${modelName}/${modelName}.ts, make sure it is formatted like 'const QUICKTYPE_ENDPOINT = "endpoint"'`);
        return false;
    }

    if(newEndpoint && newEndpoint !== endpoint) {
        const replaceOptions = {
            files: modelFile,
            from: [endpoint],
            to: [newEndpoint]
        };

        replace(replaceOptions)
            .catch(() => {
                console.log("Failed at replacing name");
            });

        console.warn(`You have changed the quicktype endpoint for model ${baseDir}/${modelName}/${modelName}.ts`);
        console.warn(`The QUICKTYPE_EXAMPLE const has automatically been updated`);
        console.warn(`DO update the endpoint: () => string variable in the model to match the quicktype endpoint or else typing check will fail`);

        endpoint = newEndpoint;
    }

    if(endpoint) {
        fetchAndTypeAndWriteToFile(quickTypedFile, modelName, endpoint);
    }
}

function toPascalCase(string) {
    const camelCase = string.replace(/(\-\w)/g, function(m) {
        return m[1].toUpperCase();
    });
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}

function fetchAndTypeAndWriteToFile(fileName, name, endpoint) {
    fetchAndType(`${name}IncomingType`, `${apiBase}${endpoint}`)
        .then(contents => fs.writeFileSync(fileName, contents.join('\n'), "utf8"));
}

async function fetchAndType(name, endpoint){
    try {
        const data = await fetch(endpoint);
        try {
            const json = await data.json();
            const jsonData = json.data || json;
            const {lines: contents} = await quicktypeJSON('typescript', name, JSON.stringify(jsonData), endpoint)
            return contents
        } catch (e) {
            console.log(`Error creating quicktype definition for endpoint "${endpoint}":`, e)
        }
    } catch (e){
        console.log(`Error fetching endpoint "${endpoint}":`, e)
    }
}

async function quicktypeJSON(targetLanguage, typeName, jsonString, endpoint) {
    const jsonInput = jsonInputForTargetLanguage(targetLanguage);

    await jsonInput.addSource({
        name: typeName,
        samples: [jsonString],
    });

    const inputData = new InputData();
    inputData.addInput(jsonInput);

    const timestamp = Date.now();

    return await quicktype({
        inputData,
        lang: targetLanguage,
        leadingComments: [
            `INCOMING TYPE FOR ${typeName.replace(`IncomingType`, ``)} GENERATED WITH QUICKTYPE THROUGH IN10 COMPONENT GENERATOR`,
            `Endpoint: ${endpoint}`,
            `Timestamp: ${timestamp}`,
            `Time: ${format(timestamp, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")}`
        ],
        rendererOptions: {
            'just-types': 'true'
        },
    });
}
