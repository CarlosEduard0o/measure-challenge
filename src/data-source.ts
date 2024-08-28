import "reflect-metadata"
import { DataSource } from "typeorm"
import { Customer } from "./entity/Customer"
import { Measure } from "./entity/Measure"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "postgres",
    database: "project_database",
    synchronize: true,
    logging: false,
    entities: [Customer, Measure],
    migrations: [/*...*/],
    migrationsTableName: "migrations",
    subscribers: [],
})
