export interface Dataset {
    type: "dataset";
    name: string;
    integrationType?: string;
    oakToken?: string;
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

export type DBTypes = Dataset | Row;
