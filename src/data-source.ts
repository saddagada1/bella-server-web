import "reflect-metadata";
import { DataSource } from "typeorm";
import { __prod__ } from "./utils/constants";
import { User } from "./entity/User";
import { Product } from "./entity/Product";
import { Subscription } from "./entity/Subscription";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: !__prod__,
  logging: !__prod__,
  entities: [User, Subscription, Product],
  migrations: [],
  subscribers: [],
});
