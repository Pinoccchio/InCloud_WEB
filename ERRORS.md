Console AuthApiError


User not allowed

src/app/super-admin/users/page.tsx (67:53) @ async loadAdmins


  65 |
  66 |       // Get auth user data for emails
> 67 |       const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
     |                                                     ^
  68 |       if (authError) throw authError
  69 |
  70 |       // Combine admin data with auth user data