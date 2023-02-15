import React from "react";
import StyledCOMPONENTNAME from "./COMPONENTNAME.styles";
import { BlockBase, BlockTypesNames } from "../../Types/BlockType";

export type COMPONENTNAMEProps = {};

export type COMPONENTNAMEType = BlockBase<BlockTypesNames.paragraph, COMPONENTNAMEProps>;

const COMPONENTNAME: React.FC<COMPONENTNAMEProps> = ({}) => <StyledCOMPONENTNAME></StyledCOMPONENTNAME>;

export default COMPONENTNAME;
