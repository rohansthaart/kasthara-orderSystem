import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function UsersPage() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Manage staff accounts and product defaults.</p>
      </div>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <thead><tr><Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Role</Th><Th>Status</Th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}><Td>{user.name}</Td><Td>{user.email}</Td><Td>{user.phone}</Td><Td><Badge>{user.role}</Badge></Td><Td>{user.isActive ? "Active" : "Inactive"}</Td></tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <thead><tr><Th>Product</Th><Th>Type</Th><Th>Default price</Th><Th>Status</Th></tr></thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}><Td>{product.name}</Td><Td>{product.productType}</Td><Td>NPR {Number(product.defaultPrice)}</Td><Td>{product.isActive ? "Active" : "Inactive"}</Td></tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
