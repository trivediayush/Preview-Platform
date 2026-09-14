# Day 2 — Local Docker Validation + EC2/K3s Foundation

**Date:** 2026-09-14  
**Project:** Atrivedi Preview Platform

## Objective

Validate the sample application inside Docker and establish the first AWS/Kubernetes runtime by creating an EC2 instance and installing K3s.

The purpose of Day 2 is to prove the basic runtime path before building the Preview Platform controller.

Target architecture after today's work:

```text
Sample App Source
      ↓
Docker Image
      ↓
Docker Container
      ↓
AWS EC2
      ↓
K3s
      ↓
Kubernetes Workload
```

---

# Part 1 — Validate the Application with Docker

## Step 1 — Enter the repository

From the terminal:

```bash
cd ~/projects/Preview-Platform
```

Verify the project files:

```bash
ls
```

Expected important files:

```text
Dockerfile
package.json
package-lock.json
server.js
README.md
```

## Step 2 — Build the Docker image

Command:

```bash
docker build -t sample-app .
```

### What the command means

- `docker build` — build a Docker image
- `-t sample-app` — assign the image the name `sample-app`
- `.` — use the current directory as the build context

The build completed successfully.

## Step 3 — Run the container

Command:

```bash
docker run --rm -p 3000:3000 sample-app
```

### What the command means

- `docker run` — create and start a container
- `--rm` — remove the container automatically after it stops
- `-p 3000:3000` — map host port `3000` to container port `3000`
- `sample-app` — run the image we built

The application started successfully.

## Step 4 — Test the health endpoint

Command:

```bash
curl http://localhost:3000/health
```

Observed result:

```json
{
  "status": "ok",
  "hostname": "a3959df1d716",
  "uptime_seconds": 581,
  "started_at": "2026-09-14T06:06:24.896Z",
  "version": "1.0.0"
}
```

The exact uptime increased during testing, which is expected because the container continued running.

### What this proves

- The Node.js application started.
- Express is serving requests.
- The Docker container is reachable.
- Port mapping works.
- The `/health` endpoint works from outside the container.
- The container has its own hostname.

## Step 5 — Test liveness

Command:

```bash
curl http://localhost:3000/livez
```

Observed result:

```text
ok
```

This confirms the liveness endpoint is reachable.

## Step 6 — Browser validation

Opened the application in the browser through:

```text
http://localhost:3000
```

The **Preview Sample App** page loaded successfully.

The page displayed:

- Hostname
- Version
- PR number
- Start time
- Uptime
- Available endpoints

## Step 7 — Health endpoint browser validation

Opened:

```text
http://localhost:3000/health
```

The JSON health response was displayed successfully.

---

# Part 2 — AWS EC2 Foundation

## Step 8 — Create the EC2 instance

Created a dedicated EC2 instance for the Kubernetes/K3s lab environment.

This instance is intended to host the first single-node K3s cluster.

### Important architecture decision

For V1 we are intentionally starting with:

```text
1 EC2 instance
     ↓
1 K3s node
```

instead of immediately creating a multi-node Kubernetes cluster.

### Why?

The goal at this stage is to understand and prove the platform mechanism while keeping:

- Infrastructure simple
- Cost low
- Debugging easier
- Resource usage predictable

The architecture can be expanded later if the project requires it.

## Step 9 — Connect to the EC2 instance

Connected to the EC2 instance using SSH.

The EC2 instance becomes the remote Linux environment where K3s will run.

## Step 10 — Install K3s

Installed K3s on the EC2 instance.

K3s is a lightweight Kubernetes distribution designed to provide Kubernetes functionality with significantly less operational overhead than a traditional Kubernetes installation.

The resulting basic architecture is:

```text
AWS EC2
  │
  └── K3s
       │
       └── Kubernetes cluster
```

## Step 11 — Verify K3s

Verified that the K3s installation is functioning on the EC2 instance.

At this point, the project has moved from:

```text
Local Docker
```

to:

