# Scenario 2b — Full AWS Architecture (All-in AWS ca-central-1, Zero Vercel)

> **Enterprise Single-Cloud Variant:** Next.js SSR on AWS ECS Fargate or AWS Amplify Gen 2 · NestJS API on ECS Fargate · RDS PostgreSQL Multi-AZ + PostGIS · ElastiCache Redis · AWS S3 + CloudFront CDN · AWS WAF & KMS
> Alternative with Vercel UI: [01b-custom-backend-vercel-aws.md](./01b-custom-backend-vercel-aws.md)

---

## 1. Summary & when to choose

This is the **maximum enterprise compliance and reliability option**. All compute (Next.js SSR and NestJS API), database, caching, and storage are unified within a single AWS Virtual Private Cloud (VPC) in **AWS Canada (Central) `ca-central-1`** (Montreal). No data or compute passes through third-party platforms like Vercel or external container PaaS providers.

**Choose when:**
- The platform is positioned for enterprise dealership groups, financial institutions, or institutional investors who mandate strict SOC 2 Type II, ISO 27001, and formal vendor audits.
- The client strictly forbids multi-vendor data transfers or requires all data in transit and at rest to remain under a single AWS Business Associate Agreement / Canadian DPA.
- You require automated Multi-AZ failover (< 60s), guaranteed 99.95% SLA, and AWS EventBridge Scheduler for bulletproof auction timers.

**Avoid when:**
- The MVP timeline is under 12 weeks.
- The team does not have a dedicated Cloud/DevOps engineer proficient in Terraform, AWS CDK, or SST v3.
- The initial budget cannot support AWS enterprise minimums ($450–$1,200/month).

---

## 2. Architecture

```mermaid
flowchart TD
  subgraph Internet["Public Internet"]
    Client[Browser / Mobile PWA]
  end

  subgraph AWS["AWS Region: ca-central-1 (Montreal, Canada)"]
    CF[Amazon CloudFront CDN<br/>Edge Caching & SSL Termination]
    WAF[AWS WAF<br/>DDoS Mitigation & OWASP Rules]

    subgraph VPC["AutoNexa Production VPC (Multi-AZ: ca-central-1a / 1b)"]
      ALB[Application Load Balancer<br/>Internal Routing / SSL]

      subgraph PublicSubnets["Public Subnets (Multi-AZ)"]
        NAT[NAT Gateways (AZ-a / AZ-b)]
      end

      subgraph PrivateAppSubnets["Private Compute Subnets (Multi-AZ)"]
        subgraph ECSCluster["Amazon ECS (AWS Fargate)"]
          WebTasks[Next.js SSR Tasks<br/>Autoscaling 2–10 Tasks]
          APITasks[NestJS API Tasks<br/>Autoscaling 2–10 Tasks<br/>REST + SSE Telemetry]
          WorkerTasks[BullMQ Background Workers<br/>Autoscaling Tasks]
        end
      end

      subgraph PrivateDataSubnets["Private Isolated Data Subnets (Multi-AZ)"]
        RDS[(Amazon RDS PostgreSQL 16<br/>Multi-AZ Primary + Standby<br/>PostGIS · Automated PITR)]
        ElastiCache[(Amazon ElastiCache Redis 7<br/>Multi-AZ with Auto-Failover)]
      end

      Secrets[AWS Secrets Manager<br/>& KMS Encryption Keys]
      EventBridge[Amazon EventBridge Scheduler<br/>Durable One-Off 24h Timers]
    end

    S3Media[(Amazon S3 ca-central-1<br/>Encrypted · Versioned · Object Lock)]
  end

  Client -->|HTTPS :443| WAF
  WAF --> CF
  CF -->|Static Assets / Cache| S3Media
  CF -->|SSR Requests /*| ALB
  CF -->|API Requests /api/* & SSE| ALB

  ALB --> WebTasks
  ALB --> APITasks

  APITasks --> RDS
  APITasks --> ElastiCache
  WorkerTasks --> RDS
  WorkerTasks --> ElastiCache
  APITasks --> Secrets
  WorkerTasks --> Secrets

  EventBridge -->|Trigger Auction Close at ends_at| APITasks
  Client -->|Presigned Direct Upload| S3Media
```

---

## 3. Tech stack

