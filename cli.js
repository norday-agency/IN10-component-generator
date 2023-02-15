#!/usr/bin/env node
require("path");
const inquirer = require("inquirer");
const fs = require("fs");
const replace = require("replace-in-file");
const argv = require("yargs").argv;

if (argv.blade) {
  const baseDir = argv.dir || "resources";
  const templatesDir = `${__dirname}/blade-templates`;
  const questions = [
    {
      name: "component-type",
      type: "list",
      message: "Blade component type:",
      choices: ["organisms", "molecules", "atoms"],
    },
    {
      name: "component-name",
      type: "input",
      message: "Component name:",
      validate: function (input) {
        if (/^([A-Za-z\-\_\d])+$/.test(input)) return true;
        else return "Component name may only include letters, numbers, underscores and dashes.";
      },
    },
    {
      name: "component-scss",
      type: "confirm",
      message: "Include .scss file?",
    },
  ];

  inquirer.prompt(questions).then((answers) => {
    const componentName = answers["component-name"];
    const componentType = answers["component-type"];

    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir);
    }
    const componentStylesheet = answers["component-scss"];

    createBladeComponentFiles(componentName, componentType, componentStylesheet, templatesDir, baseDir);
  });
} else {
  const baseDir = argv.dir || "components";
  const templatesDir = `${__dirname}/react-typescript-templates`;

  let folderQuestion = {
    name: "component-type",
    type: "list",
    message: "React component folder:",
    choices: [],
  };

  const foldersInBaseDir = fs.readdirSync(baseDir);

  if (foldersInBaseDir.length > 0) {
    folderQuestion.choices = foldersInBaseDir;
  }

  const questions = [
    folderQuestion,
    {
      name: "component-name",
      type: "input",
      message: "Component name:",
      validate: function (input) {
        if (/^([A-Za-z\-\_\d])+$/.test(input)) return true;
        else return "Component name may only include letters, numbers, underscores and dashes.";
      },
    },
    {
      name: "with-story",
      type: "confirm",
      message: "Include storybook and dummy files?",
      default: true,
    },
    {
      name: "with-transformation",
      type: "confirm",
      message: "Include transformation file?",
      default: false,
    },
  ];

  inquirer.prompt(questions).then((answers) => {
    const componentName = answers["component-name"];
    const componentType = answers["component-type"];
    const withStory = answers["with-story"];
    const withTransformation = answers["with-transformation"];

    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir);
    }

    createReactComponentFiles(componentName, componentType, withStory, withTransformation, templatesDir, baseDir);
  });
}

