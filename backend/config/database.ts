import { PoolConfig } from "pg";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { OpenAIEmbeddings } from "@langchain/openai";
import { DistanceStrategy } from "@langchain/community/vectorstores/pgvector";
import { Setting } from "../models/index.js";

let vectorStoreInstance: PGVectorStore | null = null;

export const getVectorStoreConfig = () => ({
  postgresConnectionOptions: {
    type: process.env.DB_TYPE,
    host: process.env.DB_HOST,
    port: (process.env.DB_PORT as unknown as number) || undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: (process.env.DB_SSL === 'true' || process.env.PGSSLMODE === 'require' || !!process.env.RAILWAY)
      ? { rejectUnauthorized: false } as any
      : undefined,
  } as PoolConfig,
  tableName: "vector_data",
  columns: {
    idColumnName: "id",
    vectorColumnName: "vector",
    contentColumnName: "content",
    metadataColumnName: "metadata",
  },
  distanceStrategy: "cosine" as DistanceStrategy,
});

export const getVectorStore = async (): Promise<PGVectorStore> => {
  if (!vectorStoreInstance) {
    const setting = await Setting.findOne();
    if (!setting || !setting.key) {
      throw new Error("API key is missing or not found");
    }

    const embeddings = new OpenAIEmbeddings({
      apiKey: setting.key,
      model: setting.embeddingModel,
    });

    vectorStoreInstance = await PGVectorStore.initialize(
      embeddings,
      getVectorStoreConfig()
    );
  }
  return vectorStoreInstance;
};
