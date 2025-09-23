# Database Backup & Restore Documentation

## Overview

The Greenhouse Management System includes comprehensive backup and restore functionality to protect against data loss and enable data migration. The system provides automated scripts that can backup all database data to JSON format and restore it when needed.

## Features

- **Complete Data Backup**: Backs up all tables including users, customers, tunnels, schedules, inventory, and tasks
- **Relationship Preservation**: Maintains all foreign key relationships and data integrity
- **Timestamped Backups**: Each backup file includes a timestamp for easy identification
- **Comprehensive Logging**: Detailed console output showing progress and statistics
- **Error Handling**: Robust error handling with clear error messages
- **Data Validation**: Validates backup files before restoration
- **Transaction Safety**: Uses database transactions to ensure data consistency

## Quick Start

### Creating a Backup

```bash
# Using npm
npm run backup

# Using yarn
yarn backup

# Using pnpm
pnpm backup

# Direct execution
node scripts/backup-data.js
```

### Restoring from Backup

```bash
# Using npm
npm run restore ./backups/backup-2024-01-01T10-00-00-000Z.json

# Using yarn
yarn restore ./backups/backup-2024-01-01T10-00-00-000Z.json

# Using pnpm
pnpm restore ./backups/backup-2024-01-01T10-00-00-000Z.json

# Direct execution
node scripts/restore-data.js ./backups/backup-2024-01-01T10-00-00-000Z.json
```

## Backup Process

### What Gets Backed Up

The backup process includes all data from the following tables:

1. **Authentication Data**
   - Users (with password hashes)
   - Accounts (OAuth/social login data)
   - Sessions
   - Verification tokens

2. **Core Business Data**
   - Customers (with all profile information)
   - Tunnels (including the new clientId field)
   - Schedules (fertilizer and task schedules)

3. **Inventory Data**
   - Items (fertilizers, tools, etc.)
   - Main inventory
   - Customer-specific inventories

4. **Task Management**
   - Tasks and their assignments

### Backup File Structure

```json
{
  "metadata": {
    "timestamp": "2024-01-01T10:00:00.000Z",
    "version": "1.0.0",
    "description": "Greenhouse Management System Database Backup",
    "statistics": {
      "users": 5,
      "customers": 10,
      "tunnels": 25,
      "schedules": 100,
      "items": 50,
      "tasks": 75
    }
  },
  "data": {
    "users": [...],
    "customers": [...],
    "tunnels": [...],
    // ... other tables
  }
}
```

### Backup Location

Backups are stored in the `backups/` directory in your project root:

```
greenhousev2/
├── backups/
│   ├── backup-2024-01-01T10-00-00-000Z.json
│   ├── backup-2024-01-02T15-30-00-000Z.json
│   └── ...
├── scripts/
│   ├── backup-data.js
│   └── restore-data.js
└── ...
```

## Restore Process

### Prerequisites

- Ensure your database is accessible
- Have a valid backup file
- **Warning**: Restore will delete all existing data

### Restore Steps

1. **Validation**: The script validates the backup file format
2. **Data Clearing**: All existing data is deleted (in dependency order)
3. **Data Restoration**: Data is restored in the correct dependency order
4. **Verification**: Final count verification ensures data integrity

### Dependency Order

The restore process follows this order to maintain referential integrity:

1. Users (base authentication)
2. Accounts
3. Sessions
4. Verification Tokens
5. Items (needed for inventory references)
6. Customers
7. Tunnels
8. Main Inventory
9. Customer Inventories
10. Tasks
11. Schedules (last due to multiple dependencies)

## Security Considerations

### Password Handling

- User passwords are backed up as hashed values
- No plain text passwords are stored in backups
- OAuth tokens are included for social login restoration

### Sensitive Data

- API keys and secrets are not included in backups
- Environment variables must be configured separately
- Consider encrypting backup files for additional security

### Access Control

- Backup/restore operations should be restricted to administrators
- Store backup files in secure locations
- Consider automated backup rotation policies

## Best Practices

### Regular Backups

```bash
# Create a cron job for daily backups
0 2 * * * cd /path/to/greenhousev2 && npm run backup
```

### Backup Verification

Always verify backup integrity:

```bash
# Check backup file size and structure
ls -la backups/
head -n 20 backups/latest-backup.json
```

### Testing Restores

Regularly test restore procedures on development environments:

```bash
# Test restore on development database
NODE_ENV=development npm run restore ./backups/test-backup.json
```

### Backup Retention

Implement a backup retention policy:

```bash
# Keep only last 30 days of backups
find backups/ -name "backup-*.json" -mtime +30 -delete
```

## Troubleshooting

### Common Issues

#### 1. Permission Errors

```bash
Error: EACCES: permission denied, mkdir 'backups'
```

**Solution**: Ensure write permissions for the backups directory:

```bash
mkdir -p backups
chmod 755 backups
```

#### 2. Database Connection Issues

```bash
Error: Can't reach database server
```

**Solution**: Check your DATABASE_URL environment variable and database connectivity.

#### 3. Invalid Backup File

```bash
Error: Invalid backup file format
```

**Solution**: Ensure the backup file is valid JSON and contains required metadata and data sections.

#### 4. Foreign Key Constraint Errors

```bash
Error: Foreign key constraint fails
```

**Solution**: This usually indicates corrupted backup data. Try using a different backup file.

### Debug Mode

For detailed debugging, modify the scripts to include more verbose logging:

```javascript
// Add to backup-data.js or restore-data.js
console.log('Debug: Processing table:', tableName);
console.log('Debug: Record count:', records.length);
```

## Advanced Usage

### Programmatic Usage

You can use the backup/restore functions programmatically:

```javascript
const { createBackup } = require('./scripts/backup-data.js');
const { restoreFromBackup } = require('./scripts/restore-data.js');

// Create backup
const backupFile = await createBackup();
console.log('Backup created:', backupFile);

// Restore from backup
await restoreFromBackup('./backups/my-backup.json');
```

### Selective Backup/Restore

For advanced users, you can modify the scripts to backup/restore specific tables only:

```javascript
// Backup only customer and tunnel data
const backupData = {
  customers: await prisma.customer.findMany(),
  tunnels: await prisma.tunnel.findMany()
};
```

### Integration with CI/CD

Include backup creation in your deployment pipeline:

```yaml
# GitHub Actions example
- name: Create Backup
  run: npm run backup
  
- name: Upload Backup
  uses: actions/upload-artifact@v2
  with:
    name: database-backup
    path: backups/
```

## Support

If you encounter issues with the backup/restore functionality:

1. Check the console output for detailed error messages
2. Verify your database connection and permissions
3. Ensure backup files are not corrupted
4. Test with a smaller dataset first
5. Contact your system administrator for database-specific issues

## Version History

- **v1.0.0**: Initial backup/restore implementation
  - Complete database backup
  - Transaction-safe restore
  - Comprehensive error handling
  - CLI interface
