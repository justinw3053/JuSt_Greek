#!/bin/bash
set -e

ROLE_NAME="AmplifyBackendDeployRole_JuSt_Greek"
APP_ID="d17shqklh4ctgf"
PROFILE="greek-tutor"
REGION="eu-central-1"

echo "Creating IAM Role: $ROLE_NAME..."
# Check if role exists to avoid error, or just let it fail if it exists (set -e will stop it) - simpler to just try create
# If it fails, we might want to continue to attach policy/update app, but for now let's assume clean slate or manual fix if needed.
# Actually to be robust, let's use || true for create-role in case it exists, but we want to ensure it has the right trust policy? 
# For now, let's just run create-role. If it exists, it errors.
aws iam create-role --role-name $ROLE_NAME --assume-role-policy-document file:///home/justin/JuSt_Greek/amplify_role_trust_policy.json --profile $PROFILE || echo "Role may already exist, proceeding..."

echo "Attaching Policy: AdministratorAccess-Amplify..."
aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::aws:policy/AdministratorAccess-Amplify --profile $PROFILE

echo "Updating Amplify App: $APP_ID..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --profile $PROFILE)
ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"

aws amplify update-app --app-id $APP_ID --iam-service-role-arn $ROLE_ARN --region $REGION --profile $PROFILE

echo "Setup Complete!"
