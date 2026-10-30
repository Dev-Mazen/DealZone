BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030194444_AddConcurrencyUniqueIndexes'
)
BEGIN
    DROP INDEX [IX_Deals_RfqId] ON [Deals];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030194444_AddConcurrencyUniqueIndexes'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_Offers_RfqId] ON [Offers] ([RfqId]) WHERE [Status] = 2');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030194444_AddConcurrencyUniqueIndexes'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_Deals_RfqId] ON [Deals] ([RfqId]) WHERE [RfqId] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030194444_AddConcurrencyUniqueIndexes'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261030194444_AddConcurrencyUniqueIndexes', N'10.0.3');
END;

COMMIT;
GO

