# How to Make Admin Users

There are two ways to make a user an admin in this Firebase-based application:

## Method 1: Using the Script (Recommended)

Run the following command in your terminal:

```bash
npm run make-admin your-email@example.com
```

Example:
```bash
npm run make-admin admin@example.com
```

This will:
1. Create a user document in Firestore if it doesn't exist
2. Set the user's role to 'ADMIN'
3. The user can now access admin routes at `/admin`

## Method 2: Using the Admin API (Web Interface)

If you're already logged in as an admin, you can use the admin API:

**POST** `/api/admin/users`

```json
{
  "userEmail": "user@example.com",
  "action": "make-admin"
}
```

To remove admin privileges:
```json
{
  "userEmail": "user@example.com",
  "action": "remove-admin"
}
```

## How It Works

- User roles are stored in Firestore in the `users` collection
- The user ID is the user's email address
- The authentication system fetches the role from Firestore on login
- Admin users can access routes protected by `requireAdmin()` function

## Default Role

All new users get the 'STUDENT' role by default. Only users explicitly made admin can access admin features.

## Admin Routes

Once a user is made admin, they can access:
- `/admin` - Admin dashboard
- `/admin/*` - All admin pages
- Admin API endpoints

## Troubleshooting

1. **Script fails**: Make sure your `.env.local` has all Firebase environment variables
2. **User can't access admin**: Check that the user document exists in Firestore with `role: 'ADMIN'`
3. **Role not updating**: Try logging out and logging back in to refresh the session