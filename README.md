# HeroVired_Capstone_MultiCloudDeploymentAndManagment
Managing resources across AWS, Azure, and GCP is complex and prone to errors. This project develops a Terraform-based solution to automate multi-cloud deployments, ensure consistent configurations, and improve reliability through high availability and disaster recovery with seamless failover across cloud providers.

##Problem Statement
In multi-cloud environments, managing resources across multiple cloud providers (AWS, Azure, GCP) can be complex and error-prone, especially when attempting to maintain consistent configurations and enable failover across clouds. Traditional deployment methods often lack scalability, are prone to human error, and do not offer high availability across regions or providers. This project will create a Terraform-based solution that enables automated multi-cloud deployments, consistent configuration management, and high availability, with support for disaster recovery in case of regional failures.

##Project Goals
1. Set up a multi-cloud deployment using Terraform, deploying resources across AWS, Azure, and GCP to ensure high availability.
2. Automate infrastructure creation and configuration management across cloud providers with Terraform modules, focusing on scalability and modularity.
3. Implement load balancing and failover mechanisms to automatically handle outages or high traffic by shifting workloads to alternative clouds.
4. Enable disaster recovery by replicating resources and databases across clouds and testing failover capabilities.
5. Provide monitoring and alerts for resource usage and costs across all environments to optimize and manage resources efficiently.

##Tools Used
- Programming Languages: HCL (HashiCorp Configuration Language) for Terraform scripts, Python (optional) for automation scripts
- Terraform: Infrastructure as Code tool to automate multi-cloud deployment and resource management
- Cloud Providers: AWS, Azure, and GCP to host and manage resources across multiple cloud platforms
- Vault: For secure storage and management of access keys and sensitive credentials across multiple providers
- Monitoring: Prometheus and Grafana to track resource health and utilization across cloud providers
- Alerting: PagerDuty or Slack API for real-time alerts on cloud resource status and usage
- GitHub/GitLab: Version control and CI/CD integration to manage Terraform scripts and automate deployments

---

# MERN Ecommerce

## Description

An ecommerce store built with MERN stack, and utilizes third party API's. This ecommerce store enable three main different flows or implementations:

1. Buyers browse the store categories, products and brands
2. Sellers or Merchants manage their own brand component
3. Admins manage and control the entire store components 

The backend is split into four independent microservices plus a gateway — `identity_server/` (auth, user, address), `catalog_server/` (product, category, brand, review, wishlist), `commerce_server/` (cart, order, merchant), and `notification_server/` (contact, order-confirmation email, Socket.IO support chat) — fronted by `api_gateway/`, a reverse proxy that routes by path prefix. `client/` only ever talks to `api_gateway/` (`API_URL=http://localhost:3000/api`); it has no direct knowledge of the individual services behind it. Each of these six apps is independently deployable — see each one's own README for setup/deploy details: [client/README.md](client/README.md), [identity_server/README.md](identity_server/README.md), [catalog_server/README.md](catalog_server/README.md), [commerce_server/README.md](commerce_server/README.md), [notification_server/README.md](notification_server/README.md), [api_gateway/README.md](api_gateway/README.md). This root-level setup is only for running all of them together during local development. `seed_db/` is a separate project for seeding the database on demand — see [seed_db/README.md](seed_db/README.md); it never runs as a side effect of starting any of the above.

### Features:

  * Node provides the backend environment for this application
  * Express middleware is used to handle requests, routes
  * Mongoose schemas to model the application data
  * React for displaying UI components
  * Redux to manage application's state
  * Redux Thunk middleware to handle asynchronous redux actions

## Database Seed

Seeding (an admin user plus sample categories/brands/products) is its own standalone project, `seed_db/` — it's run on demand, independently of the other apps, and never runs automatically when any of them starts. See [seed_db/README.md](seed_db/README.md) for setup and usage.

## Local development install

`npm install` in the project root will install dependencies in `client`, every microservice, and `api_gateway`, for running them all together locally. [See package.json](package.json)

Some basic Git commands are:

```
git clone https://github.com/mohamedsamara/mern-ecommerce.git
cd project
npm install
```

## ENV

Create a `.env` file for the client, each microservice, and the gateway. See examples and full variable descriptions:

- [client/.env.example](client/.env.example) — details in [client/README.md](client/README.md)
- [identity_server/.env.example](identity_server/.env.example) — details in [identity_server/README.md](identity_server/README.md)
- [catalog_server/.env.example](catalog_server/.env.example) — details in [catalog_server/README.md](catalog_server/README.md)
- [commerce_server/.env.example](commerce_server/.env.example) — details in [commerce_server/README.md](commerce_server/README.md)
- [notification_server/.env.example](notification_server/.env.example) — details in [notification_server/README.md](notification_server/README.md)
- [api_gateway/.env.example](api_gateway/.env.example) — details in [api_gateway/README.md](api_gateway/README.md)

Every microservice's `JWT_SECRET` must be identical (stateless JWT verified independently by each one), and all of them plus `seed_db/` point `MONGO_URI` at the same database.

## Start development

```
npm run dev
```

Runs the client dev server, all four microservices, and the API gateway concurrently, for local development only.

## Deployment

Each of `client/`, `identity_server/`, `catalog_server/`, `commerce_server/`, `notification_server/`, and `api_gateway/` deploys independently of the others and of this root setup — see each one's own README's "Deploying"/"Run" section. Deploying the microservices to different clouds only requires pointing `api_gateway`'s `IDENTITY_URL`/`CATALOG_URL`/`COMMERCE_URL`/`NOTIFICATION_URL` at wherever each one ends up.

## Languages & tools

- [Node](https://nodejs.org/en/)

- [Express](https://expressjs.com/)

- [Mongoose](https://mongoosejs.com/)

- [React](https://reactjs.org/)

- [Webpack](https://webpack.js.org/)


### Code Formatter

- Add a `.vscode` directory
- Create a file `settings.json` inside `.vscode`
- Install Prettier - Code formatter in VSCode
- Add the following snippet:  

```json

    {
      "editor.formatOnSave": true,
      "prettier.singleQuote": true,
      "prettier.arrowParens": "avoid",
      "prettier.jsxSingleQuote": true,
      "prettier.trailingComma": "none",
      "javascript.preferences.quoteStyle": "single",
    }

```
