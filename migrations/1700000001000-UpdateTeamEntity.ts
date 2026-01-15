import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class UpdateTeamEntity1700000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const teamsTable = await queryRunner.getTable('teams');
    const existingColumns = teamsTable?.columns.map((col) => col.name) || [];

    // Add new columns only if they don't exist
    if (!existingColumns.includes('category')) {
      await queryRunner.addColumn(
        'teams',
        new TableColumn({
          name: 'category',
          type: 'varchar',
          length: '50',
          isNullable: false,
          default: "''",
        })
      );
    }

    if (!existingColumns.includes('winRate')) {
      await queryRunner.addColumn(
        'teams',
        new TableColumn({
          name: 'winRate',
          type: 'float',
          default: 0,
        })
      );
    }

    if (!existingColumns.includes('matchHistory')) {
      await queryRunner.addColumn(
        'teams',
        new TableColumn({
          name: 'matchHistory',
          type: 'text',
          isNullable: true,
        })
      );
    }

    // First add headCoachId as nullable
    if (!existingColumns.includes('headCoachId')) {
      await queryRunner.addColumn(
        'teams',
        new TableColumn({
          name: 'headCoachId',
          type: 'uuid',
          isNullable: true, // Start as nullable to allow migration
        })
      );
    }

    // Note: You may need to populate headCoachId for existing teams before making it non-nullable
    // For now, we'll keep it nullable to allow the migration to proceed

    if (!existingColumns.includes('subCoachCount')) {
      await queryRunner.addColumn(
        'teams',
        new TableColumn({
          name: 'subCoachCount',
          type: 'int',
          default: 0,
        })
      );
    }

    // Update name column length if needed (only if it's currently 255)
    const nameColumn = teamsTable?.findColumnByName('name');
    if (nameColumn && nameColumn.length === '255') {
      await queryRunner.query(`
        ALTER TABLE teams 
        ALTER COLUMN name TYPE varchar(100)
      `);
    }

    // Create foreign key for headCoachId -> users.id (only if it doesn't exist)
    const hasHeadCoachFK = teamsTable?.foreignKeys.some(
      (fk) => fk.columnNames.indexOf('headCoachId') !== -1 && fk.referencedTableName === 'users'
    );
    
    if (!hasHeadCoachFK && existingColumns.includes('headCoachId')) {
      await queryRunner.createForeignKey(
        'teams',
        new TableForeignKey({
          columnNames: ['headCoachId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        })
      );
    }

    // Create index on headCoachId (only if it doesn't exist)
    const hasHeadCoachIndex = teamsTable?.indices.some(
      (idx) => idx.name === 'IDX_teams_headCoachId'
    );
    
    if (!hasHeadCoachIndex && existingColumns.includes('headCoachId')) {
      await queryRunner.createIndex(
        'teams',
        new TableIndex({
          name: 'IDX_teams_headCoachId',
          columnNames: ['headCoachId'],
        })
      );
    }

    // Remove old columns (optional - comment out if you want to keep them for migration safety)
    // await queryRunner.dropColumn('teams', 'shortName');
    // await queryRunner.dropColumn('teams', 'logoUrl');
    // await queryRunner.dropColumn('teams', 'description');
    // await queryRunner.dropColumn('teams', 'location');
    // await queryRunner.dropColumn('teams', 'coach');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key and index
    const teamsTable = await queryRunner.getTable('teams');
    if (teamsTable) {
      const foreignKey = teamsTable.foreignKeys.find((fk) => fk.columnNames.indexOf('headCoachId') !== -1);
      if (foreignKey) {
        await queryRunner.dropForeignKey('teams', foreignKey);
      }
      const index = teamsTable.indices.find((idx) => idx.name === 'IDX_teams_headCoachId');
      if (index) {
        await queryRunner.dropIndex('teams', index);
      }
    }

    // Drop new columns
    await queryRunner.dropColumn('teams', 'subCoachCount');
    await queryRunner.dropColumn('teams', 'headCoachId');
    await queryRunner.dropColumn('teams', 'matchHistory');
    await queryRunner.dropColumn('teams', 'winRate');
    await queryRunner.dropColumn('teams', 'category');

    // Revert name column length
    await queryRunner.query(`
      ALTER TABLE teams 
      ALTER COLUMN name TYPE varchar(255)
    `);
  }
}

