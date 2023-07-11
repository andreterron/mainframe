export interface Dataset {
    type: "dataset";
    name?: string | undefined;
    integrationType?: string;
    token?: string;
}

export interface Table {
    type: "table";
    name: string;

    dataset: string; // Ref -> Dataset
}

export interface Row {
    type: "row";

    table: string; // Ref -> Table
    datasetId?: string; // Ref -> Dataset

    data: {
        [key: string]: any;
    };
}

export interface DatasetObject {
    type: "object";

    objectType: string; // Ref -> ObjectDefinition
    datasetId?: string; // Ref -> Dataset

    data: {
        [key: string]: any;
    };
}

export type DBTypes = Dataset | Row | DatasetObject;
