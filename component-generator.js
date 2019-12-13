const inquirer = require("inquirer");
const fs = require("fs");
const replace = require("replace-in-file");

const REACT = false;

let TEMPLATES_DIR = "";
let BASE_DIR = "";
let QUESTIONS = [];

if (REACT) {
  BASE_DIR = "components";
  TEMPLATES_DIR = "./react-templates";
  QUESTIONS = [
    {
      name: "component-type",
      type: "list",
      message: "What component template would you like to generate?",
      choices: ["organisms", "molecules", "atoms"]
    },
    {
      name: "component-name",
      type: "input",
      message: "Component name:",
      validate: function(input) {
        if (/^([A-Za-z\-\_\d])+$/.test(input)) return true;
        else
          return "Component name may only include letters, numbers, underscores and dashes.";
      }
    }
  ];

  inquirer.prompt(QUESTIONS).then(answers => {
    const componentName = answers["component-name"];
    const componentType = answers["component-type"];

    if (!fs.existsSync(BASE_DIR)) {
      fs.mkdirSync(BASE_DIR);
    }

    createReactComponentFiles(componentName, componentType);
  });
} else {
  BASE_DIR = "resources";
  TEMPLATES_DIR = "./blade-templates";
  QUESTIONS = [
    {
      name: "component-type",
      type: "list",
      message: "What component template would you like to generate?",
      choices: ["organisms", "molecules", "atoms"]
    },
    {
      name: "component-name",
      type: "input",
      message: "Component name:",
      validate: function(input) {
        if (/^([A-Za-z\-\_\d])+$/.test(input)) return true;
        else
          return "Component name may only include letters, numbers, underscores and dashes.";
      }
    },
    {
      name: "component-scss",
      type: "confirm",
      message: "Include .scss file?"
    }
  ];

  inquirer.prompt(QUESTIONS).then(answers => {
    const componentName = answers["component-name"];
    const componentType = answers["component-type"];

    if (!fs.existsSync(BASE_DIR)) {
      fs.mkdirSync(BASE_DIR);
    }
    const componentStylesheet = answers["component-scss"];

    createBladeComponentFiles(
      componentName,
      componentType,
      componentStylesheet
    );
  });
}

function createReactComponentFiles(componentName, componentType) {
  const filesToCreate = fs.readdirSync(TEMPLATES_DIR);
  let firstItem = true;
  filesToCreate.forEach(file => {
    const origFilePath = `${TEMPLATES_DIR}/${file}`;

    // get stats about the current file
    const stats = fs.statSync(origFilePath);
    const componentNamePascal = toPascalCase(componentName);
    const componentTypePascal = toPascalCase(componentType);

    if (!fs.existsSync(`${BASE_DIR}/${componentType}`)) {
      fs.mkdirSync(`${BASE_DIR}/${componentType}`);
    }

    if (stats.isFile()) {
      const contents = fs.readFileSync(origFilePath, "utf8");
      const fileWithoutExtension = file.substring(0, file.indexOf("."));

      const writeDir = `${BASE_DIR}/${componentType}/${componentNamePascal}`;
      let writeFile = `${componentNamePascal}.jsx`;

      if (fileWithoutExtension === "story") {
        writeFile = `${componentNamePascal}.stories.js`;
      } else if (fileWithoutExtension === "styles") {
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
        fs.writeFileSync(writePath, contents, "utf8");
      } catch (e) {
        console.log(e);
      }

      const replaceOptions = {
        files: writePath,
        from: [/COMPONENTNAMEPASCAL/g, /COMPONENTNAME/g],
        to: [componentNamePascal, componentNamePascal]
      };

      const replaceOptionsForType = {
        files: writePath,
        from: [/COMPONENTTYPE/g],
        to: [componentTypePascal]
      };

      replace(replaceOptions)
        .then(() => {
          replace(replaceOptionsForType)
            .then(() => {
              console.log("replaced name and type");
            })
            .catch(() => {
              console.log("failed at replacing type");
            });
        })
        .catch(() => {
          console.log("failed at replacing name");
        });
    }
  });
}