| Layer | Choice | Details & Enterprise Rationale |
|---|---|---|
| **Cloud Provider** | **AWS (ca-central-1)** | 100% physically isolated in Montreal, Quebec, Canada. |
| **Edge & CDN** | **CloudFront + AWS WAF** | Global edge distribution with local Canadian POPs (Montreal, Toronto, Vancouver). WAF protects against bot scrapers and credential stuffing. |
| **Compute Engine** | **AWS Fargate (Serverless Containers)** | Zero EC2 patching or OS maintenance. Fully managed autoscaling for both Next.js and NestJS. |
| **Frontend SSR** | **Next.js 16 Standalone Container** | Packaged as standard Docker image, running on Fargate behind ALB. |
| **Backend API** | **NestJS 11 (Node 22 LTS)** | Modular architecture with strict dependency injection. Runs on Fargate with fast horizontal autoscaling based on CPU/connection load. |
| **Database** | **Amazon RDS PostgreSQL 16 (Multi-AZ)** | Synchronous replication across availability zones. Automated snapshots and Continuous WAL Archiving with 5-minute Point-In-Time Recovery (PITR). |
| **Spatial Engine** | **PostGIS Extension on RDS** | Built-in GIS acceleration for dealer radius calculations (`ST_DWithin`). |
| **In-Memory Cache** | **Amazon ElastiCache for Redis (Cluster Mode)** | Managed Redis with automated Multi-AZ failover. Powers BullMQ, SSE pub/sub, and distributed lock management. |
| **Job Scheduling** | **Amazon EventBridge Scheduler + BullMQ** | EventBridge schedules guaranteed one-time webhook calls directly into the API at `auction_ends_at`, completely decoupled from application process uptime. |
| **Media Storage** | **Amazon S3 + KMS Encryption** | Presigned S3 PUT with client-side compression. Object Lock with compliance mode ensures 7-year audit retention. |
| **Secrets & Keys** | **AWS Secrets Manager & KMS** | Automatic database credential rotation and envelope encryption for sensitive Canadian dealer tax IDs / bank credentials. |
| **Infrastructure as Code** | **Terraform** or **AWS CDK / SST v3** | Complete infrastructure defined in code, version-controlled, with reproducible staging and production environments. |
| **Observability** | **CloudWatch Container Insights + AWS X-Ray** | Distributed end-to-end tracing across Next.js SSR, NestJS API, and RDS queries. Sentry integration for frontend exceptions. |

---

## 4. Critical flows

### H3/H4 — EventBridge-Assisted Guaranteed Auction Closing
In addition to internal BullMQ queues, AWS EventBridge Scheduler creates an indestructible one-time cloud timer when a listing is activated:

```typescript
// apps/api/src/auctions/eventbridge-scheduler.service.ts
import { SchedulerClient, CreateScheduleCommand } from "@aws-sdk/client-scheduler";

@Injectable()
export class EventBridgeSchedulerService {
  private client = new SchedulerClient({ region: 'ca-central-1' });

  async scheduleAuctionClose(listingId: string, endsAt: Date) {
    const formattedDate = endsAt.toISOString().replace(/\.\d{3}Z$/, '');
    
    await this.client.send(new CreateScheduleCommand({
      Name: `auction-close-${listingId}`,
      ScheduleExpression: `at(${formattedDate})`,
      FlexibleTimeWindow: { Mode: "OFF" },
      Target: {
        Arn: process.env.AUCTION_CLOSE_LAMBDA_OR_API_ARN,
        RoleArn: process.env.EVENTBRIDGE_INVOKE_ROLE_ARN,
        Input: JSON.stringify({ listingId, action: 'CLOSE_AUCTION' }),
        RetryPolicy: {
          MaximumRetryAttempts: 5,
          MaximumEventAgeInSeconds: 3600
        }
      }
    }));
  }
}
```

This guarantees that even if every container in the cluster were restarting at that exact second, AWS infrastructure itself delivers the trigger event as soon as compute is available.

---

## 5. NFR matrix evaluation

| NFR | Requirement | Status | AWS Enterprise Implementation |
|---|---|:---:|---|
| **NFR-01** | Performance < 2s | **✅** | CloudFront CDN edge-caches static UI; Fargate tasks reside in the same subnets as RDS (< 1.5ms network latency). |
| **NFR-02** | **Bid submission < 200ms** | **✅** | Always-warm Fargate containers eliminate serverless cold starts. RDS queries execute in < 8ms. |
| **NFR-03** | **5,000 concurrent, 1,000 auctions** | **✅** | Fargate autoscaling automatically scales from 2 to 20+ tasks based on target CPU or active connection thresholds. |
| **NFR-04** | **99.9% availability** | **✅** | Exceeds requirement: Multi-AZ RDS (99.95%), Multi-AZ ElastiCache (99.99%), and multi-task ECS across two Canadian AZs. |
| **NFR-05** | Security & Encryption | **✅** | AWS KMS customer-managed keys (CMK) encrypt EBS volumes, RDS storage, ElastiCache, and S3 objects with AES-256. |
| **NFR-06** | **MFA enforcement** | **✅** | NestJS TOTP integration backed by Redis session management and encrypted RDS user tables. |
| **NFR-07** | Rate limiting & OWASP | **✅** | Dual-layer: AWS WAF at edge (SQL injection, XSS, rate-based rules) + `@nestjs/throttler` in-app. |
| **NFR-08** | Privacy (Law 25 & PIPEDA) | **✅** | AWS Canada DPA signed. Encrypted S3 buckets and RDS are physically located in Montreal. |
| **NFR-09** | Canadian data residency | **✅** | 100% of compute, caching, database, and storage reside strictly in `ca-central-1`. Zero external hops. |
| **NFR-10** | **RPO 1h, RTO 4h** | **✅** | Exceeds requirement: RDS Continuous Automated Backups provide RPO of 5 minutes and automated failover in < 60 seconds (RTO < 5 min). |
| **NFR-11** | 7-year audit trail | **✅** | S3 Object Lock in Compliance Mode prevents even root AWS accounts from deleting or modifying audit files for 7 years. |
| **NFR-15** | Idempotency & Locking | **✅** | Redis distributed locks (`ioredis-lock`) + Postgres row-level locks (`FOR UPDATE`). |
| **NFR-16** | 70% Unit test coverage | **✅** | Clean TypeScript service architecture with Dockerized local PostgreSQL/LocalStack testing in CI. |

