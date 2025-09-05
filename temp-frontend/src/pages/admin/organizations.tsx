import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Pagination from "@/components/pagination";
import Helpers from "@/config/helpers";
import organizationService from "@/services/admin/organization.service";
import organizationUserService from "@/services/admin/organizationUser.service";
import OrganizationDialog from "@/components/admin/OrganizationDialog";
import OrganizationUserDialog from "@/components/admin/OrganizationUserDialog";
import SessionWarningDialog from "@/components/SessionWarningDialog";
import { useSessionManager } from "@/hooks/useSessionManager";
import { 
  Organization, 
  CreateOrganizationData
} from "@/types/organization";
import { 
  OrganizationUserFull,
  CreateOrganizationUserData 
} from "@/types/organizationUser";
import { 
  Loader2, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Users as UsersIcon,
  ChevronDown,
  ChevronRight,
  UserPlus,
  MessageSquare
} from "lucide-react";

const Organizations = () => {
  // Session management
  const { showWarning, keepLoggedIn, logout } = useSessionManager();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [expandedOrgs, setExpandedOrgs] = useState<Set<number>>(new Set());
  const [orgUsers, setOrgUsers] = useState<Record<number, OrganizationUserFull[]>>({});
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userDialogLoading, setUserDialogLoading] = useState(false);
  const [selectedOrgForUser, setSelectedOrgForUser] = useState<Organization | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; organization: Organization | null }>({
    open: false,
    organization: null,
  });
  
  // User management states
  const [editingUser, setEditingUser] = useState<OrganizationUserFull | null>(null);
  const [deleteUserDialog, setDeleteUserDialog] = useState<{ 
    open: boolean; 
    user: OrganizationUserFull | null; 
    organizationId: number | null;
  }>({
    open: false,
    user: null,
    organizationId: null,
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Helper function to get status display and color
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'new_user':
        return { label: 'New User', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' };
      case 'invited':
        return { label: 'Invited', variant: 'default' as const, className: 'bg-yellow-100 text-yellow-800' };
      case 'active':
        return { label: 'Active', variant: 'default' as const, className: 'bg-green-100 text-green-800' };
      case 'inactive':
        return { label: 'Inactive', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-600' };
      case 'suspended':
        return { label: 'Suspended', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' };
      default:
        return { label: status, variant: 'outline' as const, className: '' };
    }
  };

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await organizationService.getOrganizations({
        page,
        limit: pageSize,
      });
      setOrganizations(response.data || []);
      setTotalItems(response.pagination?.totalItems || 0);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      Helpers.toast("error", "Failed to fetch organizations");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  const fetchOrganizationUsers = async (orgId: number) => {
    try {
      console.log(`Fetching users for organization ${orgId}...`);
      const response = await organizationUserService.getOrganizationUsers(orgId, {
        page: 1,
        limit: 100,
      });
      console.log(`Received ${response.data?.length || 0} users for organization ${orgId}:`, response.data);
      setOrgUsers(prev => ({
        ...prev,
        [orgId]: response.data || [],
      }));
    } catch (error: any) {
      console.error("Error fetching organization users:", error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to fetch organization users";
      Helpers.toast("error", `Error loading users: ${errorMsg}`);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleCreateOrganization = async (data: CreateOrganizationData) => {
    try {
      setDialogLoading(true);
      await organizationService.createOrganization(data);
      Helpers.toast("success", "Organization created successfully");
      setDialogOpen(false);
      fetchOrganizations();
    } catch (error: any) {
      console.error("Error creating organization:", error);
      Helpers.toast("error", error.response?.data?.error || "Failed to create organization");
    } finally {
      setDialogLoading(false);
    }
  };

  const handleUpdateOrganization = async (data: CreateOrganizationData) => {
    if (!editingOrganization) return;
    
    try {
      setDialogLoading(true);
      await organizationService.updateOrganization(editingOrganization.id, {
        ...data,
        id: editingOrganization.id
      });
      Helpers.toast("success", "Organization updated successfully");
      setDialogOpen(false);
      setEditingOrganization(null);
      fetchOrganizations();
    } catch (error: any) {
      console.error("Error updating organization:", error);
      Helpers.toast("error", error.response?.data?.error || "Failed to update organization");
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!deleteDialog.organization) return;
    
    try {
      await organizationService.deleteOrganization(deleteDialog.organization.id);
      Helpers.toast("success", "Organization deleted successfully");
      setDeleteDialog({ open: false, organization: null });
      fetchOrganizations();
    } catch (error: any) {
      console.error("Error deleting organization:", error);
      Helpers.toast("error", error.response?.data?.error || "Failed to delete organization");
    }
  };

  const toggleOrganizationExpanded = (orgId: number) => {
    const newExpanded = new Set(expandedOrgs);
    if (newExpanded.has(orgId)) {
      newExpanded.delete(orgId);
    } else {
      newExpanded.add(orgId);
      // Fetch users for this organization if not already loaded
      if (!orgUsers[orgId]) {
        fetchOrganizationUsers(orgId);
      }
    }
    setExpandedOrgs(newExpanded);
  };

  const handleAddUserToOrganization = (organization: Organization) => {
    setSelectedOrgForUser(organization);
    setUserDialogOpen(true);
  };

  const handleCreateOrganizationUser = async (data: CreateOrganizationUserData) => {
    if (!selectedOrgForUser) return;
    
    const orgId = selectedOrgForUser.id; // Store the org ID before clearing selectedOrgForUser
    const isEditing = !!editingUser;
    
    try {
      setUserDialogLoading(true);
      
      if (isEditing && editingUser) {
        // Update existing user
        console.log('Updating user for org', orgId, 'with data:', data);
        const response = await organizationUserService.updateOrganizationUser(orgId, editingUser.id, data);
        console.log('User update response:', response);
        Helpers.toast("success", "User updated successfully");
      } else {
        // Create new user
        console.log('Creating user for org', orgId, 'with data:', data);
        const response = await organizationUserService.createOrganizationUser(orgId, data);
        console.log('User creation response:', response);
        Helpers.toast("success", "User created successfully");
      }
      
      // Refresh the user list before closing the dialog
      await fetchOrganizationUsers(orgId);
      
      setUserDialogOpen(false);
      setSelectedOrgForUser(null);
      setEditingUser(null);
    } catch (error: any) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} organization user:`, error);
      console.error("Error response:", error.response);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || `Failed to ${isEditing ? 'update' : 'create'} user`;
      Helpers.toast("error", `Error ${isEditing ? 'updating' : 'creating'} user: ${errorMsg}`);
    } finally {
      setUserDialogLoading(false);
    }
  };

  // New handler functions for user actions
  const handleResendSMS = async (user: OrganizationUserFull, organizationId: number) => {
    console.log('🚀 SMS BUTTON CLICKED!');
    console.log('📱 SMS Request Details:', {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        status: user.status
      },
      organizationId: organizationId,
      timestamp: new Date().toISOString()
    });
    
    try {
      console.log('📡 Starting SMS API call...');
      console.log('🔗 API Endpoint:', `/organizations/${organizationId}/users/${user.id}/send-sms`);
      
      await organizationUserService.sendSMSInvite(organizationId, user.id);
      
      console.log('✅ SMS API call completed successfully!');
      console.log('🎉 Showing success toast...');
      Helpers.toast("success", `SMS invite sent to ${user.firstName} ${user.lastName} at ${user.phone}`);
      
      console.log('🔄 Refreshing organization users list...');
      // Refresh the user list to show updated status
      await fetchOrganizationUsers(organizationId);
      console.log('✅ Organization users list refreshed!');
      
    } catch (error: any) {
      console.error("❌ ERROR SENDING SMS INVITE:", error);
      console.error("🔍 Error Details:", {
        message: error.message,
        response: error.response,
        responseData: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      const errorMessage = error.response?.data?.error || error.response?.data?.details || "Failed to send SMS invite";
      console.log('🚨 Showing error toast:', errorMessage);
      Helpers.toast("error", errorMessage);
    }
  };

  const handleEditUser = (user: OrganizationUserFull) => {
    setEditingUser(user);
    setSelectedOrgForUser(organizations.find(org => org.id === user.organizationId) || null);
    setUserDialogOpen(true);
  };

  const handleConfirmDeleteUser = (user: OrganizationUserFull, organizationId: number) => {
    setDeleteUserDialog({
      open: true,
      user,
      organizationId,
    });
  };

  const handleDeleteUser = async () => {
    if (!deleteUserDialog.user || !deleteUserDialog.organizationId) return;
    
    try {
      await organizationUserService.deleteOrganizationUser(
        deleteUserDialog.organizationId, 
        deleteUserDialog.user.id
      );
      Helpers.toast("success", "User deleted successfully");
      fetchOrganizationUsers(deleteUserDialog.organizationId);
      setDeleteUserDialog({ open: false, user: null, organizationId: null });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      Helpers.toast("error", error.response?.data?.error || "Failed to delete user");
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card w-full mx-auto shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-card-foreground">Organizations</CardTitle>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Organization
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((organization) => (
                <React.Fragment key={organization.id}>
                  <TableRow>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleOrganizationExpanded(organization.id)}
                      >
                        {expandedOrgs.has(organization.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{organization.name}</div>
                        {organization.description && (
                          <div className="text-sm text-muted-foreground">
                            {organization.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{organization.email || "-"}</TableCell>
                    <TableCell>{organization.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        <UsersIcon className="w-3 h-3 mr-1" />
                        {organization.userCount || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(organization.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingOrganization(organization);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setDeleteDialog({ open: true, organization })
                            }
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  
                  {expandedOrgs.has(organization.id) && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/50">
                        <div className="p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Organization Users</h4>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAddUserToOrganization(organization)}
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Add User
                            </Button>
                          </div>
                          
                          {orgUsers[organization.id] && orgUsers[organization.id].length > 0 ? (
                            <div className="grid gap-2">
                              {orgUsers[organization.id].map((user) => (
                                <div
                                  key={user.id}
                                  className="flex items-center justify-between p-3 border rounded-lg bg-background"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div>
                                      <div className="font-medium">
                                        {user.firstName} {user.lastName}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {user.email}
                                      </div>
                                      {user.phone && (
                                        <div className="text-sm text-muted-foreground">
                                          📞 {user.phone}
                                        </div>
                                      )}
                                    </div>
                                    <Badge 
                                      variant={getStatusInfo(user.status).variant}
                                      className={getStatusInfo(user.status).className}
                                    >
                                      {getStatusInfo(user.status).label}
                                    </Badge>
                                    <Badge variant={user.role === "admin" ? "destructive" : "outline"}>
                                      {user.role}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {/* Resend SMS Button */}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleResendSMS(user, organization.id)}
                                      title="Resend SMS"
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                    </Button>
                                    
                                    {/* Edit User Button */}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleEditUser(user)}
                                      title="Edit User"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    
                                    {/* Delete User Button */}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                      onClick={() => handleConfirmDeleteUser(user, organization.id)}
                                      title="Delete User"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center p-8 text-muted-foreground">
                              No users in this organization
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>

          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            disableNext={false}
            hidePaginationNumbers={false}
          />
        </CardContent>
      </Card>

      {/* Organization Create/Edit Dialog */}
      <OrganizationDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingOrganization(null);
          }
        }}
        organization={editingOrganization}
        onSubmit={editingOrganization ? handleUpdateOrganization : handleCreateOrganization}
        loading={dialogLoading}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open: boolean) => setDeleteDialog({ open, organization: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Organization</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.organization?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, organization: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteOrganization}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog
        open={deleteUserDialog.open}
        onOpenChange={(open: boolean) => setDeleteUserDialog({ open, user: null, organizationId: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteUserDialog.user?.firstName} {deleteUserDialog.user?.lastName}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteUserDialog({ open: false, user: null, organizationId: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Organization User Create/Edit Dialog */}
      <OrganizationUserDialog
        open={userDialogOpen}
        onOpenChange={(open) => {
          setUserDialogOpen(open);
          if (!open) {
            setSelectedOrgForUser(null);
            setEditingUser(null);
          }
        }}
        organizationId={selectedOrgForUser?.id || 0}
        organizationName={selectedOrgForUser?.name || ""}
        user={editingUser}
        onSubmit={handleCreateOrganizationUser}
        loading={userDialogLoading}
      />

      {/* Session Warning Dialog */}
      <SessionWarningDialog
        open={showWarning}
        onKeepLoggedIn={keepLoggedIn}
        onLogout={logout}
      />
    </div>
  );
};

export default Organizations;
