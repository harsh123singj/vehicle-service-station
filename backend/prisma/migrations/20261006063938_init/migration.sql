-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERATOR', 'SUPERVISOR');

-- CreateEnum
CREATE TYPE "JourneyStatus" AS ENUM ('ENTERED', 'IDENTIFIED', 'VERIFYING', 'ELIGIBLE', 'NOT_ELIGIBLE', 'HOLD', 'QUEUED', 'BAY_ASSIGNED', 'SERVICE_IN_PROGRESS', 'SERVICE_COMPLETED', 'EXITED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JourneyEventType" AS ENUM ('VEHICLE_ENTERED', 'VEHICLE_IDENTIFIED', 'VERIFICATION_STARTED', 'VERIFICATION_COMPLETED', 'ELIGIBILITY_DECIDED', 'VEHICLE_QUEUED', 'BAY_ASSIGNED', 'SERVICE_STARTED', 'SERVICE_COMPLETED', 'VEHICLE_EXITED', 'JOURNEY_CANCELLED', 'ALERT_CREATED', 'ALERT_RESOLVED', 'SYSTEM_ERROR');

-- CreateEnum
CREATE TYPE "EventSource" AS ENUM ('CAMERA', 'OPERATOR', 'SYSTEM', 'SIMULATOR', 'API');

-- CreateEnum
CREATE TYPE "CameraStatus" AS ENUM ('ONLINE', 'OFFLINE', 'DEGRADED');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('REGISTRATION', 'COMPLIANCE', 'INSURANCE', 'FITNESS');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'TIMEOUT', 'ERROR');

