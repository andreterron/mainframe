export interface Dataset {
    type: "dataset";
    name: string;
    integrationType?: string;
    oakToken?: string;
}

export type DBTypes = Dataset;
