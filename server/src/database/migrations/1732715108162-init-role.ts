import { MigrationInterface, QueryRunner } from "typeorm";

export class InitRole1732715108162 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "role" (rolename, created_by, updated_by)
            VALUES
            ('supperadmin', 'system', 'system'),
            ('admin', 'system', 'system'),
            ('user', 'system', 'system');
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            (
                DELETE FROM "role" WHERE rolename IN ('supperadmin','admin','user');
            )
            `);
    }
}
