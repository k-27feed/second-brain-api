# Second Brain Project

A comprehensive note-taking and personal knowledge management system with voice capabilities.

## Project Structure

This project is organized into three main components:

### 1. Mobile App (Frontend)
- **Repository**: [second-brain-app](https://github.com/k-27feed/second-brain-app)
- **Technology**: Expo/React Native
- **Directory**: `/Second/second-brain-app`
- **Purpose**: Mobile application for users to create, browse, and manage their notes and knowledge base.

### 2. Backend API
- **Repository**: [second-brain-api](https://github.com/k-27feed/second-brain-api)
- **Technology**: Node.js/Express with TypeScript
- **Directory**: `/Second/second-brain-api`
- **Purpose**: RESTful API providing authentication, data storage, and integration with third-party services.

### 3. Infrastructure
- **Repository**: [second-brain-infra](https://github.com/k-27feed/second-brain-infra)
- **Technology**: Terraform, AWS
- **Directory**: `/Second/second-brain-infra`
- **Purpose**: Infrastructure as Code for deploying and managing cloud resources.

## Current Status

- **AWS CLI**: Configured for infrastructure management
- **GitHub**: Repositories created with CI/CD pipelines
- **Infrastructure**: Terraform configuration set up for networking, database, and API
- **API**: Basic skeleton implemented with Express and TypeScript

## Development Setup

1. **Clone the repositories**:
   ```bash
   git clone https://github.com/k-27feed/second-brain-app.git
   git clone https://github.com/k-27feed/second-brain-api.git
   git clone https://github.com/k-27feed/second-brain-infra.git
   ```

2. **Set up AWS credentials**:
   ```bash
   aws configure
   ```

3. **Set up environment variables**:
   - Copy `.env.example` to `.env` in each project
   - Fill in the required values

4. **Install dependencies**:
   ```bash
   # For the API
   cd second-brain-api
   npm install

   # For the App
   cd ../second-brain-app
   npm install
   ```

## Next Steps

- Configure GitHub Secrets for CI/CD
- Initialize and apply Terraform configuration
- Complete API implementation
- Set up monitoring and logging
- Develop frontend features

## Contribution Guidelines

Please see the [Rules](.cursor/rules/rules-main.mdc) file for contribution guidelines and coding standards. 