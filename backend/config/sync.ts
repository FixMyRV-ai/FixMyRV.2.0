import sequelize from "../models/index";

const syncDatabase = async () => {
  try {
    await sequelize.sync({ logging: false, alter: false }); // Sync all models with the database
    console.log("All models were synchronized successfully.");
  } catch (error) {
    console.error("Error syncing database:", error);
  }
};

export default syncDatabase;
