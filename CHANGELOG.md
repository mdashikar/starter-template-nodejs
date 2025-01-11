# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.2] - 2024-06-23

### Fixed
- Updated SMTP credentials to resolve connection issues

### Features
- Implemented automatic connection retry logic for the database to improve resilience and handle transient failures gracefully.

### Changed
- Simplified JWT configuration. Removed expiration settings for access and refresh tokens. Consolidated the secret keys into a single JWT_SECRET key for ease of management and reduced complexity.



## [1.0.0] - 2024-06-23
### Added
- Added changelog.
- Initial release

### Changed
- Removed YARN, added NPM.


