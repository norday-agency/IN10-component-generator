const inquirer = require('inquirer');
const fs = require('fs');
const replace = require('replace-in-file');

const TEMPLATES_DIR = './react-templates';
const COMPONENTS_DIR = 'components';

const QUESTIONS = [
    {
        name: 'component-type',
        type: 'list',
        message: 'What component template would you like to generate?',
        choices: ['organisms', 'molecules', 'atoms'],
    },
    {
        name: 'component-name',
        type: 'input',
        message: 'Component name:',
        validate: function(input) {
            if (/^([A-Za-z\-\_\d])+$/.test(input)) return true;
            else return 'Component name may only include letters, numbers, underscores and dashes.';
        },
    },
];

inquirer.prompt(QUESTIONS).then(answers => {
    const componentName = answers['component-name'];
    const componentType = answers['component-type'];

	if (!fs.existsSync(COMPONENTS_DIR)){
		fs.mkdirSync(COMPONENTS_DIR);
	}

    createComponentFiles(componentName, componentType);
});

function createComponentFiles(componentName, componentType) {
    const filesToCreate = fs.readdirSync(TEMPLATES_DIR);
    let firstItem = true;
    filesToCreate.forEach(file => {
        const origFilePath = `${TEMPLATES_DIR}/${file}`;

        // get stats about the current file
        const stats = fs.statSync(origFilePath);
        const componentNamePascal = toPascalCase(componentName);
        const componentTypePascal = toPascalCase(componentType);

		if (!fs.existsSync(`${COMPONENTS_DIR}/${componentType}`)){
			fs.mkdirSync(`${COMPONENTS_DIR}/${componentType}`);
		}

        if (stats.isFile()) {
            const contents = fs.readFileSync(origFilePath, 'utf8');
            const fileWithoutExtension = file.substring(0, file.indexOf('.'));

            const writeDir = `${COMPONENTS_DIR}/${componentType}/${componentNamePascal}`;
            let writeFile = `${componentNamePascal}.jsx`;

            if (fileWithoutExtension === 'story') {
                writeFile = `${componentNamePascal}.stories.js`;
            } else if (fileWithoutExtension === 'styles') {
                writeFile = `${componentNamePascal}.styles.js`;
            }

            const writePath = `${__dirname}/${writeDir}/${writeFile}`;

            if (firstItem) {
                try {
                    fs.mkdirSync(writeDir, { recursive: true });
                } catch (e) {
                    console.log(e);
                }

                firstItem = false;
            }

            try {
                fs.writeFileSync(writePath, contents, 'utf8');
            } catch (e) {
                console.log(e);
            }

            const replaceOptions = {
                files: writePath,
                from: [/COMPONENTNAMEPASCAL/g, /COMPONENTNAME/g],
                to: [componentNamePascal, componentNamePascal],
            };

            const replaceOptionsForType = {
                files: writePath,
                from: [/COMPONENTTYPE/g],
                to: [componentTypePascal],
            };

            replace(replaceOptions)
                .then(() => {
                    replace(replaceOptionsForType)
                        .then(() => {
                            console.log('replaced name and type');
                        })
                        .catch(() => {
                            console.log('failed at replacing type');
                        });
                })
                .catch(() => {
                    console.log('failed at replacing name');
                });
        }
    });
}

function toPascalCase(string) {
    const camelCase = string.replace(/(\-\w)/g, function(m) {
        return m[1].toUpperCase();
    });
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}
