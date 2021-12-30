import { MODELNAMEIncomingType } from "./MODELNAME.transform.d";
import { MODELNAMEType } from "./MODELNAME.type";

const MODELNAMETransform = (incoming: MODELNAMEIncomingType): MODELNAMEType => ({
    ...incoming,
});

export default MODELNAMETransform;