---

## 6. Data residency & legal compliance

- **Single Legal Entity:** AWS Canada Inc. provides a unified DPA covering all components.
- **Quebec Law 25 Compliance:** Eliminates multi-vendor data transfer assessments because no data is mirrored or transferred across international borders.
- **Government / Enterprise Ready:** Ready for procurement questionnaires from Tier-1 Canadian automotive franchises and banks.

---

## 7. Scaling path & capacity limits

- **Capacity ceiling:** Over 100,000 concurrent users and 20,000 active auctions without architectural modification.
- **Database Scaling:** RDS Read Replicas can be added in 2 clicks for dealer feed distribution.
- **Storage:** Amazon S3 scales infinitely with lifecycle transition rules to S3 Glacier Flexible Retrieval for archived listings after 90 days.

---

## 8. Cost bands (Estimates in USD/month)

| Component | MVP Deployment | Production Growth (5k Concurrent) |
|---|---|---|
| Amazon ECS Fargate (2x Web, 2x API, 1x Worker) | ~$90 | ~$320 |
| Amazon RDS Multi-AZ PostgreSQL (`db.t4g.medium`) | ~$140 | ~$380 (`db.m6g.large`) |
| Amazon ElastiCache Redis (`cache.t4g.medium`, Multi-AZ) | ~$65 | ~$140 |
| Application Load Balancer + AWS WAF | ~$45 | ~$95 |
| CloudFront + AWS S3 + Data Transfer | ~$25 | ~$120 |
| AWS Secrets Manager, KMS, CloudWatch Logs, NAT Gateway | ~$65 | ~$130 |
| **Total Estimated AWS Bill** | **~$430 / month** | **~$1,185 / month** |

*Tip for early-stage bootstrapper:* Start with Single-AZ RDS and NAT instance (saving ~$150/mo) until commercial launch, then enable Multi-AZ with zero downtime.

---

## 9. Effort & time-to-MVP

| Workstream | Estimate (2 Full-Stack Engineers + 1 DevOps) |
|---|---|
| VPC Networking, Subnets, Security Groups, IAM, Terraform / SST setup | 2.5 weeks |
| Dockerization of Next.js and NestJS, ECS Fargate Task Definitions, CI/CD pipelines | 2.0 weeks |
| Database schema, PostGIS configuration, RDS automated snapshots | 1.5 weeks |
| Core application services, Auction engine, EventBridge Scheduler integration | 3.5 weeks |
| Dealer subscriptions, Stripe billing, S3 presigned direct uploads | 2.0 weeks |
| Security hardening, WAF rules, Penetration testing & Load testing | 2.5 weeks |
| **Total Time-to-Production** | **~14–15 weeks** |

---

## 10. Risks, lock-in & exit strategy

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| **AWS bill shock from misconfiguration** | Medium | AWS Budgets with hard alert thresholds at $500/mo and $1,000/mo; CloudWatch billing alarms. |
| **Terraform/DevOps complexity** | High | Use modern frameworks like **SST v3** (Ion) or standard, well-documented AWS CDK constructs to reduce boilerplate. |
| **Vendor Lock-in** | Low–Medium | The application code itself is 100% standard Dockerized Next.js and NestJS. Only EventBridge Scheduler is AWS-specific (and has BullMQ as a direct in-app fallback). |

---

## 11. Impact on current Next.js frontend

- **Zero API Contract Alterations:** The frontend communicates with the NestJS backend via standard REST endpoints and SSE streams.
- **Deployment Change:** The Next.js app is built via standard `Dockerfile` and deployed to ECS Fargate behind CloudFront rather than deployed via Vercel CLI/Git push.
