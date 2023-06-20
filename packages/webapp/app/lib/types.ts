export interface Table {
    type: "table";
    name: string;
    integrationType?: string;
    oakToken?: string;
}

export type DBTypes = Table;
