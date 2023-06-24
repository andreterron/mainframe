export interface IntegrationTable {
    name: string;
}

export interface Integration {
    tables: {
        [key: string]: IntegrationTable;
    };
}
