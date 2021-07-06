import React from 'react';
import { Story } from "@storybook/react";
import COMPONENTNAME, { COMPONENTNAMEProps } from './COMPONENTNAME';
import COMPONENTNAMEDummy from './COMPONENTNAME.dummy';

export default {
    title: 'COMPONENTTYPE/COMPONENTNAME',
    component: COMPONENTNAME,
};

const Template: Story<COMPONENTNAMEProps> = args => <COMPONENTNAME {...args} />;

export const base = Template.bind({});

base.args = COMPONENTNAMEDummy;
