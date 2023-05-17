# IN10 Component Generator

NPM installable package that generates components for react or blade projects.

## How to install

Install the package by adding the following devDependency to your package.json:

`"in10-component-generator": "github:IN10/IN10-component-generator#v3.0.1"`

Notice the version (semver) after the #, use this to bump the version or install an older version of this package.

## How to use

To use the generator, add the following script to your package.json (so within
`"scripts": {}`):
  
 `"generate": "component-generator"`

The script accepts one argument:

`--dir={YOUR_DIR}` (default: `components`)

This arg should point to the folder containing the subfolders that contain your components. 
For most next-js projects this defaults to `components` directory in root of your project.

Note that this arg should be added within the script in your package.json, e.g.

`"generate": "component-generator --dir=src/comps"`

Then run this with
`npm run generate`

## Dependencies

Please note that this generator is specifically to be used within the IN10-frontend-blueprint setup.

## What it does

The script generates an atomic component for you. The script provides a wizard where u can choose the type
and name (no spaces or special chars expect '-' and '\_').

### For React

The following files will be generated in your chosen type folder:

-   ComponentName (dir)
    -   ComponentName.tsx (React component with empty typing and Styled Component wrapped)
    -   ComponentName.styled.ts (Styled Component div with empty typing)
    -   ComponentName.stories.ts (Optional - Storybook file with dummy args set, typed)
    -   ComponentName.dummy.ts (Optional - Dummy file used to fill args for storybook, typed)
    -   ComponentName.transform.ts (Optional - Transform file used to transform props from API, typed)