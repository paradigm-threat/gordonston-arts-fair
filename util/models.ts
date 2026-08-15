import 'reflect-metadata';
import {
    AllowNull,
    AutoIncrement,
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    HasMany,
    Model,
    PrimaryKey,
    Sequelize,
    Table,
    Unique
} from 'sequelize-typescript';
import type {LogType, UserStatus, UserType} from '@types';

// User model with decorators
import pg from 'pg';

@Table({
    tableName: 'user',
    timestamps: true, // Automatically add createdAt and updatedAt columns
    paranoid: true // Add deletedAt column for soft deletes
})
export class UserModel extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number;

    @AllowNull(false)
    @Column(DataType.ENUM('user', 'admin'))
    type!: UserType;

    // @Unique
    // @AllowNull(true)
    // @Column(DataType.STRING(256))
    //   auth_id!: string;

    @Unique
    @AllowNull(true)
    @Column(DataType.STRING(64))
    email!: string;

    @Unique
    @AllowNull(true)
    @Column(DataType.STRING(64))
    phone?: string;

    @AllowNull(true)
    @Column(DataType.STRING(64))
    phone2?: string | null;

    // @AllowNull(true)
    // @Column(DataType.STRING)
    //   password?: string;

    @AllowNull(true)
    @Column(DataType.STRING(64))
    first_name?: string;

    @AllowNull(true)
    @Column(DataType.STRING(64))
    last_name?: string;

    @AllowNull(true)
    @Column(DataType.STRING(64))
    company_name?: string | null;

    @AllowNull(true)
    @Column(DataType.STRING(128))
    address?: string;

    @AllowNull(true)
    @Column(DataType.STRING(32))
    city?: string;

    @AllowNull(true)
    @Column(DataType.STRING(10))
    state?: string;

    @AllowNull(true)
    @Column(DataType.STRING(10))
    zipcode?: string;

    @AllowNull(true)
    @Column(DataType.STRING(256))
    website?: string | null;

    @AllowNull(true)
    @Column(DataType.TEXT)
    description?: string;

    @AllowNull(true)
    @Column(DataType.STRING(128))
    category?: string;

    @AllowNull(false)
    @Column(DataType.ENUM('unregistered', 'registered', 'submitted', 'approved', 'standby', 'declined', 'paid', 'imported'))
    status!: UserStatus;

    @AllowNull(true)
    @Column(DataType.DATE)
    updated_at?: Date | null;

    @HasMany(() => UserLogModel)
    userLogs!: UserLogModel[];

    @HasMany(() => UserFileUploadModel)
    uploads!: UserFileUploadModel[];

    @HasMany(() => UserTransactionModel)
    transactions!: UserTransactionModel[];
}

// export type UserUpdateModel = InferAttributes<UserModel>;

// UserLog model with decorators
@Table({
    tableName: 'user_file_uploads',
    timestamps: true, // Automatically add createdAt and updatedAt columns
    paranoid: true // Add deletedAt column for soft deletes
})
export class UserFileUploadModel extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number;

    @ForeignKey(() => UserModel)
    @AllowNull(false)
    @Column(DataType.INTEGER)
    user_id!: number | null;

    @AllowNull(false)
    @Column(DataType.STRING(256))
    title!: string;

    @AllowNull(true)
    @Column(DataType.TEXT)
    description!: string;

    @AllowNull(false)
    @Column(DataType.STRING(256))
    url!: string;

    @AllowNull(false)
    @Column(DataType.INTEGER)
    width!: number;

    @AllowNull(false)
    @Column(DataType.INTEGER)
    height!: number;

    @Column({type: DataType.BOOLEAN, defaultValue: false})
    feature!: boolean;

    @BelongsTo(() => UserModel)
    user!: UserModel;
}

// UserLog model with decorators
@Table({
    tableName: 'user_log',
    timestamps: true, // Automatically add createdAt and updatedAt columns
    paranoid: true // Add deletedAt column for soft deletes
})
export class UserLogModel extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number;

    @ForeignKey(() => UserModel)
    @AllowNull(false)
    @Column(DataType.INTEGER)
    user_id!: number | null;

    @AllowNull(false)
    @Column(DataType.ENUM('log-in', 'log-in-error', 'log-out', 'register', 'register-error', 'password-reset', 'password-reset-error', 'message', 'message-error', 'status-change', 'error'))
    type!: LogType;

    @AllowNull(false)
    @Column(DataType.STRING(256))
    message!: string;

    @BelongsTo(() => UserModel)
    user!: UserModel;
}

// Transaction model with decorators
@Table({
    tableName: 'transactions',
    timestamps: true
})
export class UserTransactionModel extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number;

    @ForeignKey(() => UserModel)
    @AllowNull(true)
    @Column(DataType.INTEGER)
    user_id!: number | null;

    @AllowNull(true)
    @Column(DataType.STRING(256))
    full_name!: string | null;

    @AllowNull(true)
    @Column(DataType.STRING(256))
    email!: string | null;

    @AllowNull(true)
    @Column(DataType.STRING(256))
    phone!: string | null;

    @AllowNull(false)
    @Column(DataType.ENUM('charge.succeeded', 'charge.refunded'))
    type!: 'charge.succeeded' | 'charge.refunded';

    @AllowNull(true)
    @Column(DataType.DECIMAL(10, 2))
    amount!: number | null;

    @AllowNull(false)
    @Column(DataType.STRING(256))
    provider_id!: string;

    @AllowNull(false)
    @Column(DataType.JSON)
    content!: object;

    @BelongsTo(() => UserModel)
    user!: UserModel;
}

// TwoFactorCode model with decorators
@Table({
    tableName: '2fa_codes',
    timestamps: true, // Automatically add createdAt and updatedAt columns
    paranoid: true // Add deletedAt column for soft deletes
})
export class TwoFactorCodeModel extends Model {
    @PrimaryKey
    @AllowNull(false)
    @Column(DataType.ENUM('email', 'phone'))
    type!: 'email' | 'phone';

    @PrimaryKey
    @AllowNull(false)
    @Column(DataType.STRING(64))
    receiver!: string;

    @PrimaryKey
    @AllowNull(false)
    @Column(DataType.INTEGER)
    code!: number;

    @AllowNull(false)
    @Column(DataType.DATE)
    expiration!: Date;
}

// Initialize database connection
export async function initDatabase() {
    try {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error('DATABASE_URL environment variable is required');
        }

// Database connection with sequelize-typescript
        const sequelize = new Sequelize(databaseUrl, {
            dialect: 'postgres',
            dialectModule: pg,
            logging: false, // Set to console.log to see SQL queries
            models: [UserModel,
                UserLogModel,
                UserFileUploadModel,
                UserTransactionModel,
                TwoFactorCodeModel]
        });

        // await sequelize.authenticate();
        await sequelize.sync({alter: false, force: false, logging: true});
        console.log('Database connection established successfully.');
        return sequelize;
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }
}

