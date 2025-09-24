# PowerShell script to add debugging to dropdown functionality
$filePath = "C:\Users\User\Documents\first_year_files\folder_for_jobs\INCLOUD\DEVELOPMENT\incloud-web\src\app\super-admin\users\page.tsx"

# Read the entire file content
$content = Get-Content $filePath -Raw

# Define the replacements as an array of hashtables
$replacements = @(
    @{
        old = '  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openDropdown) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener(''click'', handleClickOutside)
    return () => document.removeEventListener(''click'', handleClickOutside)
  }, [openDropdown])'
        new = '  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openDropdown) {
        console.log(''[DROPDOWN DEBUG] Closing dropdown via outside click:'', openDropdown)
        setOpenDropdown(null)
      }
    }

    document.addEventListener(''click'', handleClickOutside)
    return () => document.removeEventListener(''click'', handleClickOutside)
  }, [openDropdown])'
    },
    @{
        old = '  const handleViewAuditHistory = (admin: AdminUser) => {
    setSelectedAdminForAudit(admin)
    setShowAuditHistory(true)
  }'
        new = '  const handleViewAuditHistory = (admin: AdminUser) => {
    console.log(''[DROPDOWN DEBUG] handleViewAuditHistory called for admin:'', admin.full_name, admin.id)
    setSelectedAdminForAudit(admin)
    setShowAuditHistory(true)
  }'
    },
    @{
        old = '  const handleViewDetails = (admin: AdminUser) => {
    setSelectedAdminForDetails(admin)
    setShowViewDetails(true)
  }'
        new = '  const handleViewDetails = (admin: AdminUser) => {
    console.log(''[DROPDOWN DEBUG] handleViewDetails called for admin:'', admin.full_name, admin.id)
    setSelectedAdminForDetails(admin)
    setShowViewDetails(true)
  }'
    }
)

# Apply replacements
foreach ($replacement in $replacements) {
    $content = $content -replace [regex]::Escape($replacement.old), $replacement.new
}

# Write the modified content back to the file
Set-Content -Path $filePath -Value $content -Encoding UTF8

Write-Host "Debugging additions completed!"