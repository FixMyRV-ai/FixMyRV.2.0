import { PoolConfig } from "pg";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { DistanceStrategy } from "@langchain/community/vectorstores/pgvector";
export declare const getVectorStoreConfig: () => {
    postgresConnectionOptions: PoolConfig;
    tableName: string;
    columns: {
        idColumnName: string;
        vectorColumnName: string;
        contentColumnName: string;
        metadataColumnName: string;
    };
    distanceStrategy: DistanceStrategy;
};
export declare const getVectorStore: () => Promise<PGVectorStore>;
//# sourceMappingURL=database.d.ts.map