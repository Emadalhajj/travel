export const getDatabaseConfig = (env = process.env) => {
  const uri = String(env.DB_URL || env.MONGO_URI || env.MONGODB_URI || "").trim();
  const dbName = String(env.DB_NAME || "").trim();
  if (!uri) throw new Error("MongoDB connection URI is missing");
  if (!dbName) throw new Error("DB_NAME is required; implicit database names are not allowed");
  return { uri, dbName };
};

export const assertExecuteApproved = ({ execute, env = process.env, operation }) => {
  if (!execute) return;
  const { dbName } = getDatabaseConfig(env);
  const confirmation = String(env.DATA_OPERATION_CONFIRM || "").trim();
  if (confirmation !== dbName) {
    throw new Error(`${operation} requires DATA_OPERATION_CONFIRM=${dbName}`);
  }
};
