import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateTeamPlayerTaskTables1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for task status
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE tasks_status_enum AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create teams table
    await queryRunner.createTable(
      new Table({
        name: 'teams',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'shortName',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'logoUrl',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'location',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'coach',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
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
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create players table
    await queryRunner.createTable(
      new Table({
        name: 'players',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'profilePictureUrl',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'firstName',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'lastName',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'dateOfBirth',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'teamId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'position',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'jerseyNumber',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'heightCm',
            type: 'float',
            isNullable: true,
          },
          {
            name: 'weightKg',
            type: 'float',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'address',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'emergencyContactName',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'emergencyPhone',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
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
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create foreign key for players.teamId -> teams.id
    await queryRunner.createForeignKey(
      'players',
      new TableForeignKey({
        columnNames: ['teamId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'teams',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      })
    );

    // Create index on players.teamId
    await queryRunner.createIndex(
      'players',
      new TableIndex({
        name: 'IDX_players_teamId',
        columnNames: ['teamId'],
      })
    );

    // Create index on players.email
    await queryRunner.createIndex(
      'players',
      new TableIndex({
        name: 'IDX_players_email',
        columnNames: ['email'],
      })
    );

    // Create tasks table
    await queryRunner.createTable(
      new Table({
        name: 'tasks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'playerId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'tasks_status_enum',
            default: "'pending'",
          },
          {
            name: 'dueDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'completedAt',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'priority',
            type: 'int',
            default: 0,
          },
          {
            name: 'notes',
            type: 'text',
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
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create foreign key for tasks.playerId -> players.id
    await queryRunner.createForeignKey(
      'tasks',
      new TableForeignKey({
        columnNames: ['playerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'players',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      })
    );

    // Create index on tasks.playerId
    await queryRunner.createIndex(
      'tasks',
      new TableIndex({
        name: 'IDX_tasks_playerId',
        columnNames: ['playerId'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys and indexes first
    const tasksTable = await queryRunner.getTable('tasks');
    if (tasksTable) {
      const foreignKey = tasksTable.foreignKeys.find((fk) => fk.columnNames.indexOf('playerId') !== -1);
      if (foreignKey) {
        await queryRunner.dropForeignKey('tasks', foreignKey);
      }
      const index = tasksTable.indices.find((idx) => idx.name === 'IDX_tasks_playerId');
      if (index) {
        await queryRunner.dropIndex('tasks', index);
      }
    }

    const playersTable = await queryRunner.getTable('players');
    if (playersTable) {
      const foreignKey = playersTable.foreignKeys.find((fk) => fk.columnNames.indexOf('teamId') !== -1);
      if (foreignKey) {
        await queryRunner.dropForeignKey('players', foreignKey);
      }
      const teamIdIndex = playersTable.indices.find((idx) => idx.name === 'IDX_players_teamId');
      if (teamIdIndex) {
        await queryRunner.dropIndex('players', teamIdIndex);
      }
      const emailIndex = playersTable.indices.find((idx) => idx.name === 'IDX_players_email');
      if (emailIndex) {
        await queryRunner.dropIndex('players', emailIndex);
      }
    }

    // Drop tables
    await queryRunner.dropTable('tasks', true);
    await queryRunner.dropTable('players', true);
    await queryRunner.dropTable('teams', true);

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS tasks_status_enum`);
  }
}

