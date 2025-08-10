# Family Pane Security Guidelines

## Files That Should Never Be Committed

### ⚠️ Critical Security Files

**Never commit these files to the repository:**

1. **Environment Variables**
   - `.env` (actual environment file with secrets)
   - `.env.local`
   - `.env.production`
   - Any file containing `GOOGLE_CLIENT_SECRET` or API keys

2. **API Credentials**
   - `config/credentials.json` (Google OAuth credentials)
   - `config/client_secret.json`
   - `config/service-account-key.json`
   - Any file containing OAuth tokens or refresh tokens

3. **SSL Certificates and Keys**
   - `*.pem` files
   - `*.key` files  
   - `*.crt` files
   - `*.p12` files

4. **Database Files**
   - `*.db` files (SQLite databases with family data)
   - `config/pane.db`
   - Any database containing personal family information

## What IS Safe to Commit

### ✅ Template and Example Files

1. **Environment Templates**
   - `.env.example` (with placeholder values)
   - Configuration templates without actual secrets

2. **Documentation**
   - Setup instructions
   - API documentation
   - Architecture diagrams

3. **Source Code**
   - Application code
   - Tests
   - Build configurations
   - Static assets (CSS, JS, images)

## Security Measures in Place

### Git Configuration

1. **`.gitignore`**
   - Comprehensive patterns for sensitive files
   - OS-specific exclusions
   - IDE and build artifact exclusions
   - Family Pane specific security patterns

2. **`.gitattributes`**
   - Marks credential files as binary (prevents text processing)
   - Excludes sensitive files from diffs
   - Proper line ending handling

3. **`.dockerignore`**
   - Excludes credentials from Docker builds
   - Separates development files from production images

### Application Security

1. **Environment Variable Validation**
   - Required variables checked at startup
   - Placeholder detection in verification script

2. **Database Security**
   - In-memory databases for testing
   - Production database files excluded from version control

3. **API Security**
   - Rate limiting implemented
   - Security headers via Helmet
   - Input validation and sanitization

## Setup Security Checklist

When setting up the Family Pane:

- [ ] Copy `.env.example` to `.env` and configure with real values
- [ ] Place Google credentials in `config/credentials.json` (not tracked)
- [ ] Verify `.gitignore` patterns match your sensitive files
- [ ] Run `npm run setup:verify` to check security patterns
- [ ] Never commit actual database files with family data
- [ ] Use environment variables for all secrets in production

## What to Do If Secrets Are Accidentally Committed

If sensitive information is accidentally committed:

1. **Immediate Actions**
   - Rotate all exposed credentials immediately
   - Change all API keys and OAuth secrets
   - Generate new SSL certificates if exposed

2. **Git History Cleanup**
   - Use `git filter-branch` or `git filter-repo` to remove from history
   - Force push to rewrite history (coordinate with team)
   - Consider the repository compromised and migrate if necessary

3. **Prevention**
   - Add pre-commit hooks to scan for secrets
   - Use tools like `git-secrets` or `truffleHog`
   - Enable GitHub secret scanning if using GitHub

## Production Deployment Security

1. **Environment Variables**
   - Use secure environment variable injection
   - Never include secrets in Docker images
   - Use secret management systems (AWS Secrets Manager, etc.)

2. **Database Security**
   - Use volume mounts for database files
   - Implement proper backup encryption
   - Restrict database file permissions

3. **Network Security**
   - Use HTTPS in production
   - Implement proper firewall rules
   - Restrict API access to necessary endpoints

## Monitoring and Auditing

1. **Regular Security Checks**
   - Run `npm audit` regularly
   - Monitor for dependency vulnerabilities
   - Check for exposed credentials in logs

2. **Access Control**
   - Limit repository access to necessary team members
   - Use branch protection rules
   - Require code reviews for sensitive changes

3. **Backup Security**
   - Encrypt database backups
   - Secure backup storage locations
   - Test backup restoration procedures

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT create a public issue**
2. Contact the maintainers privately
3. Provide detailed information about the vulnerability
4. Allow time for the issue to be addressed before disclosure

Remember: Security is everyone's responsibility. When in doubt, err on the side of caution and don't commit the file.