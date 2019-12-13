# IN10 Component Generator
NPM installable package that generates components for react or blade projects. 

## How to install
Install the package by adding the following devDependency to your package.json:

`"in10-component-generator": "github:IN10/IN10-component-generatorv#1.0.0"`

Notice the version (semver) after the #, use this to bump the version or install an older version of this package.

## How to use
To use the generator, add the following script to your package.json (so within 
    `"scripts": {}`):
    
 `"generate": "component-generator"`
 
 The script accepts two arguments:
 
 `--blade` 
 
 Use if you're working on a laravel/blade project, defaults to `false`
 
 
 
 `--dir={YOUR_DIR}`  
 
 This should be the base dir to place the components. 
 
 For a react project (no --blade flag set) this would be the 
 folder containing the organisms, molecules and atoms directories. For 
 React this defaults to `components` directory in root of your project. 
 
 For blade project (--blade flag) this should be set to the folder 
 containing the sass and views directories. For blade this defaults 
 to `resources`.
 
 Note that these flags should be added within the script in your package.json, 
 e.g. 
 
 `"generate": "component-generator --blade --dir=theme/resources"`
 
## Dependencies
Please note that this generator is specifically to be used within the IN10 setups, so 
the blade generator expects that the project uses blade (what a surprise!), the IN10 styleguide and a
frontend setup that can handle sass. 

The react generator expects a project that uses storybook and styled components.
 
## What it does
The script generates an atomic component for you. The script provides a wizard where u can choose the type
and name (no spaces or special chars expect '-' and '_'). 

### For React 
The following files will be generated in your chosen type folder:
- ComponentName (dir)
    - ComponentName.jsx (React file with PropTypes and Styled Component wrapped)
    - ComponentName.styled.js (Styled Component file)
    - ComponentName.stories.js (Storybook file)
    
### For Blade 
The following files will be generated within the base dir:
- views (already existing dir)
    - components (already exisiting dir)
        - Atoms or Molecules Or Organisms (chosen dir)
            - componentName.blade.php
    - styleguide (already existing dir)
        - Atoms or Molecules Or Organisms (chosen dir)
            - componentName.blade.php

For blade, the wizard asks whether to create a stylesheet file, if chosen, it creates:
- sass (already existing dir)
    - 04_atoms or 05_molecules Or 06_organisms (chosen dir)
        - _componentName.scss
        
as an addition it will look for app.scss within the sass folder and add the correct import line to it:

`@import '06_organisms/componentName';` 
  
     
## To do
- Add more options for React generator, e.g. whether to add a styled component and story
- Possibility to set atomic-type and name with flags, then skip the wizard 
(e.g. `npm run generate MyAtom --type=atom`)
- For blade splice in the `@import '06_organisms/componentName';` at the correct position alphabetically (it should splice it in under the correct type already) 


## Other
Slack me (Jules) for questions or additions.
Or better yet: create a pull request! Walk by for tips on developing an npm module (use [npm link](https://docs.npmjs.com/cli/link.html)!)
 
