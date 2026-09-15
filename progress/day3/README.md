# Day 3 — AWS EC2 + K3s Foundation + ECR

**Project:** Atrivedi Preview Platform
**Repository:** `Preview-Platform`
**Date:** 2026-09-15
**Status:** Completed for today

---

## 1. Today's Objective

The objective of Day 2 was to establish the Kubernetes runtime environment that will eventually host ephemeral preview environments.

We:

1. Verified the AWS EC2 environment.
2. Installed K3s.
3. Verified that the Kubernetes control plane is healthy.
4. Verified the default K3s components.
5. Verified Traefik.
6. Measured the available node resources.
7. Verified AWS CLI and AWS region.
8. Verified AWS authentication.
9. Created the private Amazon ECR repository for the sample application.

We intentionally did **not** deploy the sample application yet.

---

# 2. Current Architecture

At the end of Day 2, the infrastructure looks like this:

```text
AWS
│
└── Separate VPC
    │
    └── Separate Subnet
        │
        └── EC2 c7i.large
            │
            ├── Ubuntu 26.04 LTS
            │
            ├── AWS CLI
            │
            └── K3s v1.36.4+k3s1
                │
                ├── Kubernetes API
                ├── CoreDNS
                ├── Metrics Server
                ├── Local Path Provisioner
                └── Traefik
                    │
                    ├── HTTP :80
                    └── HTTPS :443

Amazon ECR
│
└── preview-platform/sample-app
```

The future application flow will be:

```text
GitHub PR
    │
    ▼
FastAPI Controller
    │
    ▼
Kubernetes API
    │
    ▼
K3s
    │
    ├── Namespace
    ├── Deployment
    ├── Service
    └── Ingress
            │
            ▼
pr-<number>.preview.atrivedi.online
```

---

# 3. EC2 Environment

The project is running on a dedicated EC2 instance.

### Instance

```text
Instance type:       c7i.large
CPU:                 2 vCPU
Memory:              ~3.7 GiB
Root disk:           15 GB gp3
Private IP:          10.0.1.191
```

### Operating system

```text
Ubuntu 26.04 LTS
Kernel: 7.0.0-1006-aws
Architecture: amd64
```

The instance is located in:

```text
AWS Region: eu-west-1
```

---

# 4. Why K3s?

The platform needs Kubernetes because each GitHub PR will eventually receive its own isolated environment.

A full Kubernetes distribution such as a large managed cluster would be excessive for V1.

K3s gives us a lightweight Kubernetes distribution suitable for a single-node environment.

For this project:

```text
Kubernetes
    ↓
K3s
    ↓
Single EC2 node
```

This keeps the initial architecture relatively inexpensive and allows us to focus on the platform-engineering problem rather than managing a large Kubernetes cluster.

---

# 5. Installing K3s

K3s was installed using:

```bash
curl -sfL https://get.k3s.io | sh -
```

The installed version is:

```text
v1.36.4+k3s1
```

After installation, the K3s systemd service was running successfully.

Verification:

```bash
sudo systemctl status k3s --no-pager
```

The service reported:

```text
Active: active (running)
```

---

# 6. Kubernetes Node Verification

The Kubernetes node was checked using:

```bash
sudo k3s kubectl get nodes
```

Result:

```text
NAME            STATUS   ROLES           VERSION
ip-10-0-1-191   Ready    control-plane   v1.36.4+k3s1
```

We then obtained detailed information:

```bash
sudo k3s kubectl get nodes -o wide
```

Important values:

```text
STATUS:             Ready
ROLE:               control-plane
VERSION:            v1.36.4+k3s1
INTERNAL-IP:        10.0.1.191
OS:                 Ubuntu 26.04 LTS
KERNEL:             7.0.0-1006-aws
CONTAINER RUNTIME:  containerd://2.3.4-k3s1.36
```

### What this proves

The EC2 instance is successfully functioning as the K3s Kubernetes control-plane node.

Because this is a single-node K3s installation, the same machine will also run workloads.

---

# 7. K3s System Components

We checked all pods:

```bash
sudo k3s kubectl get pods -A
```

The final healthy state was:

```text
NAMESPACE     NAME                                      READY   STATUS
kube-system   coredns-...                              1/1     Running
kube-system   helm-install-traefik-crd-...             0/1     Completed
kube-system   helm-install-traefik-...                 0/1     Completed
kube-system   local-path-provisioner-...                1/1     Running
kube-system   metrics-server-...                        1/1     Running
kube-system   svclb-traefik-...                         2/2     Running
kube-system   traefik-...                               1/1     Running
```

The Traefik installation initially showed an error/restart while K3s was starting.

After waiting for the cluster to settle, the Helm installation completed successfully and Traefik became:

```text
1/1 Running
```

Therefore, no manual Traefik repair was required.

---

# 8. CoreDNS

CoreDNS is running:

```text
coredns-...   1/1   Running
```

CoreDNS provides DNS resolution inside the Kubernetes cluster.

This will eventually allow components such as:

