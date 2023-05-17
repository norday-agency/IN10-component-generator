import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import COMPONENTNAME from './COMPONENTNAME';
import COMPONENTNAMEDummy from './COMPONENTNAME.dummy';

const meta: Meta<typeof COMPONENTNAME> = {
    title: 'COMPONENTTYPE/COMPONENTNAME',
    component: COMPONENTNAME,
};

export default meta;

export const Primary: StoryObj<typeof COMPONENTNAME> = {
    args: COMPONENTNAMEDummy,
};
