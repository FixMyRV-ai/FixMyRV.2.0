import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import { useState, useEffect, useCallback } from "react";
import { User } from "@/types/auth";
import usersService from "@/services/admin/users.service";
import Pagination from "@/components/pagination";
import Helpers from "@/config/helpers";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await usersService.getUsers({
        page,
        limit: pageSize,
      });
      setUsers(response.data || []);
      setTotalItems(response.pagination?.totalItems || 0);
    } catch (error) {
      setError(error as string);
      Helpers.toast("error", "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (loading) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex justify-center items-center text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <Card className="bg-card w-full mx-auto shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-card-foreground">Users</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Email</TableHead>
              <TableHead className="text-muted-foreground">Chats</TableHead>
              <TableHead className="text-muted-foreground">Role</TableHead>
              <TableHead className="text-muted-foreground">Credits</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  No users found
                </TableCell>
              </TableRow>
            )}
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="border-b border-border hover:bg-muted/50"
              >
                <TableCell className="text-foreground">
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell className="text-foreground">{user.email}</TableCell>
                <TableCell className="text-foreground">
                  {user.chatCount}
                </TableCell>
                <TableCell className="text-foreground">{user.role}</TableCell>
                <TableCell className="text-foreground">
                  {user.credits}
                </TableCell>
                <TableCell className="text-foreground">
                  {user.verified ? (
                    <Badge
                      variant="outline"
                      className="bg-green-500 text-white"
                    >
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-500 text-white">
                      Inactive
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setPage(1); // Reset to the first page when page size changes
          }}
          disableNext={page * pageSize >= totalItems}
          hidePaginationNumbers={false}
        />
      </CardContent>
    </Card>
  );
};

export default Users;