```text
Preview Pod
    ↓
Service DNS
    ↓
Preview Application
```

to communicate using Kubernetes service discovery.

---

# 9. Metrics Server

Metrics Server is running:

```text
metrics-server-...   1/1   Running
```

This is useful because Kubernetes can obtain resource usage information from workloads.

It will also be useful later when investigating:

* CPU usage
* memory usage
* resource pressure
* preview environment capacity

---

# 10. Traefik

Traefik is the default K3s ingress controller and is already running.

We verified the services:

```bash
sudo k3s kubectl get svc -A
```

The Traefik service is:

```text
NAMESPACE     NAME       TYPE
kube-system   traefik   LoadBalancer
```

It is exposed through:

```text
HTTP:   80
HTTPS:  443
```

The service maps:

```text
80:30560
443:32674
```

and the external address shown by Kubernetes is:

```text
10.0.1.191
```

### Why Traefik matters

Our final preview URL will eventually look like:

```text
https://pr-42.preview.atrivedi.online
```

The request will eventually flow approximately like:

```text
Browser
   │
   ▼
pr-42.preview.atrivedi.online
   │
   ▼
EC2
   │
   ▼
Traefik
   │
   ▼
Ingress
   │
   ▼
Service
   │
   ▼
Preview Pod
```

---

# 11. Kubernetes API Verification

We verified the Kubernetes control plane:

```bash
sudo k3s kubectl cluster-info
```

Output confirmed:

```text
Kubernetes control plane is running at:
https://127.0.0.1:6443
```

CoreDNS and Metrics Server were also accessible through the Kubernetes API.

### Why this matters

Our future FastAPI controller will need to communicate with the Kubernetes API.

Conceptually:

```text
FastAPI Controller
        │
        ▼
Kubernetes API
        │
        ▼
K3s
```

This is the core control loop of the platform.

---

# 12. Kubernetes Resource Capacity

We checked the node capacity:

```bash
sudo k3s kubectl describe node | grep -A10 "Capacity:"
```

Important values:

```text
CPU:                  2
Memory:               3902932 Ki
Ephemeral storage:    14050628 Ki
Pods:                 110
```

Allocatable memory was approximately:

```text
3.7 GiB
```

and allocatable ephemeral storage was approximately:

```text
13.7 GiB
```

### Important platform-engineering implication

This is a small single-node cluster.

Therefore, preview environments must have resource limits.

We eventually need mechanisms such as:

```text
Namespace
│
├── ResourceQuota
│
└── LimitRange
```

Otherwise a single badly behaved preview workload could consume too many resources.

This is one of the reasons resource isolation is part of the V1 design.

---

# 13. AWS CLI Verification

We verified the AWS CLI:

```bash
aws --version
```

Result:

```text
aws-cli/2.36.45
Python/3.14.6
Linux/7.0.0-1006-aws
```

AWS CLI is therefore already available on the EC2 instance.

---

# 14. AWS Region Verification

We checked:

```bash
aws configure get region
```

Result:

```text
eu-west-1
```

Therefore, the project is currently using:

```text
AWS Region = eu-west-1
```

All AWS resources we create for this project should intentionally use the same region unless we make an explicit architecture decision to change it.

---

# 15. AWS Authentication

We verified AWS authentication with:

```bash
aws sts get-caller-identity
```

The EC2 instance is currently authenticated as an IAM user:

```text
donalduck
```

The user has:

```text
AdministratorAccess
```

This was intentional and was confirmed by checking:

```bash
aws iam list-attached-user-policies --user-name donalduck
```

which returned:

```text
AdministratorAccess
```

### Security decision

We are **not** putting AWS credentials inside preview containers.

The intended security boundary is:

```text
EC2 / administrative environment
        │
        └── AWS access

Preview workload
        │
        └── NO AWS credentials
```

Later, the platform can be hardened by replacing host-level IAM-user authentication with an EC2 IAM role containing only the permissions required by the platform.

That is a later hardening task and is not blocking V1 infrastructure setup.

---

# 16. Amazon ECR

We created a private ECR repository for the sample application:

```text
preview-platform/sample-app
```

Region:

```text
eu-west-1
```

The purpose of the repository is to store the Docker image that K3s will eventually pull.

The future image flow will be:

```text
Sample Application
       │
       ▼
Docker Build
       │
       ▼
Amazon ECR
       │
       ▼
K3s
       │
       ▼
Preview Pod
```

We have **not pushed the image yet**.

That will be handled in the next session.

---

# 17. What We Did NOT Do Today

The following were intentionally left for later:

* ❌ Docker image push to ECR
* ❌ Kubernetes Namespace creation
* ❌ Kubernetes Deployment
* ❌ Kubernetes Service
* ❌ Kubernetes Ingress
* ❌ DNS configuration
* ❌ TLS / cert-manager
* ❌ FastAPI controller
* ❌ GitHub webhook
* ❌ PR lifecycle automation
* ❌ Reconciliation loop
* ❌ ResourceQuota
* ❌ LimitRange
* ❌ Preview workload security testing

This is intentional.