-- CreateEnum
CREATE TYPE "EligibilityStatus" AS ENUM ('ELIGIBLE', 'NOT_ELIGIBLE', 'HOLD');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('WAITING', 'CALLED', 'ASSIGNED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BayStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERATOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Camera" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "cameraCode" TEXT NOT NULL,
    "location" TEXT,
    "status" "CameraStatus" NOT NULL DEFAULT 'ONLINE',
    "streamUrl" TEXT,
    "lastHeartbeatAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Camera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" SERIAL NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "vehicleType" TEXT,
    "make" TEXT,
    "model" TEXT,
    "ownerName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journey" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "cameraId" INTEGER,
    "currentStatus" "JourneyStatus" NOT NULL DEFAULT 'ENTERED',
    "eligibilityStatus" "EligibilityStatus",
    "entryTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "identificationTime" TIMESTAMP(3),
    "verificationTime" TIMESTAMP(3),
    "queueTime" TIMESTAMP(3),
    "serviceStartTime" TIMESTAMP(3),
    "serviceEndTime" TIMESTAMP(3),
    "exitTime" TIMESTAMP(3),
    "holdReason" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Journey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyEvent" (
    "id" SERIAL NOT NULL,
    "journeyId" INTEGER NOT NULL,
    "cameraId" INTEGER,
    "eventType" "JourneyEventType" NOT NULL,
    "source" "EventSource" NOT NULL,
    "previousStatus" "JourneyStatus",
    "newStatus" "JourneyStatus",
    "eventTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "externalEventId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JourneyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationResult" (
    "id" SERIAL NOT NULL,
    "journeyId" INTEGER NOT NULL,
    "type" "VerificationType" NOT NULL,
    "status" "VerificationStatus" NOT NULL,
    "referenceNumber" TEXT,
    "responseData" JSONB,
    "checkedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Queue" (
    "id" SERIAL NOT NULL,
    "journeyId" INTEGER NOT NULL,
    "siteId" INTEGER NOT NULL,
    "position" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" "QueueStatus" NOT NULL DEFAULT 'WAITING',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bay" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "bayNumber" TEXT NOT NULL,
    "name" TEXT,
    "status" "BayStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceSession" (
    "id" SERIAL NOT NULL,
    "journeyId" INTEGER NOT NULL,
    "bayId" INTEGER NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "serviceType" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "journeyId" INTEGER,
    "severity" "AlertSeverity" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "siteId" INTEGER,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Site_code_key" ON "Site"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Camera_cameraCode_key" ON "Camera"("cameraCode");

-- CreateIndex
CREATE INDEX "Camera_siteId_idx" ON "Camera"("siteId");

-- CreateIndex
CREATE INDEX "Camera_status_idx" ON "Camera"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_registrationNumber_key" ON "Vehicle"("registrationNumber");

-- CreateIndex
CREATE INDEX "Vehicle_registrationNumber_idx" ON "Vehicle"("registrationNumber");

-- CreateIndex
CREATE INDEX "Journey_siteId_currentStatus_idx" ON "Journey"("siteId", "currentStatus");

-- CreateIndex
CREATE INDEX "Journey_vehicleId_idx" ON "Journey"("vehicleId");

-- CreateIndex
CREATE INDEX "Journey_entryTime_idx" ON "Journey"("entryTime");

-- CreateIndex
CREATE INDEX "Journey_eligibilityStatus_idx" ON "Journey"("eligibilityStatus");

-- CreateIndex
CREATE INDEX "JourneyEvent_journeyId_eventTime_idx" ON "JourneyEvent"("journeyId", "eventTime");

-- CreateIndex
CREATE INDEX "JourneyEvent_eventType_idx" ON "JourneyEvent"("eventType");

-- CreateIndex
CREATE INDEX "JourneyEvent_source_idx" ON "JourneyEvent"("source");

-- CreateIndex
CREATE INDEX "JourneyEvent_cameraId_idx" ON "JourneyEvent"("cameraId");

-- CreateIndex
CREATE UNIQUE INDEX "JourneyEvent_cameraId_externalEventId_key" ON "JourneyEvent"("cameraId", "externalEventId");

-- CreateIndex
CREATE INDEX "VerificationResult_journeyId_idx" ON "VerificationResult"("journeyId");

-- CreateIndex
CREATE INDEX "VerificationResult_type_idx" ON "VerificationResult"("type");

-- CreateIndex
CREATE INDEX "VerificationResult_status_idx" ON "VerificationResult"("status");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationResult_journeyId_type_key" ON "VerificationResult"("journeyId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Queue_journeyId_key" ON "Queue"("journeyId");

-- CreateIndex
CREATE INDEX "Queue_siteId_status_idx" ON "Queue"("siteId", "status");

-- CreateIndex
CREATE INDEX "Queue_siteId_position_idx" ON "Queue"("siteId", "position");

-- CreateIndex
CREATE INDEX "Queue_priority_idx" ON "Queue"("priority");

-- CreateIndex
CREATE INDEX "Bay_siteId_status_idx" ON "Bay"("siteId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Bay_siteId_bayNumber_key" ON "Bay"("siteId", "bayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceSession_journeyId_key" ON "ServiceSession"("journeyId");

-- CreateIndex
CREATE INDEX "ServiceSession_bayId_idx" ON "ServiceSession"("bayId");

-- CreateIndex
CREATE INDEX "ServiceSession_status_idx" ON "ServiceSession"("status");

-- CreateIndex
CREATE INDEX "Alert_siteId_status_idx" ON "Alert"("siteId", "status");

-- CreateIndex
CREATE INDEX "Alert_journeyId_idx" ON "Alert"("journeyId");

-- CreateIndex
CREATE INDEX "Alert_severity_idx" ON "Alert"("severity");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_siteId_idx" ON "AuditLog"("siteId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Camera" ADD CONSTRAINT "Camera_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journey" ADD CONSTRAINT "Journey_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journey" ADD CONSTRAINT "Journey_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journey" ADD CONSTRAINT "Journey_cameraId_fkey" FOREIGN KEY ("cameraId") REFERENCES "Camera"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyEvent" ADD CONSTRAINT "JourneyEvent_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyEvent" ADD CONSTRAINT "JourneyEvent_cameraId_fkey" FOREIGN KEY ("cameraId") REFERENCES "Camera"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationResult" ADD CONSTRAINT "VerificationResult_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Queue" ADD CONSTRAINT "Queue_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Queue" ADD CONSTRAINT "Queue_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bay" ADD CONSTRAINT "Bay_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSession" ADD CONSTRAINT "ServiceSession_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSession" ADD CONSTRAINT "ServiceSession_bayId_fkey" FOREIGN KEY ("bayId") REFERENCES "Bay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;
