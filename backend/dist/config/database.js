import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Setting } from "../models/index.js";
let vectorStoreInstance = null;
export const getVectorStoreConfig = () => ({
    postgresConnectionOptions: {
        type: process.env.DB_TYPE,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    },
    tableName: "vector_data",
    columns: {
        idColumnName: "id",
        vectorColumnName: "vector",
        contentColumnName: "content",
        metadataColumnName: "metadata",
    },
    distanceStrategy: "cosine",
});
export const getVectorStore = async () => {
    if (!vectorStoreInstance) {
        const setting = await Setting.findOne();
        if (!setting || !setting.key) {
            throw new Error("API key is missing or not found");
        }
        const embeddings = new OpenAIEmbeddings({
            apiKey: setting.key,
            model: setting.embeddingModel,
        });
        vectorStoreInstance = await PGVectorStore.initialize(embeddings, getVectorStoreConfig());
    }
    return vectorStoreInstance;
};
//# sourceMappingURL=database.js.map