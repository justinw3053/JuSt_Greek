#!/bin/bash
set -e

APP_ID="d17shqklh4ctgf"
BRANCH="main"
PROFILE="greek-tutor"
REGION="eu-central-1"

echo "Triggering Amplify Deployment for App: $APP_ID, Branch: $BRANCH..."
JOB_ID=$(aws amplify start-job --app-id $APP_ID --branch-name $BRANCH --job-type RELEASE --region $REGION --profile $PROFILE --query 'jobSummary.jobId' --output text)

echo "Deployment triggered successfully!"
echo "Job ID: $JOB_ID"
echo "Monitor status with: aws amplify get-job --app-id $APP_ID --branch-name $BRANCH --job-id $JOB_ID --region $REGION --profile $PROFILE"
