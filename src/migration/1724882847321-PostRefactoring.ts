import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class PostRefactoring1724882847321 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.createTable(
            new Table({
                name: 'customer',
                columns: [
                    {
                        name: 'customerCode',
                        type: 'varchar',
                        length: '255',
                        isPrimary: true,
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    }
                ]
            })
        );

        await queryRunner.createTable(
            new Table({
                name: 'measure',
                columns: [
                    {
                        name: 'measureUuid',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'customerCode',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'measureDatetime',
                        type: 'timestamp',
                    },
                    {
                        name: 'measureType',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'measureValue',
                        type: 'int',
                    },
                    {
                        name: 'hasConfirmed',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'imageUrl',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    }
                ],
                uniques: [
                    {
                        name: 'UK_measure',
                        columnNames: ['customerCode', 'measureDatetime', 'measureType']
                    }
                ],
                foreignKeys: [
                    {
                        name: 'FK_customer',
                        columnNames: ['customerCode'],
                        referencedTableName: 'customer',
                        referencedColumnNames: ['customerCode']
                    }
                ]
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('customer');
        await queryRunner.dropTable('measure');
    }

}