function createReactComponentFiles(componentName, componentType, withStory, withTransformation, templatesDir, baseDir) {
  const filesToCreate = fs.readdirSync(templatesDir);
  let firstItem = true;

  if (!fs.existsSync(`${baseDir}/${componentType}/${componentName}`)) {
    filesToCreate.forEach((file) => {
      const extension = `t`;
      const origFilePath = `${templatesDir}/${file}`;

      // get stats about the current file
      const stats = fs.statSync(origFilePath);
      const componentNamePascal = toPascalCase(componentName);
      const componentTypePascal = toPascalCase(componentType);
      const componentNameSnake = toSnakeCase(componentName);

      if (!fs.existsSync(`${baseDir}/${componentType}`)) {
        fs.mkdirSync(`${baseDir}/${componentType}`);
      }

      if (stats.isFile()) {
        const contents = fs.readFileSync(origFilePath, "utf8");
        const fileWithoutExtension = file.substring(0, file.indexOf("."));

        const writeDir = `${baseDir}/${componentType}/${
          componentType === "blocks" ? "components/" : ""
        }${componentNamePascal}`;
        let writeFile;

        if (fileWithoutExtension === "component") {
          // If we're creating a block-component, skip the default component template and use component-block
          if (componentType === "blocks") return;
          writeFile = `${componentNamePascal}.${extension}sx`;
        } else if (fileWithoutExtension === "component-block") {
          if (componentType !== "blocks") return;
          writeFile = `${componentNamePascal}.${extension}sx`;
        } else if (fileWithoutExtension === "story") {
          if (!withStory) return;
          writeFile = `${componentNamePascal}.stories.${extension}sx`;
        } else if (fileWithoutExtension === "styles") {
          writeFile = `${componentNamePascal}.styles.${extension}s`;
        } else if (fileWithoutExtension === "transformation") {
          if (!withTransformation) return;
          writeFile = `${componentNamePascal}.transform.${extension}s`;
        } else if (fileWithoutExtension === "dummy") {
          if (!withStory) return;
          writeFile = `${componentNamePascal}.dummy.${extension}s`;
        }

        const writePath = `${writeDir}/${writeFile}`;

        if (firstItem) {
          try {
            fs.mkdirSync(writeDir, { recursive: true });
          } catch (e) {
            console.log(e);
          }
        }

        try {
          fs.writeFileSync(writePath, contents, "utf8");
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

        const replaceOptionsForNameSnake = {
          files: writePath,
          from: [/COMPONENTNAMESNAKE/g],
          to: [componentNameSnake],
        };

        replace(replaceOptionsForNameSnake)
          .then(() => {
            replace(replaceOptionsForType)
              .then(() => {
                replace(replaceOptions)
                  .then()
                  .catch(() => {
                    console.log("Failed at replace name");
                  });
              })
              .catch(() => {
                console.log("Failed at replacing type");
              });
          })
          .catch(() => {
            console.log("Failed at replacing name snakecase");
          });
      }

      // If we're creating a block-component, add the new blocktype to blocktypes + blocksconfigurations
      if (componentType === "blocks") {
        if (firstItem) {
          const blocksDir = `${baseDir}/${componentType}`;
          const blockTypeFilePath = blocksDir + "/Types/BlockType.ts";

          const replaceOptionsBlockTypeFile = {
            files: blockTypeFilePath,
            from: ["import", "export enum BlockTypesNames {", "type BlockType ="],
            to: [
              `import { ${componentNamePascal}Type } from '../components/${componentNamePascal}/${componentNamePascal}'\nimport`,
              `export enum BlockTypesNames { ${componentNameSnake} = "${componentNameSnake}",`,
              `type BlockType = | ${componentNamePascal}Type`,
            ],
          };

          replace(replaceOptionsBlockTypeFile)
            .then()
            .catch(() => {
              console.log("Failed at replacing type");
            });

          // Find blocksConfigurations.ts
          // Top of file, add: `import ${componentNamePascal} from '../components/${componentNamePascal}/${componentNamePascal}';`
          // Find const blockConfigurations
          // add: [BlockTypesNames.componentNameSnakeCase]: { transformation: (v) => v, component: componentNamePascal },
        }

        firstItem = false;
      }
    });
  } else {
    console.error("Component already exists!");
    return false;
  }
}

function createBladeComponentFiles(componentName, componentType, componentStylesheet, templatesDir, baseDir) {
  const filesToCreate = fs.readdirSync(templatesDir);

  let cssMap = null;
  let cssSpliceString = null;

  filesToCreate.forEach((file) => {
    const origFilePath = `${templatesDir}/${file}`;

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

      if (!fs.existsSync(`${baseDir}/views`)) {
        fs.mkdirSync(`${baseDir}/views`);
      }

      switch (fileWithoutExtension) {
        case "component":
          if (!fs.existsSync(`${baseDir}/views/components`)) {
            fs.mkdirSync(`${baseDir}/views/components`);
          }
          writeDir = `views/components/${componentType}/`;
          if (!fs.existsSync(`${baseDir}/${writeDir}`)) {
            fs.mkdirSync(`${baseDir}/${writeDir}`);
          }
          break;
        case "styleguide":
          if (!fs.existsSync(`${baseDir}/views/styleguide`)) {
            fs.mkdirSync(`${baseDir}/views/styleguide`);
          }
          writeDir = `views/styleguide/${componentType}/`;
          if (!fs.existsSync(`${baseDir}/${writeDir}`)) {
            fs.mkdirSync(`${baseDir}/${writeDir}`);
          }
          break;
        case "_style":
          if (!fs.existsSync(`${baseDir}/sass/`)) {
            fs.mkdirSync(`${baseDir}/sass/`);
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
          if (!fs.existsSync(`${baseDir}/sass/${cssMap}`)) {
            fs.mkdirSync(`${baseDir}/sass/${cssMap}`);
          }
          writeDir = `sass/${cssMap}/_`;
          break;
        default:
          writeDir = "";
          break;
      }

      const writePath = `${baseDir}/${writeDir}${componentName}.${fileExtension}`;

      fs.writeFileSync(writePath, contents, "utf8");

      if (fileWithoutExtension === "styleguide") {
        const replaceOptions = {
          files: writePath,
          from: [/COMPONENTTYPE/g, /COMPONENTNAMEPASCAL/g, /COMPONENTNAME/g],
          to: [componentType, toPascalCase(componentName), componentName],
        };

        replaceComponentName(replaceOptions);
      } else {
        const replaceOptions = {
          files: writePath,
          from: [/COMPONENTNAMEPASCAL/g, /COMPONENTNAME/g],
          to: [toPascalCase(componentName), componentName],
        };

        replaceComponentName(replaceOptions);
      }
    }
  });

  if (componentStylesheet && cssSpliceString) {
    if (!fs.existsSync(`${baseDir}/sass/app.scss`)) {
      fs.writeFileSync(`${baseDir}/sass/app.scss`, "", "utf8");
    }
    const sassAppFile = `${baseDir}/sass/app.scss`;

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
    .then()
    .catch((error) => {
      console.error("Error occurred:", error);
    });
}

function toPascalCase(string) {
  const camelCase = string.replace(/(\-\w)/g, function (m) {
    return m[1].toUpperCase();
  });
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}

const toSnakeCase = (str) =>
  str &&
  str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map((x) => x.toLowerCase())
    .join("_");
