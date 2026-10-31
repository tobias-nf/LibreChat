# Local test users

The optional development override enables email/password login alongside Google.
It keeps public signup disabled, so test accounts are created through the existing
administrator CLI. The shared Google-only policy and cloud configuration are unchanged.
The local app remains bound to `127.0.0.1` by `docker-compose.override.yml`.

Enable the local override from the repository root:

```sh
docker compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.dev-auth.yml up -d --no-build --no-deps api
```

Create as many test users as needed:

```sh
docker compose exec api npm run create-user -- alice-test@near.foundation "Alice Test" alice-test --email-verified=true
```

Enter a test password when prompted. Each account needs a unique email and username.
The email must use `near.foundation` because the shared YAML still enforces that
domain. No Google account or actual mailbox is required; `--email-verified=true`
prevents sending verification email. Test users receive the normal user role when
an administrator already exists. Avoid addresses belonging to real employees.

Open <http://localhost:3081/login> and use the email/password form. Google login
remains available. These accounts use the local database and the same shared model
key and per-user usage accounting as other local users.

Return to Google-only login:

```sh
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d --no-build --no-deps api
```

This hides and blocks password login again. It preserves test users and their data;
it does not revoke sessions already issued while development login was enabled.
Use a separate cloud database and apply `infra/google-login.env` there. Never add
the development override or its password-login setting to the cloud deployment.