function createBladeComponentFiles(
  componentName,
  componentType,
  componentStylesheet
) {
  const filesToCreate = fs.readdirSync(TEMPLATES_DIR);

  let cssMap = null;
  let cssSpliceString = null;

  filesToCreate.forEach(file => {
    const origFilePath = `${TEMPLATES_DIR}/${file}`;

    // get stats about the current file
    const stats = fs.statSync(origFilePath);

    if (stats.isFile()) {
      const contents = fs.readFileSync(origFilePath, "utf8");

      const fileExtension = file.substring(file.indexOf(".") + 1);
      if (fileExtension === "scss" && !componentStylesheet) {
        return null;
      }

      const fileWithoutExtension = file.substring(0, file.indexOf("."));

      let writeDir = `views/components/${componentType}/`;

      if (!fs.existsSync(`${BASE_DIR}/views`)) {
        fs.mkdirSync(`${BASE_DIR}/views`);
      }

      switch (fileWithoutExtension) {
        case "component":
          if (!fs.existsSync(`${BASE_DIR}/views/components`)) {
            fs.mkdirSync(`${BASE_DIR}/views/components`);
          }
          writeDir = `views/components/${componentType}/`;
          if (!fs.existsSync(`${BASE_DIR}/${writeDir}`)) {
            fs.mkdirSync(`${BASE_DIR}/${writeDir}`);
          }
          break;
        case "styleguide":
          if (!fs.existsSync(`${BASE_DIR}/views/styleguide`)) {
            fs.mkdirSync(`${BASE_DIR}/views/styleguide`);
          }
          writeDir = `views/styleguide/${componentType}/`;
          if (!fs.existsSync(`${BASE_DIR}/${writeDir}`)) {
            fs.mkdirSync(`${BASE_DIR}/${writeDir}`);
          }
          break;
        case "_style":
          if (!fs.existsSync(`${BASE_DIR}/sass/`)) {
            fs.mkdirSync(`${BASE_DIR}/sass/`);
          }
          switch (componentType) {
            case "organisms":
              cssMap = `06_organisms`;
              cssSpliceString = `// 06 Organisms`;
              break;
            case "molecules":
              cssMap = `05_molecules`;
              cssSpliceString = `// 05 Molecules`;
              break;
            case "atoms":
              cssMap = `04_atoms`;
              cssSpliceString = `// 04 Atoms`;
              break;
            default:
              cssMap = componentType;
              cssSpliceString = false;
              break;
          }
          if (!fs.existsSync(`${BASE_DIR}/sass/${cssMap}`)) {
            fs.mkdirSync(`${BASE_DIR}/sass/${cssMap}`);
          }
          writeDir = `sass/${cssMap}/_`;
          break;
        default:
          writeDir = "";
          break;
      }

      const writePath = `${BASE_DIR}/${writeDir}${componentName}.${fileExtension}`;

      fs.writeFileSync(writePath, contents, "utf8");

      if (fileWithoutExtension === "styleguide") {
        const replaceOptions = {
          files: writePath,
          from: [/COMPONENTTYPE/g, /COMPONENTNAMEPASCAL/g, /COMPONENTNAME/g],
          to: [componentType, toPascalCase(componentName), componentName]
        };

        replaceComponentName(replaceOptions);
      } else {
        const replaceOptions = {
          files: writePath,
          from: [/COMPONENTNAMEPASCAL/g, /COMPONENTNAME/g],
          to: [toPascalCase(componentName), componentName]
        };

        replaceComponentName(replaceOptions);
      }
    }
  });

  if (componentStylesheet && cssSpliceString) {
    if (!fs.existsSync(`${BASE_DIR}/sass/app.scss`)) {
      fs.writeFileSync(`${BASE_DIR}/sass/app.scss`, "", "utf8");
    }
    const sassAppFile = `${BASE_DIR}/sass/app.scss`;

    const stats = fs.statSync(sassAppFile);

    if (stats.isFile()) {
      const contents = fs.readFileSync(sassAppFile, "utf8");
      const index = contents.indexOf(cssSpliceString) + cssSpliceString.length;
      if (index) {
        const newContents =
          contents.slice(0, index) +
          `\n@import '${cssMap}/${componentName}';\n` +
          contents.slice(index + 1, contents.length);
        fs.writeFileSync(sassAppFile, newContents, "utf8");
      }
    }
  }
}

function replaceComponentName(replaceOptions) {
  replace(replaceOptions)
    .then(changes => {
      console.log("Replaced: ", changes.join(", "));
    })
    .catch(error => {
      console.error("Error occurred:", error);
    });
}

function toPascalCase(string) {
  const camelCase = string.replace(/(\-\w)/g, function(m) {
    return m[1].toUpperCase();
  });
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}