We are validating the platform layer incrementally rather than introducing many moving parts at once.

---

# 18. Day 2 Interview Questions

## Q1. Why did you choose K3s instead of EKS?

**Answer:**

For V1, the goal is to build and demonstrate the platform-engineering control loop rather than operate a production-scale managed Kubernetes service.

K3s provides a lightweight Kubernetes distribution that can run on a single EC2 instance, which keeps the initial infrastructure simpler and cheaper.

EKS could be considered later if the platform needs production-scale multi-node infrastructure.

---

## Q2. What is K3s?

**Answer:**

K3s is a lightweight Kubernetes distribution designed to reduce the operational footprint of Kubernetes while remaining Kubernetes-compatible.

It is particularly useful for edge environments, development environments, labs, and smaller deployments.

---

## Q3. What is Traefik doing in this architecture?

**Answer:**

Traefik is acting as the Kubernetes Ingress controller.

It receives HTTP/HTTPS traffic and routes requests to the appropriate Kubernetes Service based on the Ingress configuration.

For this project, it will eventually route:

```text
pr-42.preview.atrivedi.online
```

to the Service belonging to PR #42's preview environment.

---

## Q4. What is the difference between a Service and an Ingress?

**Answer:**

A Kubernetes Service provides stable networking and service discovery for a group of Pods.

An Ingress defines HTTP/HTTPS routing rules for incoming traffic.

Conceptually:

```text
Ingress
   ↓
Service
   ↓
Pods
```

---

## Q5. Why is the Kubernetes API important to this project?

**Answer:**

The FastAPI controller will use the Kubernetes API to create and manage preview environments.

For example:

```text
PR opened
   ↓
Controller
   ↓
Kubernetes API
   ↓
Create namespace
   ↓
Create deployment
   ↓
Create service
   ↓
Create ingress
```

The controller therefore acts as the platform's control plane logic.

---

## Q6. Why do we need ResourceQuota?

**Answer:**

The cluster is a small single-node environment.

Without resource controls, one preview workload could consume excessive CPU or memory and negatively affect other preview environments or the platform itself.

ResourceQuota allows us to place aggregate resource limits on a namespace.

---

## Q7. Why don't we put AWS credentials inside preview containers?

**Answer:**

Preview applications may eventually execute code originating from GitHub pull requests.

Giving those workloads AWS credentials would create a serious security boundary problem.

The preview workload should therefore have no access to AWS credentials unless explicitly required and securely designed.

---

## Q8. Why is reconciliation needed if GitHub webhooks already exist?

**Answer:**

Webhooks are event-driven but events can be missed.

For example:

```text
PR closed
   ↓
GitHub webhook
   X
network/controller failure
```

The cleanup event may never reach the controller.

A reconciliation loop periodically compares desired state with actual state:

```text
GitHub open PRs
       vs
Kubernetes preview namespaces
```

If a namespace exists for a PR that is no longer open, the controller can remove it.

This makes the system resilient to missed events.

---

# 19. Day 2 Checklist

```text
[✓] Dedicated EC2 environment verified
[✓] Ubuntu verified
[✓] AWS CLI verified
[✓] AWS region verified
[✓] AWS identity verified
[✓] K3s installed
[✓] K3s service running
[✓] Kubernetes node Ready
[✓] CoreDNS running
[✓] Metrics Server running
[✓] Local Path Provisioner running
[✓] Traefik running
[✓] Kubernetes API verified
[✓] Node resource capacity measured
[✓] ECR repository created
[ ] Docker image pushed to ECR
[ ] Sample app deployed to K3s
[ ] Service created
[ ] Ingress created
[ ] DNS configured
[ ] HTTPS configured
```

---

# 20. Exact Stopping Point

**STOP HERE FOR DAY 2.**

The last completed infrastructure action was:

```text
Created private ECR repository:

preview-platform/sample-app

Region:

eu-west-1
```

The next session should begin by verifying the ECR repository and then pushing the already-validated sample application's Docker image.

The next expected flow is:

```text
Day 3

Local Docker image
       ↓
Authenticate Docker → ECR
       ↓
Tag image
       ↓
Push image
       ↓
Verify image in ECR
       ↓
Deploy manually to K3s
```

Do not start FastAPI automation yet.

We first need to prove that the application can successfully run inside K3s manually.

---

# 21. Project Principle

The project is intentionally being built in layers:

```text
Layer 1 — Infrastructure
    EC2 + K3s
          ↓
Layer 2 — Workload
    Docker + ECR
          ↓
Layer 3 — Kubernetes
    Namespace + Deployment + Service + Ingress
          ↓
Layer 4 — Networking
    DNS + HTTPS
          ↓
Layer 5 — Automation
    FastAPI Controller
          ↓
Layer 6 — Reliability
    Reconciliation
          ↓
Layer 7 — Security
    Workload isolation
          ↓
Layer 8 — Platform Product
    GitHub PR → live preview
```

This layered approach makes failures easier to isolate and makes the architecture easier to explain during interviews.

**Day 2 complete.**
