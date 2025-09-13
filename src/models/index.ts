import { Sequelize } from "sequelize";
import Email from "./Email";
import User from "./User";
// import Tenant from "./Tenant";

// recebe a instância do sequelize
export function initModels(sequelize: Sequelize) {
  const models = {
    User: User.initModel(sequelize),
    Email: Email.initModel(sequelize),
    // Tenant: Tenant.initModel(sequelize),
  };

  // associações
  Object.values(models).forEach((model: any) => {
    if (typeof model.associate === "function") {
      model.associate(models);
    }
  });

  return models;
}
