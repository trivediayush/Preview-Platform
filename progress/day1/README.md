# Day 1 — Project Setup & Foundation

**Date:** 2026-09-13  
**Project:** Atrivedi Preview Platform  
**Repository:** `trivediayush/Preview-Platform`

## Objective

Set up the repository and establish the foundation for the Atrivedi Preview Platform project.

The goal of the project is to build a small Vercel-like preview platform for Kubernetes:

> A GitHub Pull Request should eventually create an isolated Kubernetes preview environment with its own URL, and the environment should be removed when the PR is closed.

## What We Did

### 1. Created the GitHub repository

Created the public repository:

`trivediayush/Preview-Platform`

The repository is the main source-control location for the project.

### 2. Defined the V1 project direction

The V1 architecture and scope were defined around:

- GitHub Pull Requests
- FastAPI controller
- Kubernetes/K3s
- Docker
- GitHub Actions
- Amazon ECR
- Hostinger DNS
- cert-manager + Let's Encrypt
- Resource limits and workload isolation
- Reconciliation to recover from missed webhook events

### 3. Created the sample application

Created a deliberately simple Node.js + Express application to act as the workload that the preview platform will deploy.

Current endpoints:

| Endpoint | Purpose |
|---|---|
| `/` | Human-readable application information |
| `/health` | JSON health check |
| `/livez` | Liveness check |
| `/readyz` | Readiness check |
| `/api/echo` | Request/instance verification |

### 4. Added containerization

Created a Dockerfile so the sample application can run as a container.

The application exposes port `3000`.

### 5. Added project documentation

The README documents:

- Local execution
- Docker execution
- Environment variables
- Available endpoints
- Smoke testing

## Important Project Principle

We are deliberately building the platform in layers:

```text
Application
    ↓
Docker
    ↓
Kubernetes
    ↓
Controller
    ↓
GitHub integration
    ↓
Preview environments
```

We will first prove each underlying mechanism manually before automating it.

## Day 1 Result

The repository and initial sample application foundation were successfully created.

## Interview Preparation — What I Should Be Able to Explain

### Why build a sample application first?

Because the preview platform needs a known workload to deploy. A simple application removes unrelated complexity and lets us test the platform itself.

### Why Kubernetes preview environments?

A PR can be deployed into an isolated namespace so developers/reviewers can test a change without affecting the main environment.

### Why not start with the full automation?

Because automation can hide problems. We first prove:

```text
Application → Container → Kubernetes → Network
```

and then automate the proven process.

## Key Terms Learned

- Docker image
- Docker container
- Kubernetes
- Namespace
- Deployment
- Service
- Ingress
- Controller
- Reconciliation
- Pull Request preview environment

## Status

**Day 1: COMPLETE**
