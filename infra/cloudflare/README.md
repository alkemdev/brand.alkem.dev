# Cloudflare Infrastructure

Manages DNS and custom domain binding for `brand.alkem.dev` using
[OpenTofu](https://opentofu.org) with the
[Cloudflare provider v5](https://registry.terraform.io/providers/cloudflare/cloudflare/latest).

## What Terraform manages

| Resource | Purpose |
|----------|---------|
| `cloudflare_dns_record.subdomain` | CNAME `brand.alkem.dev` → `brand-alkem-dev.pages.dev` |
| `cloudflare_pages_domain.subdomain` | Binds `brand.alkem.dev` to the Pages project |

## What Terraform does NOT manage

The **Cloudflare Pages project** itself is created via the Cloudflare dashboard.
GitHub integration (auto-deploy on push) uses an OAuth flow that cannot be done through the API.

## Prerequisites

- [OpenTofu](https://opentofu.org/docs/intro/install/) >= 1.6 (or Terraform)
- A Cloudflare API token with **Zone > DNS > Edit** and **Account > Cloudflare Pages > Edit**
- The `alkem.dev` zone must exist in the account
- The `brand-alkem-dev` Pages project must already exist (created via dashboard)

## Setup

```bash
cp terraform.tfvars.example terraform.tfvars
# fill in account_id
export CLOUDFLARE_API_TOKEN="your-token-here"
tofu init
tofu plan
tofu apply
```