```text
AWS EC2
   ↓
K3s
```

---

# Why We Are Doing This Manually First

We are intentionally **not using Terraform or the Preview Controller yet**.

The learning/build sequence is:

```text
1. Prove application works
        ↓
2. Prove Docker works
        ↓
3. Prove EC2 works
        ↓
4. Prove K3s works
        ↓
5. Deploy application to Kubernetes manually
        ↓
6. Expose application through Kubernetes networking
        ↓
7. Automate infrastructure
        ↓
8. Build the controller
        ↓
9. Connect GitHub PR events
        ↓
10. Build automatic preview environments
```

This gives us a known-good manual baseline.

If automation fails later, we can compare the automated process against the manual process.

---

# Day 2 Architecture

Current proven components:

```text
┌──────────────────────────────┐
│       GitHub Repository      │
│   trivediayush/Preview-      │
│          Platform            │
└──────────────┬───────────────┘
               │
               │ source code
               ↓
┌──────────────────────────────┐
│       Sample Node.js App     │
│          Express             │
└──────────────┬───────────────┘
               │
               │ Docker build
               ↓
┌──────────────────────────────┐
│        Docker Image          │
│         sample-app           │
└──────────────┬───────────────┘
               │
               │ container
               ↓
┌──────────────────────────────┐
│         AWS EC2              │
│                              │
│            K3s               │
│             │                │
│       Kubernetes             │
└──────────────────────────────┘
```

The next task is to deploy the same sample application into K3s.

---

# Interview Preparation

## Question: Why did you use K3s?

**Answer:**

> I used K3s because this is a small V1 platform running on a single EC2 node. K3s provides a lightweight Kubernetes distribution with lower operational overhead and resource requirements, which makes it suitable for a low-cost learning and prototype environment.

## Question: Why didn't you immediately use EKS?

**Answer:**

> The goal of V1 was to understand the mechanics of building a preview platform rather than outsource the entire Kubernetes control plane to a managed service. Starting with K3s keeps the architecture inexpensive and makes the Kubernetes internals more visible. EKS could be considered for a production-oriented evolution.

## Question: Why validate Docker locally before Kubernetes?

**Answer:**

> Kubernetes should not be the first debugging layer. I first verified that the application itself builds and runs correctly as a container. That gives me a known-good container before introducing Kubernetes networking, scheduling and service discovery.

## Question: What does `-p 3000:3000` do?

**Answer:**

> It maps port 3000 on the Docker host to port 3000 inside the container. Requests arriving at the host's port 3000 are forwarded to the application's port 3000 inside the container.

## Question: Why is the hostname different?

The application reports:

```text
a3959df1d716
```

This is the container hostname.

This becomes particularly useful later because Kubernetes pods will have their own identities/hostnames. The sample application's hostname and `PR_NUMBER` will help us verify which preview instance actually handled a request.

## Question: What is the purpose of `/health`?

**Answer:**

> It is a lightweight health endpoint that does not depend on a database or external service. Kubernetes can use health endpoints for health checking, and the platform can use them to verify that a deployed preview application is responding.

---

# Day 2 Result

### Completed

- [x] Docker image built
- [x] Docker container started
- [x] `/health` tested successfully
- [x] `/livez` tested successfully
- [x] Application tested in browser
- [x] AWS EC2 created
- [x] K3s installed on EC2
- [x] K3s runtime verified

### Not Yet Done

- [ ] Deploy sample app to K3s
- [ ] Kubernetes Deployment
- [ ] Kubernetes Service
- [ ] Kubernetes Ingress
- [ ] Hostinger DNS
- [ ] HTTPS
- [ ] ECR
- [ ] Terraform automation
- [ ] FastAPI controller
- [ ] GitHub webhook
- [ ] Reconciliation
- [ ] Preview namespace lifecycle
- [ ] Workload isolation testing

## Status

**Day 2: COMPLETE**

**Next milestone:** Deploy the sample Docker application into the K3s cluster manually.
