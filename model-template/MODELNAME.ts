import MODELNAMETransform from "./MODELNAME.transform";
import { MODELNAMEIncomingType } from "./MODELNAME.transform.d";
import { MODELNAMEType } from "./MODELNAME.type";

const QUICKTYPE_ENDPOINT = "MODEL_QUICKTYPE_ENDPOINT";

type MODELNAMEModelType = {
    endpoint: ((query?: any) => string);
    transformation: (incoming: MODELNAMEIncomingType) => MODELNAMEType;
}

const MODELNAME: MODELNAMEModelType = {
    endpoint: () => QUICKTYPE_ENDPOINT,
    transformation: MODELNAMETransform,
}

export default MODELNAME;
